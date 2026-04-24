import type { CurrentUser } from "@/lib/types";
import { getPrimaryRole } from "@/lib/auth/roles";
import { NAVIGATION } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import Link from "next/link";

export function AppShell({
  currentUser,
  children
}: {
  currentUser: CurrentUser;
  children: React.ReactNode;
}) {
  const primaryRole = getPrimaryRole(currentUser.roleCodes);
  const navigation = primaryRole ? NAVIGATION[primaryRole] : [];

  return (
    <div className="flex min-h-screen">
      <Sidebar currentUser={currentUser} />
      <div className="min-w-0 flex-1">
        <Topbar currentUser={currentUser} />
        <nav className="sticky top-[73px] z-10 flex gap-2 overflow-x-auto border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-slate-700",
                "active:bg-accent-soft"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
