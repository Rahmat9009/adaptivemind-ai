import {
  CalendarCheck2,
  GraduationCap,
  House,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface PrimaryNavigationRoute {
  label: "Home" | "Dashboard" | "Tutor" | "Planner";
  href: "/" | "/dashboard" | "/tutor" | "/planner";
  icon: LucideIcon;
}

export const primaryNavigationRoutes: PrimaryNavigationRoute[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tutor", href: "/tutor", icon: GraduationCap },
  { label: "Planner", href: "/planner", icon: CalendarCheck2 },
];

export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
