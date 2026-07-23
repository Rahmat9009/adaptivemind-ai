import "server-only";

import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { load } from "cheerio";
import {
  MAX_EXTRACTED_SOURCE_CHARACTERS,
  type TutorSource,
  validateSourceUrl,
} from "@/lib/sources";
import { isPublicNetworkAddress } from "@/lib/url-security";
import { normalizeExtractedText } from "./text";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const textContentTypes = [
  "text/html",
  "text/plain",
  "application/xhtml+xml",
];

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

async function resolvePublicAddresses(hostname: string): Promise<ResolvedAddress[]> {
  const bareHostname = hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(bareHostname);
  const addresses = literalFamily
    ? [{ address: bareHostname, family: literalFamily as 4 | 6 }]
    : await lookup(bareHostname, { all: true, verbatim: true });

  if (!addresses.length || addresses.some(
    (entry) => !isPublicNetworkAddress(entry.address),
  )) {
    throw new Error("This host resolves to a network address that is not allowed.");
  }
  return addresses as ResolvedAddress[];
}

function requestPinnedUrl(
  url: URL,
  address: ResolvedAddress,
  signal?: AbortSignal,
): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Uint8Array;
}> {
  return new Promise((resolve, reject) => {
    const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;
    const request = requestImpl(
      {
        protocol: url.protocol,
        hostname: address.address,
        family: address.family,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        servername: url.hostname.replace(/^\[|\]$/g, ""),
        headers: {
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
          "Accept-Encoding": "identity",
          Host: url.host,
          "User-Agent": "AdaptiveMind-SourceReader/1.0",
        },
        signal,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let total = 0;

        response.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("The page is too large to process."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: new Uint8Array(Buffer.concat(chunks)),
          });
        });
      },
    );
    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error("The website took too long to respond."));
    });
    request.on("error", reject);
    request.end();
  });
}

async function fetchTextPage(
  initialUrl: URL,
  signal?: AbortSignal,
): Promise<{ finalUrl: URL; contentType: string; text: string }> {
  let currentUrl = initialUrl;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const validation = validateSourceUrl(currentUrl.toString());
    if (!validation.ok) throw new Error(validation.error);
    currentUrl = validation.url;

    const addresses = await resolvePublicAddresses(currentUrl.hostname);
    const response = await requestPinnedUrl(currentUrl, addresses[0], signal);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      const nextLocation = Array.isArray(location) ? location[0] : location;
      if (!nextLocation) throw new Error("The website returned an invalid redirect.");
      if (redirect === MAX_REDIRECTS) {
        throw new Error("The website redirected too many times.");
      }
      currentUrl = new URL(nextLocation, currentUrl);
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`The website returned HTTP ${response.status}.`);
    }

    const encoding = response.headers["content-encoding"];
    if (encoding && encoding !== "identity") {
      throw new Error("The website returned an unsupported compressed response.");
    }
    const rawContentType = response.headers["content-type"];
    const contentType = (
      Array.isArray(rawContentType) ? rawContentType[0] : rawContentType ?? ""
    ).split(";")[0].trim().toLowerCase();
    if (!textContentTypes.includes(contentType)) {
      throw new Error("This link does not return a readable text page.");
    }

    return {
      finalUrl: currentUrl,
      contentType,
      text: new TextDecoder("utf-8").decode(response.body),
    };
  }

  throw new Error("The website could not be retrieved.");
}

function extractReadablePage(
  html: string,
  contentType: string,
): { title: string; content: string } {
  if (contentType === "text/plain") {
    return {
      title: "Website text",
      content: normalizeExtractedText(html).slice(
        0,
        MAX_EXTRACTED_SOURCE_CHARACTERS,
      ),
    };
  }

  const $ = load(html);
  $("script,style,noscript,svg,canvas,nav,header,footer,aside,form").remove();
  const title = normalizeExtractedText(
    $("meta[property='og:title']").attr("content")
      ?? $("title").first().text()
      ?? $("h1").first().text()
      ?? "Website source",
  ).slice(0, 160);
  const article = $("article").first();
  const main = $("main").first();
  const root = article.length ? article : main.length ? main : $("body").first();
  const content = normalizeExtractedText(root.text()).slice(
    0,
    MAX_EXTRACTED_SOURCE_CHARACTERS,
  );
  return { title: title || "Website source", content };
}

export async function ingestWebsiteSource(
  input: string,
  signal?: AbortSignal,
): Promise<TutorSource> {
  const validation = validateSourceUrl(input.trim());
  if (!validation.ok) throw new Error(validation.error);

  const page = await fetchTextPage(validation.url, signal);
  const extracted = extractReadablePage(page.text, page.contentType);
  if (extracted.content.length < 80) {
    throw new Error(
      "The page did not expose enough readable content. It may require a sign-in or client-side loading.",
    );
  }

  return {
    id: crypto.randomUUID(),
    title: extracted.title,
    type: "website",
    mimeType: page.contentType,
    url: page.finalUrl.toString(),
    domain: page.finalUrl.hostname,
    sections: [{ label: page.finalUrl.toString(), content: extracted.content }],
    extractionNote:
      extracted.content.length >= MAX_EXTRACTED_SOURCE_CHARACTERS
        ? "Readable page text was limited to the first 40,000 characters."
        : undefined,
  };
}
