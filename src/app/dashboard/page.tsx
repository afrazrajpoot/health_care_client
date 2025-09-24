"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  AlertTriangle,
  Clock,
  ChevronRight,
  FileText,
  User,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define interfaces based on API data structure
interface Alert {
  id: string;
  alertType: string;
  title: string;
  date: string;
  status: string;
  description: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  pages: number;
  confidence: number;
  entities: any[];
  tables: any[];
  formFields: any[];
  patientName: string;
  patientEmail: string | null;
  claimNumber: string | null;
  reportTitle: string;
  reportDate: string;
  status: string;
  summary: string[];
  originalReport: string;
  processingTimeMs: number;
  analysisSuccess: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  gcsFileLink: string;
  lastchanges: string;
  alerts: Alert[];
}

interface Patient {
  id: string;
  name: string;
  claimId: string | null;
  claimNumber: string | null;
}

interface WorkStatusAlert {
  id: string;
  patientName: string;
  status: string;
  daysOverdue: number;
  lastUpdate: string;
  severity: "alert" | "critical";
}

interface DocumentAlert {
  id: string;
  originalName: string;
  patientName: string;
  daysOld: number;
  urgent: boolean;
  gcsFileLink: string;
  reportTitle: string;
  summary: string[];
}

interface DeadlineAlert {
  id: string;
  title: string;
  patientName: string;
  dueDate: string;
}

