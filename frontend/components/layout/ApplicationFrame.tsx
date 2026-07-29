"use client";

import { usePathname } from "next/navigation";
import { AppNavigation } from "./AppNavigation";
import { Footer } from "./Footer";

export function ApplicationFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/") return children;

  const hideFooterRoutes = ["/assessment"];
  const showFooter = !hideFooterRoutes.some(route => pathname.startsWith(route));

  return (
    <>
      <AppNavigation />
      <div className="am-app-frame flex min-h-screen flex-col min-w-0 pb-24 sm:ml-16 sm:pb-0 lg:ml-56">
        <div className="flex-1">
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
    </>
  );
}
