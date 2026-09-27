"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/athlete", label: "Athlete" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/social-media", label: "Social Media" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/profile", label: "Profile" },
] as const;

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center border-b border-slate-200 px-5">
          <Link href="/admin" className="text-sm font-semibold tracking-wide text-slate-900">
            AZIZ CMS
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const exact = "exact" in item && item.exact;
              const active = exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export { NAV as ADMIN_NAV };
