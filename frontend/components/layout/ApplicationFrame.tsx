"use client";

import { usePathname } from "next/navigation";
import { AppNavigation } from "./AppNavigation";

export function ApplicationFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/") return children;

  return (
    <>
      <AppNavigation />
      <div className="am-app-frame min-w-0 pb-24 sm:ml-16 sm:pb-0 lg:ml-56">
        {children}
      </div>
    </>
  );
}
