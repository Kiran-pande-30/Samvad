"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/nav/AppHeader";
import { AppFooter } from "@/components/nav/AppFooter";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isLesson = pathname.startsWith("/lesson");

  return (
    <div className="fixed inset-0 flex justify-center">
      <div className={`w-full max-w-107.5 min-h-dvh bg-white flex flex-col ${isLesson ? "" : "pb-16"}`}>
        <AppHeader />
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
      </div>
      <AppFooter />
    </div>
  );
};

export default AppLayout;
