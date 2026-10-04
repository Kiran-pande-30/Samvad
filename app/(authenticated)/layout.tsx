import { AppHeader } from "@/components/nav/AppHeader";
import { AppFooter } from "@/components/nav/AppFooter";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/data/auth";

// Server Component: checks the session so logged-out visitors on the landing
// page ("/") don't get the in-app tab bar.
const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return (
    <div className="fixed inset-0 flex justify-center">
      <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col">
        <AppHeader />
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
        {user && <AppFooter />}
      </div>
    </div>
  );
};

export default AppLayout;
