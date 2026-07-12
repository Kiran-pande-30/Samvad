import MobileNavBar from "@/components/nav/AppFooter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh pb-16">
      {children}
      {/* <MobileNavBar /> */}
    </div>
  );
}
