"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Heute",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/stundenplan",
    label: "Stundenplan",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/gym",
    label: "Gym",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <path d="M12 6.5v11" />
        <rect x="2" y="8" width="4" height="8" rx="1" />
        <rect x="18" y="8" width="4" height="8" rx="1" />
        <rect x="5" y="6" width="2" height="12" rx="0.5" />
        <rect x="17" y="6" width="2" height="12" rx="0.5" />
      </svg>
    ),
  },
  {
    href: "/noten",
    label: "Noten",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    href: "/deadlines",
    label: "Deadlines",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

function formatDateGerman(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return now.toLocaleDateString("de-DE", options);
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Header — Notion-style: clean white, no gradient */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900">MyDay</h1>
            <p className="text-xs text-neutral-400">{formatDateGerman()}</p>
          </div>
          <Link
            href="/einstellungen"
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Einstellungen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Bottom Navigation — Notion-style: subtle, no shadows */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/70 bg-white">
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  isActive
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                    isActive ? "bg-neutral-100 text-neutral-900" : ""
                  }`}
                >
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
