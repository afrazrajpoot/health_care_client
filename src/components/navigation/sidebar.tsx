"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; // ✅ import useSession and signOut
import {
  Home,
  FileText,
  Users,
  CheckSquare,
  Upload,
  Settings,
  Menu,
  X,
  Activity,
  LogOut, // ✅ Add LogOut icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  className?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  description?: string;
  roles?: string[]; // ✅ Add roles property
}

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and analytics",
    roles: ["Staff", "Physician", "Attorney"], // ✅ Both can access
  },
  {
    name: "Pricing",
    href: "/pricing",
    icon: Users,
    description: "Pricing and billing",
    roles: ["Physician"], // ✅ Physician only
  },
  {
    name: "Rebuttals",
    href: "/generate-rebuttal",

    icon: CheckSquare,
    // badge: "8",
    description: "Task management & assignments",
    roles: ["Physician"], // ✅ Both
  },
  {
    name: "Upload Documents",
    href: "/staff-dashboard",
    icon: Upload,
    description: "Upload and process documents",
    roles: ["Staff"], // ✅ Staff only
  },
  {
    name: "Recent Documents",
    href: "/staff-documents",
    icon: FileText,
    description: "Staff document management",
    roles: ["Staff"], // ✅ Staff only
  },
  {
    name: "Add Staff",
    href: "/add-staff",
    icon: Upload,
    description: "Add new staff members",
    roles: ["Physician"], // ✅ Staff only
  },
  {
    name: "Attorney Dashboard",
    href: "/attorney-dashboard",
    icon: Upload,
    description: "Attorney specific dashboard",
    roles: ["Attorney"], // ✅ Staff only
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession(); // ✅ get session

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  // ✅ Handle logout
  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/sign-in" }); // Redirect to home after logout; adjust as needed
  };

  // ✅ Filter menu items by user role
  const filteredItems = useMemo(() => {
    const role = session?.user?.role;
    return navigationItems.filter(
      (item) => !item.roles || item.roles.includes(role)
    );
  }, [session]);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-white/95"
        onClick={toggleMobile}
      >
        {isMobileOpen ? (
          <X size={20} className="text-gray-700" />
        ) : (
          <Menu size={20} className="text-gray-700" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white transition-all duration-300 ease-in-out lg:relative lg:z-0 shadow-lg border-r border-gray-200 w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#33c7d8] to-[#53d1df] rounded-xl flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">DocLatch</h2>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 border-2 border-gray-300 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-[#33c7d8] to-[#53d1df] text-white font-semibold">
                {session?.user?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {session?.user?.firstName || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Role-based Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-[#33c7d8] to-[#53d1df] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors shrink-0",
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-700"
                  )}
                />

                <div className="flex-1 min-w-0">
                  <span className="font-semibold block truncate text-sm">
                    {item.name}
                  </span>
                  {item.description && (
                    <span
                      className={cn(
                        "text-xs block truncate mt-0.5",
                        isActive ? "text-white/90" : "text-gray-500"
                      )}
                    >
                      {item.description}
                    </span>
                  )}
                </div>

                {item.badge && (
                  <Badge
                    className={cn(
                      "ml-auto text-xs px-2 py-1 font-semibold rounded-lg",
                      isActive
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-gray-200 text-gray-700 border-gray-300"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings size={20} className="shrink-0" />
            <span className="font-semibold text-sm">Settings</span>
          </Link>
          {/* ✅ Logout Button */}
          <Button
            variant="ghost"
            className="flex items-center gap-3 w-full justify-start px-3 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600 h-auto"
            onClick={handleLogout}
          >
            <LogOut size={20} className="shrink-0" />
            <span className="font-semibold text-sm">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
