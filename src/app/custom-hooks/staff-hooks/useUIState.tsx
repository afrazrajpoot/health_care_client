// hooks/useUIState.ts (updated: removed handleCreateManualTask, fixed departments, fixed initial call)
import { useState, useEffect, useCallback } from "react";
import {
  tabs,
  paneToFilter,
  DEPARTMENTS_GM,
  DEPARTMENTS_WC,
  NOTE_PRESETS,
} from "@/components/staff-components/types";

export const useUIState = (initialMode: "wc" | "gm") => {
  const [currentPane, setCurrentPane] = useState<"all" | "overdue" | string>(
    "all"
  );
  const [filters, setFilters] = useState({
    search: "",
    overdueOnly: false,
    myDeptOnly: false,
    dept: "",
    status: "", // Add status filter
  });
  const [dense, setDense] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isOfficePulseCollapsed, setIsOfficePulseCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modeState, setModeState] = useState<"wc" | "gm">(initialMode);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const filteredTabs = tabs.filter((tab) => tab.modes.includes(modeState));
  const departments = [
    "Medical / Clinical Department",
    "Scheduling & Coordination Department",
    "Administrative / Compliance Department",
    "Authorizations & Denials Department",
  ];

  useEffect(() => {
    if (dense) {
      document.body.classList.add("dense");
    } else {
      document.body.classList.remove("dense");
    }
  }, [dense]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleClickOutside = (e: any) => {
      if (
        !e.target.closest(".sidebar-container") &&
        !e.target.closest(".toggle-btn")
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

  const getBaseTasks = useCallback(
    (tasks: any[]) =>
      tasks.filter((t) => {
        if (modeState === "wc" && t.mode === "gm") return false;
        if (modeState === "gm" && t.mode === "wc") return false;
        return true;
      }),
    [modeState]
  );

  const getFilteredTasks = useCallback((pane: string, baseTasks: any[]) => {
    return baseTasks.filter(
      paneToFilter[pane as keyof typeof paneToFilter] || (() => true)
    );
  }, []);

  const getDisplayedTasks = useCallback(
    (pane: string, tasks: any[]) => {
      let f = getFilteredTasks(pane, getBaseTasks(tasks));
      if (filters.overdueOnly) f = f.filter((t: any) => t.overdue);
      if (filters.myDeptOnly && filters.dept)
        f = f.filter((t: any) => t.dept === filters.dept);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        f = f.filter(
          (t: any) =>
            t.task.toLowerCase().includes(q) ||
            (t.patient && t.patient.toLowerCase().includes(q)) ||
            (t.dept && t.dept.toLowerCase().includes(q))
        );
      }
      return f;
    },
    [filters, getBaseTasks, getFilteredTasks]
  );

  const getPresets = useCallback((dept: string) => {
    return (
      NOTE_PRESETS[dept] ||
      NOTE_PRESETS["Physician Review"] || { type: [], more: [] }
    );
  }, []);

  return {
    currentPane,
    setCurrentPane,
    filters,
    setFilters,
    dense,
    setDense,
    showModal,
    setShowModal,
    showTaskModal,
    setShowTaskModal,
    isOfficePulseCollapsed,
    setIsOfficePulseCollapsed,
    isFiltersCollapsed,
    setIsFiltersCollapsed,
    isSidebarOpen,
    setIsSidebarOpen,
    modeState,
    setModeState,
    filteredTabs,
    departments,
    getBaseTasks,
    getFilteredTasks,
    getDisplayedTasks,
    getPresets,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCount,
    setTotalCount,
  };
};
