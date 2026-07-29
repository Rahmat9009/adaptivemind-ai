import {
  CalendarCheck2,
  GraduationCap,
  House,
  LayoutDashboard,
  Download,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface PrimaryNavigationRoute {
  label: "Home" | "My Dashboard" | "Tutor" | "Planner" | "Downloads" | "Privacy";
  href: string;
  icon: LucideIcon;
}

export const primaryNavigationRoutes: PrimaryNavigationRoute[] = [
  { label: "Home", href: "/", icon: House },
  { label: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tutor", href: "/tutor", icon: GraduationCap },
  { label: "Planner", href: "/planner", icon: CalendarCheck2 },
  { label: "Downloads", href: "/downloads", icon: Download },
  { label: "Privacy", href: "/privacy", icon: Shield },
];

export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
