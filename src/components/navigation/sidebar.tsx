"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react"; // ✅ import useSession
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
  ChevronLeft,
  ChevronRight,
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
  // {
  //   name: "Documents",
  //   href: "/documents",
  //   icon: FileText,
  //   badge: "12",
  //   description: "Document processing & review",
  //   roles: ["Staff"], // ✅ Staff only
  // },
  {
    name: "Patients",
    href: "/patients",
    icon: Users,
    description: "Patient management",
    roles: ["Staff"], // ✅ Physician only
  },
  {
    name: "Fail Documents",
    href: "/fail-documents",

    icon: CheckSquare,
    badge: "8",
    description: "Task management & assignments",
    roles: ["Staff"], // ✅ Both
  },
  {
    name: "Upload Documents",
    href: "/upload-doc",
    icon: Upload,
    description: "Upload and process documents",
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession(); // ✅ get session

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

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
          "fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 transition-all duration-300 ease-in-out lg:relative lg:z-0 shadow-2xl",
          isCollapsed ? "w-16" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-white">HealthCare</h2>
                <p className="text-xs text-gray-400 font-medium">
                  AI Assistant
                </p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="hidden lg:flex text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-800">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <Avatar className="w-11 h-11 border-2 border-gray-700 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-slate-500 to-violet-500 text-white font-semibold">
                {session?.user?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {session?.user?.firstName || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
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
                    ? "bg-gradient-to-r from-slate-500 to-violet-500 text-white shadow-lg shadow-slate-500/25"
                    : "text-gray-300 hover:text-white hover:bg-gray-800 hover:shadow-md",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors shrink-0",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-white"
                  )}
                />

                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold block truncate text-sm">
                        {item.name}
                      </span>
                      {item.description && (
                        <span
                          className={cn(
                            "text-xs block truncate mt-0.5",
                            isActive ? "text-blue-100" : "text-gray-400"
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
                            : "bg-gray-700 text-gray-300 border-gray-600"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Settings size={20} className="shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold text-sm">Settings</span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
