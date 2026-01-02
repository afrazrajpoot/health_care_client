import React from "react";

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarOverlay = React.memo<SidebarOverlayProps>(({ isOpen, onClose }) => (
  isOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-40"
      onClick={onClose}
    />
  )
));