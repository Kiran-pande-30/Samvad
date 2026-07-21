"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: "home",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "person",
  },
] as const;

export const AppFooter = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/lesson")) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex w-full max-w-107.5 items-center justify-around bg-white border-t border-[#E5E7EB] h-16 px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ label, href, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] group"
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className="material-symbols-rounded text-[26px] leading-none transition-colors duration-150"
              style={{
                fontVariationSettings: isActive
                  ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                color: isActive ? "#0a0a0a" : "#9CA3AF",
              }}
              aria-hidden="true"
            >
              {icon}
            </span>
            <span
              className="text-[11px] font-medium leading-none transition-colors duration-150"
              style={{ color: isActive ? "#0a0a0a" : "#9CA3AF" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
