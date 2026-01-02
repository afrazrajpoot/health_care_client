import React from "react";
import { Sidebar } from "@/components/navigation/sidebar";

interface SidebarContainerProps {
  isOpen: boolean;
}

export const SidebarContainer = React.memo<SidebarContainerProps>(({ isOpen }) => (
  <div
    className={`fixed top-0 left-0 h-full w-80 z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="h-full">
      <Sidebar />
    </div>
  </div>
));