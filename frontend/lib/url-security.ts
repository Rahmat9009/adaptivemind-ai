import { isIP } from "node:net";

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (
    octets.length !== 4
    || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [a, b, c] = octets;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224;
}
function expandIpv6(address: string): number[] | null {
  const normalized = address.toLowerCase().split("%")[0];
  const parts = normalized.split("::");
  if (parts.length > 2) return null;

  const parseSide = (side: string): number[] | null => {
    if (!side) return [];
    const values: number[] = [];
    for (const part of side.split(":")) {
      if (part.includes(".")) {
        const octets = part.split(".").map(Number);
        if (
          octets.length !== 4
          || octets.some((value) =>
            !Number.isInteger(value) || value < 0 || value > 255
          )
        ) return null;
        values.push((octets[0] << 8) | octets[1]);
        values.push((octets[2] << 8) | octets[3]);
      } else if (!/^[0-9a-f]{1,4}$/.test(part)) {
        return null;
      } else {
        values.push(Number.parseInt(part, 16));
      }
    }
    return values;
  };

  const left = parseSide(parts[0]);
  const right = parseSide(parts[1] ?? "");
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if (
    missing < 0
    || (parts.length === 1 && missing !== 0)
    || (parts.length === 2 && missing < 1)
  ) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function isBlockedIpv6(address: string): boolean {
  const words = expandIpv6(address);
  if (!words) return true;
  const [first, second] = words;

  const isMappedIpv4 = words.slice(0, 5).every((word) => word === 0)
    && words[5] === 0xffff;
  if (isMappedIpv4) {
    const mapped = [
      words[6] >> 8,
      words[6] & 0xff,
      words[7] >> 8,
      words[7] & 0xff,
    ].join(".");
    return isBlockedIpv4(mapped);
  }

  const isUnspecified = words.every((word) => word === 0);
  const isLoopback = words.slice(0, 7).every((word) => word === 0)
    && words[7] === 1;
  const isGlobalUnicast = (first & 0xe000) === 0x2000;
  const isUniqueLocal = (first & 0xfe00) === 0xfc00;
  const isLinkLocal = (first & 0xffc0) === 0xfe80;
  const isMulticast = (first & 0xff00) === 0xff00;
  const isDocumentation = first === 0x2001 && second === 0x0db8;
  const isTeredo = first === 0x2001 && second === 0;
  const isSixToFour = first === 0x2002;

  return isUnspecified
    || isLoopback
    || !isGlobalUnicast
    || isUniqueLocal
    || isLinkLocal
    || isMulticast
    || isDocumentation
    || isTeredo
    || isSixToFour;
}

export function isPublicNetworkAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, "");
  const family = isIP(normalized);
  if (family === 4) return !isBlockedIpv4(normalized);
  if (family === 6) return !isBlockedIpv6(normalized);
  return false;
}
