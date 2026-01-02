import React from "react";
import Link from "next/link";
import { BurgerIcon } from "./BurgerIcon";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  staffDashboardHref: string;
  mode: "wc" | "gm";
  onModeChange: (mode: "wc" | "gm") => void;
  session: any;
  staffButtonRef: React.RefObject<HTMLAnchorElement>;
  modeSelectorRef: React.RefObject<HTMLSelectElement>;
}

export const Header = React.memo<HeaderProps>(({
  isSidebarOpen,
  onToggleSidebar,
  staffDashboardHref,
  mode,
  onModeChange,
  session,
  staffButtonRef,
  modeSelectorRef,
}) => (
  <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[1000] px-5 py-3 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Toggle sidebar"
      >
        <BurgerIcon />
      </button>
    </div>
    <div className="absolute left-1/2 -translate-x-1/2">
      <img
        src="/logo.png"
        alt="DocLatch Logo"
        className="h-16 w-auto"
      />
    </div>
    <div className="flex items-center gap-4">
      {session.user.role === "Physician" && (
        <Link href={staffDashboardHref} ref={staffButtonRef}>
          <button className="font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            Staff Dashboard
          </button>
        </Link>
      )}
      <select
        id="mode"
        className="bg-indigo-50 text-gray-900 border border-blue-200 rounded-lg p-2 font-semibold focus:outline-none"
        value={mode}
        onChange={(e) => onModeChange(e.target.value as "wc" | "gm")}
        ref={modeSelectorRef}
        title="Filter search by mode (Workers Comp or General Medicine)"
      >
        <option value="wc">Workers Comp</option>
        <option value="gm">General Medicine</option>
      </select>
    </div>
  </div>
));