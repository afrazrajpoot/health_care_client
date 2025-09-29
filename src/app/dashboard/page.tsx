"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Bell,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface DocumentAction {
  type: string;
  reason: string;
  assignee: string;
  due_date: string;
  action_id: string;
  created_at: string;
  suggestion: boolean;
  auto_create: boolean;
  source_doc_id: string;
  deterministic_rule_id: string;
}

interface Document {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  pages: number;
  confidence: number;
  entities: unknown[];
  tables: unknown[];
  formFields: unknown[];
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
  actions: DocumentAction[];
  complianceNudges: ComplianceNudge[];
  referrals: Referral[];
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
  title: string;
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
  lastchanges: string[];
  createdAt: string;
  actions: DocumentAction[];
}

interface DeadlineAlert {
  id: string;
  title: string;
  patientName: string;
  dueDate: string;
}

interface ComplianceNudge {
  type: string;
  reason: string;
  assignee: string;
  due_date: string;
  nudge_id: string;
  created_at: string;
}

interface Referral {
  reason: string;
  assignee: string;
  due_date: string;
  specialty: string;
  created_at: string;
  referral_id: string;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<{ patientNames: string[], claimNumbers: string[] }>({ patientNames: [], claimNumbers: [] });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workStatusAlerts, setWorkStatusAlerts] = useState<WorkStatusAlert[]>(
    []
  );
  const [documentAlerts, setDocumentAlerts] = useState<DocumentAlert[]>([]);
  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([]);
  const [complianceNudges, setComplianceNudges] = useState<ComplianceNudge[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  const [expandedNewItems, setExpandedNewItems] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Current date as per the prompt (September 24, 2025)
  const currentDate = new Date("2025-09-24");

  const toggleSummary = (id: string) => {
    setExpandedSummaries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper function to detect if search term looks like a claim number
  const isClaimNumber = (term: string): boolean => {
    // Common claim number patterns: contains numbers, dashes, or starts with specific prefixes
    return /^\d+[-\d]*$|^WC[-\d]+|^[A-Z]{2,3}[-\d]+|^\d{4}-\d+/.test(term.trim());
  };

  const parseLastChanges = (lastChangesString: string | null): string[] => {
    if (!lastChangesString) {
      return [];
    }

    try {
      const parsed = JSON.parse(lastChangesString);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            typeof item === "string" ? item.trim() : String(item)
          )
          .filter(Boolean);
      }
    } catch (error) {
      console.error("Error parsing lastchanges:", error);
    }

    return lastChangesString
      .replace(/[\[\]"]+/g, "")
      .split(/,\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  // Fetch suggestions when typing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.trim() === "") {
        setSuggestions({ patientNames: [], claimNumbers: [] });
        setIsDropdownOpen(false);
        return;
      }

      try {
        const term = searchTerm.trim();
        const isClaimSearch = isClaimNumber(term);

        // Build query parameters based on search type
        const queryParams = new URLSearchParams();
        if (isClaimSearch) {
          queryParams.append('claimNumber', term);
        } else {
          queryParams.append('patientName', term);
        }

        const response = await fetch(
          `/api/dashboard/recommendation?${queryParams.toString()}`
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setSuggestions(result.data);
          setIsDropdownOpen(true);
        } else {
          setSuggestions({ patientNames: [], claimNumbers: [] });
          setIsDropdownOpen(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions({ patientNames: [], claimNumbers: [] });
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
      setComplianceNudges([]);
      setReferrals([]);
      setError(null);
      setIsDropdownOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsDropdownOpen(false);

    try {
      const term = searchTerm.trim();
      const isClaimSearch = isClaimNumber(term);

      // Build query parameters based on search type
      const queryParams = new URLSearchParams();
      if (isClaimSearch) {
        queryParams.append('claimNumber', term);
      } else {
        queryParams.append('patientName', term);
      }

      const response = await fetch(
        `/api/dashboard/search-patient?${queryParams.toString()}`
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
                title: alert.title,
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
            const actions = Array.isArray(doc.actions) ? doc.actions : [];
            return {
              id: doc.id,
              originalName: doc.originalName,
              patientName: doc.patientName,
              daysOld,
              urgent: doc.status === "urgent",
              gcsFileLink: doc.gcsFileLink,
              reportTitle: doc.reportTitle,
              summary: doc.summary,
              lastchanges: parseLastChanges(doc.lastchanges),
              createdAt: doc.createdAt,
              actions,
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

        // Map compliance nudges from all documents
        const mappedComplianceNudges: ComplianceNudge[] = result.data.flatMap(
          (doc: Document) => doc.complianceNudges || []
        );
        setComplianceNudges(mappedComplianceNudges);

        // Map referrals from all documents
        const mappedReferrals: Referral[] = result.data.flatMap(
          (doc: Document) => doc.referrals || []
        );
        setReferrals(mappedReferrals);

      } else {
        console.error("Error fetching data:", result.error);
        setError(result.error || "Failed to fetch patient data");
        setPatients([]);
        setWorkStatusAlerts([]);
        setDocumentAlerts([]);
        setDeadlineAlerts([]);
        setComplianceNudges([]);
        setReferrals([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An unexpected error occurred");
      setPatients([]);
      setWorkStatusAlerts([]);
      setDocumentAlerts([]);
      setDeadlineAlerts([]);
      setComplianceNudges([]);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
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
    if (searchTerm.trim() !== "" && (suggestions.patientNames.length > 0 || suggestions.claimNumbers.length > 0)) {
      setIsDropdownOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
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
    } else if (e.key === "ArrowDown" && (suggestions.patientNames.length > 0 || suggestions.claimNumbers.length > 0)) {
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

  const latestDocumentAlert = documentAlerts.reduce<DocumentAlert | null>(
    (latest, current) => {
      if (!latest) {
        return current;
      }
      return new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest;
    },
    null
  );

  const latestDocumentId = latestDocumentAlert?.id ?? null;

  // Transform document alerts into new items format
  const newItems = documentAlerts.map((doc) => {
    const shortSummary = doc.summary.length > 0 ? doc.summary.slice(0, 2) : [];
    const fullSummary = doc.summary.length > 0 ? doc.summary.join(" ") : "";

    return {
      id: doc.id,
      icon: <FileText className="w-4 h-4" />,
      type: doc.reportTitle.includes("MRI")
        ? "MRI"
        : doc.reportTitle.includes("Ortho")
          ? "Ortho Consult"
          : doc.reportTitle.includes("UR") || doc.reportTitle.includes("Denial")
            ? "UR Denial"
            : "Report",
      title: doc.reportTitle,
      date: new Date(
        currentDate.getTime() - doc.daysOld * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      }),
      hasSummary: doc.summary.length > 0,
      isAlert: doc.urgent,
      summary: {
        short: shortSummary,
        full: fullSummary,
      },
      patientName: doc.patientName,
      gcsFileLink: doc.gcsFileLink,
      lastChanges: doc.lastchanges,
      showLastChanges: latestDocumentId ? doc.id === latestDocumentId : false,
    };
  });

  // Transform work status alerts and referrals into orders format
  const pendingOrders = [
    ...workStatusAlerts.filter(alert => alert.status !== 'COMPLETED').map((alert, index) => ({
      id: `alert-${index + 1}`,
      type: alert.status,
      status: `${alert.daysOverdue} days overdue`,
      title: alert.title,
      color: alert.severity === 'critical' ? 'red' : 'yellow'
    })),
    ...referrals.map((referral, index) => ({
      id: `referral-${index + 1}`,
      type: `${referral.specialty} Referral`,
      title: referral.reason,
      status: `due ${new Date(referral.due_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}`,
      color: 'yellow'
    }))
  ];

  const completedOrders = workStatusAlerts.filter(alert => alert.status === 'COMPLETED').map((alert, index) => ({
    id: `completed-${index + 1}`,
    type: alert.status,
    status: `completed ${alert.lastUpdate}`,
    title: alert.title,
    color: 'green'
  }));

  const orders = {
    pending: pendingOrders,
    completed: completedOrders
  };

  // Transform compliance nudges and deadline alerts into compliance items
  const complianceItems = [
    ...complianceNudges.map((nudge) => ({
      id: nudge.nudge_id,
      text: `${nudge.reason} - Due ${new Date(nudge.due_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}`,
      urgent: true
    })),
    ...deadlineAlerts.map((alert) => ({
      id: alert.id,
      text: `${alert.title} - ${alert.patientName}`,
      urgent: true
    }))
  ];

  // Get current patient data
  const currentPatient = patients.length > 0 ? patients[0] : null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-gray-600">Welcome back. Here&apos;s what&apos;s happening today.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Bar in Header */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <Input
                      ref={inputRef}
                      placeholder="Search patients or claim numbers..."
                      value={searchTerm}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      className="pl-10 h-9 w-64 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all duration-200 relative z-20 text-sm"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 text-sm"
                    disabled={loading}
                  >
                    {loading ? "..." : "Search"}

                  </Button>
                </div>

                {/* Custom Dropdown Implementation */}
                {isDropdownOpen && (suggestions.patientNames.length > 0 || suggestions.claimNumbers.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
                    <div className="p-1">
                      {suggestions.patientNames.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Patients
                          </div>
                          {suggestions.patientNames.map((suggestion) => (
                            <button
                              key={`patient-${suggestion}`}
                              data-suggestion-item
                              onClick={() => handleSelectSuggestion(suggestion)}
                              onMouseDown={(e) => e.preventDefault()}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-150 focus:bg-blue-50 focus:text-blue-700 focus:outline-none"
                              tabIndex={0}
                            >
                              <span className="font-medium truncate">
                                {suggestion}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {suggestions.claimNumbers.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Claim Numbers
                          </div>
                          {suggestions.claimNumbers.map((suggestion) => (
                            <button
                              key={`claim-${suggestion}`}
                              data-suggestion-item
                              onClick={() => handleSelectSuggestion(suggestion)}
                              onMouseDown={(e) => e.preventDefault()}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors duration-150 focus:bg-blue-50 focus:text-blue-700 focus:outline-none"
                              tabIndex={0}
                            >
                              <span className="font-medium truncate">
                                {suggestion}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
              <Settings className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        {/* hide scrollbar thumb and track */}
        <main className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Patient Snapshot Header */}
            {currentPatient && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">{currentPatient.name}</h2>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">DOI: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">Claim #{currentPatient.claimNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Work Status: Current</span>
                    </div>
                    <span className="text-gray-500">|</span>
                    <span className="text-sm text-gray-600">Last Visit: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* What's New Since Last Visit */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    What&apos;s New Since Last Visit
                  </h3>
                  <button
                    onClick={() => setExpandedNewItems(!expandedNewItems)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    {expandedNewItems ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {expandedNewItems ? 'Collapse' : 'Expand to view more new items'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {loading && (
                    <p className="text-sm text-gray-500 text-center">Loading...</p>
                  )}
                  {!loading && newItems.length === 0 && searchTerm.trim() !== "" && (
                    <p className="text-sm text-gray-500 text-center">No new items found</p>
                  )}
                  {!loading && newItems.slice(0, expandedNewItems ? newItems.length : 3).map((item) => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg ${item.isAlert ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <div className="flex-1">

                        {item.showLastChanges && item.lastChanges && item.lastChanges.length > 0 && (
                          <ul className="mt-2 ml-6 list-disc space-y-1 text-sm text-gray-700">
                            {item.lastChanges.map((change: string, idx: number) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Report Summaries */}
            {newItems.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Report Summaries
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {newItems.map((item) => (
                      <div key={item.id} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {item.icon}
                              <span className="font-semibold">{item.type} {item.title} ({item.date}):</span>
                            </div>
                            <ul className="space-y-1 mb-3">
                              {item.summary.short.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span className="text-gray-700">{point}</span>
                                </li>
                              ))}
                            </ul>
                            {expandedSummaries[item.id] && (
                              <div className="bg-gray-50 p-4 rounded-lg mb-3">
                                <p className="text-gray-700 leading-relaxed">{item.summary.full}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => toggleSummary(item.id)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                {expandedSummaries[item.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                {expandedSummaries[item.id] ? 'Collapse summary' : 'Expand for full summary'}
                              </button>
                              <a
                                href={item.gcsFileLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Report
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Orders & Referrals Summary */}
            {(orders.pending.length > 0 || orders.completed.length > 0) && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    Orders & Referrals Summary
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        Pending:
                      </h4>
                      <div className="space-y-2">
                        {orders.pending.map((order) => (
                          <div key={order.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="font-medium">{order.type}</span>
                            <span className="text-gray-600">-- {order.status}</span>
                            <p className="text-gray-600"> {order.title}</p>
                          </div>
                        ))}
                        {orders.pending.length === 0 && (
                          <p className="text-sm text-gray-500">No pending orders</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Completed:
                      </h4>
                      <div className="space-y-2">
                        {orders.completed.map((order) => (
                          <div key={order.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-medium">{order.type}</span>
                            <span className="text-gray-600">-- {order.status}</span>
                          </div>
                        ))}
                        {orders.completed.length === 0 && (
                          <p className="text-sm text-gray-500">No completed orders</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                      <ChevronRight className="w-4 h-4" />
                      View More
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Nudges */}
            {complianceItems.length > 0 && (
              <div className="bg-white rounded-lg border border-red-200">
                <div className="p-6 border-b border-red-200 bg-red-50">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    Compliance Nudges
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {complianceItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Show message when no data is available */}
            {!loading && searchTerm.trim() === "" && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for a Patient or Claim</h3>
                <p className="text-gray-600">Use the search bar above to find patient information by name or claim number and view their dashboard.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