interface LastChange {
  id: string;
  patientName: string;
  lastchanges: string;
  reportTitle: string;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workStatusAlerts, setWorkStatusAlerts] = useState<WorkStatusAlert[]>(
    []
  );
  const [documentAlerts, setDocumentAlerts] = useState<DocumentAlert[]>([]);
  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([]);
  const [lastChanges, setLastChanges] = useState<LastChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Current date as per the prompt (September 24, 2025)
  const currentDate = new Date("2025-09-24");

  // Fetch suggestions when typing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.trim() === "") {
        setSuggestions([]);
        setIsDropdownOpen(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/dashboard/recommendation?patientName=${encodeURIComponent(
            searchTerm
          )}`
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setSuggestions(result.data);
          setIsDropdownOpen(true);
        } else {
          setSuggestions([]);
          setIsDropdownOpen(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    };

    const delayDebounceFn = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search button click
  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      setPatients([]);
      setWorkStatusAlerts([]);
      setDocumentAlerts([]);
      setDeadlineAlerts([]);
      setLastChanges([]);
      setError(null);
      setIsDropdownOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsDropdownOpen(false);

    try {
      const response = await fetch(
        `/api/dashboard/search-patient?patientName=${encodeURIComponent(
          searchTerm
        )}`
      );
      const result = await response.json();

      if (response.ok && result.success) {
        const uniquePatientsMap = new Map<string, Patient>();
        result.data.forEach((doc: Document) => {
          if (!uniquePatientsMap.has(doc.patientName)) {
            uniquePatientsMap.set(doc.patientName, {
              id: doc.id,
              name: doc.patientName,
              claimId: doc.claimNumber,
              claimNumber: doc.claimNumber,
            });
          }
        });
        const mappedPatients = Array.from(uniquePatientsMap.values());
        setPatients(mappedPatients);

        const mappedWorkStatusAlerts: WorkStatusAlert[] = result.data.flatMap(
          (doc: Document) =>
            doc.alerts.map((alert: Alert) => {
              const alertDate = new Date(alert.date);
              const daysOverdue = Math.max(
                0,
                Math.floor(
                  (currentDate.getTime() - alertDate.getTime()) /
                    (1000 * 3600 * 24)
                )
              );
              return {
                id: alert.id,
                patientName: doc.patientName,
                status: alert.alertType.toUpperCase(),
                daysOverdue,
                lastUpdate: alert.date.split("T")[0].replace(/-/g, "/"),
                severity: alert.status === "urgent" ? "critical" : "alert",
              };
            })
        );
        setWorkStatusAlerts(mappedWorkStatusAlerts);

        const mappedDocumentAlerts: DocumentAlert[] = result.data.map(
          (doc: Document) => {
            const docDate = new Date(doc.createdAt);
            const daysOld = Math.floor(
              (currentDate.getTime() - docDate.getTime()) / (1000 * 3600 * 24)
            );
            return {
              id: doc.id,
              originalName: doc.originalName,
              patientName: doc.patientName,
              daysOld,
              urgent: doc.status === "urgent",
              gcsFileLink: doc.gcsFileLink,
              reportTitle: doc.reportTitle,
              summary: doc.summary,
            };
          }
        );
        setDocumentAlerts(mappedDocumentAlerts);

        const mappedDeadlineAlerts: DeadlineAlert[] = result.data.flatMap(
          (doc: Document) =>
            doc.alerts
              .filter(
                (alert: Alert) =>
                  alert.status === "urgent" &&
                  new Date(alert.date) <= currentDate
              )
              .map((alert: Alert) => ({
                id: alert.id,
                title: alert.title,
                patientName: doc.patientName,
                dueDate: "Today",
              }))
        );
        setDeadlineAlerts(mappedDeadlineAlerts);

        const mappedLastChanges: LastChange[] = result.data.map(
          (doc: Document) => ({
            id: doc.id,
            patientName: doc.patientName,
            lastchanges: doc.lastchanges,
            reportTitle: doc.reportTitle,
          })
        );
        setLastChanges(mappedLastChanges);
      } else {
        console.error("Error fetching data:", result.error);
        setError(result.error || "Failed to fetch patient data");
        setPatients([]);
        setWorkStatusAlerts([]);
        setDocumentAlerts([]);
        setDeadlineAlerts([]);
        setLastChanges([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An unexpected error occurred");
      setPatients([]);
      setWorkStatusAlerts([]);
      setDocumentAlerts([]);
      setDeadlineAlerts([]);
      setLastChanges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSummary = (summary: string[]) => {
    setSelectedSummary(summary);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setIsDropdownOpen(false);
    // Focus input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (searchTerm.trim() !== "" && suggestions.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Small delay to allow for click events on dropdown items
    setTimeout(() => {
      if (!isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    }, 150);
  };

  // Handle key navigation for dropdown and input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
      setIsDropdownOpen(false);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setIsDropdownOpen(true);
      // Focus first dropdown item
      const firstItem = document.querySelector(
        "[data-suggestion-item]"
      ) as HTMLElement;
      if (firstItem) {
        firstItem.focus();
      }
    }
  };

  // Handle input change with better state management
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Close dropdown when clearing input
    if (value.trim() === "") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back. Here's what's happening today.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Active Patient
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="relative" ref={dropdownRef}>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                      <Input
                        ref={inputRef}
                        placeholder="Search for a patient..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        className="pl-11 h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all duration-200 relative z-20"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                      disabled={loading}
                    >
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  {/* Custom Dropdown Implementation */}
                  {isDropdownOpen && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="p-1">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            data-suggestion-item
                            onClick={() => handleSelectSuggestion(suggestion)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-150 focus:bg-blue-50 focus:text-blue-700 focus:outline-none"
                            tabIndex={0}
                          >
                            <span className="font-medium truncate">
                              {suggestion}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {loading && (
                  <p className="text-sm text-gray-500 text-center">
                    Loading...
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                {!loading &&
                  !error &&
                  patients.length === 0 &&
                  searchTerm.trim() !== "" && (
                    <p className="text-sm text-gray-500 text-center">
                      No patients found
                    </p>
                  )}
                {!loading && !error && patients.length > 0 && (
                  <div className="space-y-3">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {patient.name}{" "}
                            {patient.claimId && (
                              <span className="text-gray-500 font-normal">
                                — {patient.claimId}
                              </span>
                            )}
                          </p>
                          {patient.claimNumber && (
                            <p className="text-sm text-gray-500 mt-1">
                              Claim {patient.claimNumber}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Changes Since Last Visit
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {loading && (
                  <p className="text-sm text-gray-500 text-center">
                    Loading...
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                {!loading &&
                  !error &&
                  lastChanges.length === 0 &&
                  searchTerm.trim() !== "" && (
                    <p className="text-sm text-gray-500 text-center">
                      No changes found
                    </p>
                  )}
                {!loading && !error && lastChanges.length > 0 && (
                  <div
                    key={lastChanges[lastChanges.length - 1].id}
                    className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    <p className="font-semibold text-sm text-gray-900">
                      {lastChanges[lastChanges.length - 1].reportTitle}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {lastChanges[lastChanges.length - 1].patientName}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {lastChanges[lastChanges.length - 1].lastchanges}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:row-span-2 shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Work Status Alerts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {loading && (
                  <p className="text-sm text-gray-500 text-center">
                    Loading...
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                {!loading &&
                  !error &&
                  workStatusAlerts.length === 0 &&
                  searchTerm.trim() !== "" && (
                    <p className="text-sm text-gray-500 text-center">
                      No alerts found
                    </p>
                  )}
                {!loading &&
                  !error &&
                  workStatusAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-sm ${
                        alert.severity === "critical"
                          ? "bg-red-50 border-l-red-500 hover:bg-red-100"
                          : "bg-amber-50 border-l-amber-500 hover:bg-amber-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle
                              className={`w-4 h-4 ${
                                alert.severity === "critical"
                                  ? "text-red-600"
                                  : "text-amber-600"
                              }`}
                            />
                            <p className="font-semibold text-sm text-gray-900">
                              {alert.patientName} — {alert.status}
                            </p>
                            {/* <Badge
                              variant="outline"
                              className={`text-xs font-medium ${
                                alert.severity === "critical"
                                  ? "border-red-300 text-red-700"
                                  : "border-amber-300 text-amber-700"
                              }`}
                            >
                              {alert.daysOverdue} days
                            </Badge> */}
                          </div>
                          <p className="text-xs text-gray-600 ml-7">
                            Last updated {alert.lastUpdate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                <Button
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
                  size="sm"
                >
                  Open Task
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      New Since Check-in
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Aging Alerts</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {loading && (
                  <p className="text-sm text-gray-500 text-center">
                    Loading...
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                {!loading &&
                  !error &&
                  documentAlerts.length === 0 &&
                  searchTerm.trim() !== "" && (
                    <p className="text-sm text-gray-500 text-center">
                      No documents found
                    </p>
                  )}
                {!loading &&
                  !error &&
                  documentAlerts.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            doc.urgent ? "bg-red-500" : "bg-amber-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {doc.reportTitle}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {doc.patientName} • {doc.daysOld} days old
                          </p>
                        </div>
                        {doc.urgent && (
                          <Badge
                            variant="destructive"
                            className="text-xs font-medium bg-red-100 text-red-700 border-red-200"
                          >
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenSummary(doc.summary)}
                              className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                            >
                              Summary
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Document Summary</DialogTitle>
                              <DialogDescription>
                                Summary for {doc.reportTitle}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-64 w-full rounded-md border p-4">
                              <ul className="list-disc list-inside space-y-2 text-sm">
                                {selectedSummary.map((item, index) => (
                                  <li key={index} className="text-gray-800">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        <a
                          href={doc.gcsFileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                          >
                            View GCS
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
