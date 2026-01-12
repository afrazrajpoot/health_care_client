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
  onUploadDocument?: () => void;
}

export const Header = React.memo<HeaderProps>(
  ({
    isSidebarOpen,
    onToggleSidebar,
    staffDashboardHref,
    mode,
    onModeChange,
    session,
    staffButtonRef,
    modeSelectorRef,
    onUploadDocument,
  }) => (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[1000] px-5 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
          aria-label="Toggle sidebar"
        >
          <BurgerIcon />
        </button>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <img src="/logo.png" alt="DocLatch Logo" className="h-16 w-auto" />
      </div>
      <div className="flex items-center gap-4">
        {session.user.role === "Physician" && (
          <Link href={staffDashboardHref} ref={staffButtonRef}>
            <button className="font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-md transition-all duration-200 active:scale-95 shadow-sm">
              Staff Dashboard
            </button>
          </Link>
        )}
        {onUploadDocument && (
          <button
            className="flex items-center gap-2 border border-blue-200 bg-gradient-to-r from-blue-50 to-white text-blue-700 rounded-lg px-4 py-2.5 font-semibold cursor-pointer hover:bg-blue-50 hover:shadow-sm transition-all duration-200 active:scale-95"
            onClick={onUploadDocument}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <img
              src="/logo.png"
              alt="Upload Icon"
              className="inline-block mr-2 w-[3vw] h-[3vw]"
            />
          </button>
        )}
        <div className="relative">
          <select
            id="mode"
            className="appearance-none bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-900 border border-blue-200 rounded-lg px-4 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer pr-10 transition-all hover:shadow-sm"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as "wc" | "gm")}
            ref={modeSelectorRef}
            title="Filter search by mode (Workers Comp or General Medicine)"
          >
            <option value="wc">Workers Comp</option>
            <option value="gm">General Medicine</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
);
