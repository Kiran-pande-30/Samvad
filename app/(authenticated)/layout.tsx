import MobileNavBar from "@/components/MobileNavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh pb-16">
      {children}
      <MobileNavBar />
    </div>
  );
}
