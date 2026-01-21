import React from "react";
import Link from "next/link";
import {
  Upload,
  ChevronDown,
  Users,
  Briefcase,
  Stethoscope,
} from "lucide-react";

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
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[1000] px-5 py-4 flex items-center justify-between shadow-sm">
      {/* Left Side - Menu Button */}
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <div className="flex flex-col gap-1 w-6">
            <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${isSidebarOpen ? 'opacity-0' : ''}`}></div>
            <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </div>
        </button>
      </div>

      {/* Center - Prominent Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <img src="/logo.png" alt="DocLatch Logo" className="h-16 w-auto" />
      </div>

      {/* Right Side - Buttons */}
      <div className="flex items-center gap-3">
        {/* Staff Dashboard Button */}
        <Link href={staffDashboardHref} ref={staffButtonRef}>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
            <Users size={18} />
            <span>Staff</span>
          </button>
        </Link>

        {/* Upload Document Button */}
        {onUploadDocument && (
          <button
            className="flex items-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            onClick={onUploadDocument}
          >
            <Upload size={18} />
            <span>Upload</span>
          </button>
        )}

        {/* Mode Selector */}
        <div className="relative">
          <select
            id="mode"
            className="appearance-none bg-white border border-gray-300 text-gray-900 px-4 py-2.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer pr-10 hover:border-gray-400 transition-colors"
            value={mode}
            onChange={(e) => onModeChange(e.target.value as "wc" | "gm")}
            ref={modeSelectorRef}
          >
            <option value="wc" className="flex items-center gap-2 py-2">
              <Briefcase size={14} className="inline mr-2" />
              Workers Comp
            </option>
            <option value="gm" className="flex items-center gap-2 py-2">
              <Stethoscope size={14} className="inline mr-2" />
              General Medicine
            </option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  )
);