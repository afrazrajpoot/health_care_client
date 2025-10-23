// components/dashboard/SidebarWrapper.tsx
import { useEffect } from "react";
import { Sidebar } from "@/components/navigation/sidebar";

interface SidebarWrapperProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  isSidebarOpen: boolean;
}

export default function SidebarWrapper({
  isOpen,
  onToggle,
  isSidebarOpen,
}: SidebarWrapperProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: any) => {
      if (
        !e?.target?.closest(".sidebar-container") &&
        !e?.target?.closest(".toggle-btn")
      ) {
        onToggle(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Sidebar Component */}
      <div
        className={`sidebar-container fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full">
          <Sidebar onClose={() => onToggle(false)} />
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <div
        className={`toggle-btn fixed top-4 z-50 h-8 w-8 cursor-pointer flex items-center justify-center transition-all duration-300 rounded-full ${
          isSidebarOpen
            ? "left-64 bg-transparent hover:bg-transparent shadow-none"
            : "left-4 bg-gray-200 hover:bg-gray-300 shadow-md"
        }`}
        onClick={() => onToggle(!isOpen)}
        title={isOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        <div className="flex flex-col items-center justify-center w-4 h-4">
          <div
            className={`w-4 h-0.5 bg-gray-700 mb-1 transition-all duration-200 ${
              isOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          ></div>
          <div
            className={`w-4 h-0.5 bg-gray-700 mb-1 transition-all duration-200 ${
              isOpen ? "opacity-0" : ""
            }`}
          ></div>
          <div
            className={`w-4 h-0.5 bg-gray-700 transition-all duration-200 ${
              isOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          ></div>
        </div>
      </div>
    </>
  );
}
