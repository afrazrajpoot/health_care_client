"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  User,
  Clock,
  Tag,
  Stethoscope,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Folder,
  Building,
  Mail,
  Phone,
  MapPin,
  Heart,
  Pill,
  Activity,
  Shield,
  Award,
  BadgeCheck,
  Bell,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  UserCog,
  UserSearch,
  UserPen,
  UserRound,
  UserCircle,
  UserSquare,
  UserSquare2,
  BookOpen,
  FileSearch,
  AlertOctagon,
  ClipboardList,
  History,
  FileImage,
  FilePlus,
} from "lucide-react";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  doi?: string; // Date of Injury
  documentType?: string;
  documentIds?: string[];
  status?: "active" | "inactive" | "pending" | "completed";
  visitType?: "new" | "follow-up" | "consultation" | "emergency";
  physician?: string;
  lastVisit?: string;
  nextAppointment?: string;
  notes?: string;
  whatsNew?: any;
}

interface PatientDrawerProps {
  patients: RecentPatient[];
  selectedPatient: RecentPatient | null;
  loading: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onSelectPatient: (patient: RecentPatient) => void;
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
  onSearchChange?: (searchQuery: string) => void;
}

export default function PatientDrawer({
  patients,
  selectedPatient,
  loading,
  collapsed,
  onToggle,
  onSelectPatient,
  formatDOB,
  formatClaimNumber,
  onSearchChange,
}: PatientDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPatient, setModalPatient] = useState<RecentPatient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<RecentPatient>>(
    {},
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    if (onSearchChange) {
      onSearchChange("");
    }
  }, [onSearchChange]);

  const handleViewDetails = (e: React.MouseEvent, patient: RecentPatient) => {
    e.stopPropagation();
    setModalPatient(patient);
    setEditedPatient({
      patientName: patient.patientName,
      dob: patient.dob,
      doi: patient.doi || "",
      claimNumber: patient.claimNumber,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSavePatient = async () => {
    if (!modalPatient) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/patients/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalPatient: modalPatient,
          updatedData: editedPatient,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save patient data");
      }

      // Update the modal patient with edited data
      setModalPatient({ ...modalPatient, ...editedPatient });
      setIsEditing(false);

      toast.success("Patient details updated successfully!", {
        description: `${data.updatedCount} document(s) updated`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error("Failed to save patient details", {
        description:
          error instanceof Error ? error.message : "Please try again",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getVisitTypeColor = (type?: string) => {
    switch (type) {
      case "new":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "follow-up":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "consultation":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "emergency":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const isLikelyHeading = (
    line: string,
    nextLine: string | undefined,
    prevLine: string | undefined,
  ): boolean => {
    const trimmedLine = line.trim();
    const trimmedNextLine = nextLine?.trim() || "";

    if (!trimmedLine) return false;
    if (/^[-=]+$/.test(trimmedLine)) return false;
    if (/^[-=]{3,}$/.test(trimmedNextLine)) return true;

    const isShort = trimmedLine.length < 60;
    const doesntStartWithBullet =
      !trimmedLine.startsWith("•") && !trimmedLine.startsWith("-");
    const doesntEndWithPeriod = !trimmedLine.endsWith(".");
    const startsWithCapital = /^[A-Z]/.test(trimmedLine);

    const commonHeadingPatterns = [
      /^(Author|Signed|Prepared)\s*(By)?:/i,
      /Information$/i,
      /^(Clinical|Medical|Patient|Exam|Report|Document)/i,
      /^(Findings|Impression|Diagnosis|Assessment)/i,
      /^(Recommendations?|Plan|Treatment)/i,
      /^(Technique|Method|Procedure)/i,
      /^(History|Background|Overview)/i,
      /^(Summary|Conclusion|Results?)/i,
      /^(Medications?|Prescriptions?)/i,
      /^(Work|MMI|Disability)\s*Status/i,
    ];

    if (commonHeadingPatterns.some((pattern) => pattern.test(trimmedLine)))
      return true;

    if (
      isShort &&
      doesntStartWithBullet &&
      doesntEndWithPeriod &&
      startsWithCapital
    ) {
      return true;
    }

    return false;
  };

  const getSectionIcon = (heading: string) => {
    const h = heading.toLowerCase();
    if (h.includes("overview") || h.includes("report"))
      return <FileText size={16} className="text-blue-500" />;
    if (h.includes("patient") || h.includes("info"))
      return <User size={16} className="text-indigo-500" />;
    if (h.includes("diagnosis") || h.includes("finding"))
      return <FileSearch size={16} className="text-red-500" />;
    if (h.includes("clinical") || h.includes("status"))
      return <Activity size={16} className="text-green-500" />;
    if (h.includes("medication"))
      return <FilePlus size={16} className="text-purple-500" />;
    if (h.includes("recommendation") || h.includes("plan"))
      return <ClipboardList size={16} className="text-blue-600" />;
    if (h.includes("critical") || h.includes("alert"))
      return <AlertOctagon size={16} className="text-red-600" />;
    if (h.includes("history"))
      return <History size={16} className="text-gray-500" />;
    return <BookOpen size={16} className="text-gray-500" />;
  };

  const getSectionHeaderColor = (heading: string): string => {
    const h = heading.toLowerCase();
    if (h.includes("critical") || h.includes("alert")) return "text-red-600";
    if (h.includes("diagnosis") || h.includes("finding")) return "text-red-500";
    if (h.includes("recommendation") || h.includes("plan"))
      return "text-blue-600";
    if (h.includes("medication")) return "text-purple-600";
    return "text-gray-900";
  };

  const renderLongSummary = (summary: any) => {
    if (!summary) return null;

    const summaryStr =
      typeof summary === "string" ? summary : JSON.stringify(summary);
    const cleanedSummary = summaryStr
      .replace(/[\[\]"]/g, "")
      .replace(/\{/g, "")
      .replace(/\}/g, "");

    const lines = cleanedSummary.split("\n");
    const sections: { heading: string; content: string[] }[] = [];
    let currentSection: { heading: string; content: string[] } | null = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || /^[-=]{3,}$/.test(trimmed)) return;

      if (isLikelyHeading(trimmed, lines[index + 1], lines[index - 1])) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          heading: trimmed.replace(/:$/, "").trim(),
          content: [],
        };
      } else if (currentSection) {
        currentSection.content.push(trimmed);
      } else {
        currentSection = { heading: "", content: [trimmed] };
      }
    });

    if (currentSection) sections.push(currentSection);

    if (sections.length === 0)
      return <p className="text-gray-700 leading-relaxed">{summaryStr}</p>;

    return (
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {section.heading && (
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                {getSectionIcon(section.heading)}
                <span
                  className={`text-sm font-bold uppercase tracking-wider ${getSectionHeaderColor(section.heading)}`}
                >
                  {section.heading}
                </span>
              </div>
            )}
            <div className="p-5">
              <ul className="space-y-3">
                {section.content.map((item, iIdx) => {
                  const isBullet =
                    item.startsWith("-") ||
                    item.startsWith("*") ||
                    item.startsWith("•");
                  const content = isBullet ? item.substring(1).trim() : item;

                  return (
                    <li key={iIdx} className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1.5 flex-shrink-0 text-xs">
                        ●
                      </span>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {content}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getPatientIcon = (patient: RecentPatient) => {
    if (patient.visitType === "emergency") {
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
    if (patient.visitType === "new") {
      return <UserPlus className="w-4 h-4 text-purple-500" />;
    }
    if (patient.status === "active") {
      return <UserCheck className="w-4 h-4 text-emerald-500" />;
    }
    if (patient.status === "pending") {
      return <Clock className="w-4 h-4 text-amber-500" />;
    }
    return <User className="w-4 h-4 text-gray-500" />;
  };

  const filteredPatients = patients.filter((patient) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        patient.patientName?.toLowerCase().includes(query) ||
        patient.claimNumber?.toLowerCase().includes(query) ||
        patient.dob?.toLowerCase().includes(query) ||
        patient.physician?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all" && patient.status !== statusFilter) {
      return false;
    }

    if (visitTypeFilter !== "all" && patient.visitType !== visitTypeFilter) {
      return false;
    }

    return true;
  });

  return (
    <>
      <aside
        className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-xl shadow-gray-100/50 h-full"
        style={{
          width: collapsed ? "72px" : "360px",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="relative p-6 bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer group"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white m-0">
                    Patient Directory
                  </h3>
                  <p className="text-sm text-blue-100 m-0">
                    {patients.length} patients
                  </p>
                </div>
              </div>
            )}

            <button
              className={`p-2 rounded-lg transition-all duration-300 ${collapsed ? "rotate-180" : ""} group-hover:bg-white/20`}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5 text-white" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {!collapsed && (
            <div className="absolute -bottom-3 left-6 right-6">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                <div className="w-8 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Search & Filters */}
            <div className="p-5 border-b border-gray-200">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                  <input
                    type="text"
                    placeholder="Search patients, claims, physicians..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Patients List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : !Array.isArray(filteredPatients) ||
                filteredPatients.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    {searchQuery
                      ? "No Patients Found"
                      : "No Patients Available"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Patients will appear here as they are added"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map((patient, idx) => {
                    const isSelected =
                      selectedPatient &&
                      selectedPatient.patientName?.toLowerCase().trim() ===
                        patient?.patientName?.toLowerCase().trim() &&
                      selectedPatient.dob?.toString().split("T")[0] ===
                        patient?.dob?.toString().split("T")[0] &&
                      (!selectedPatient.claimNumber ||
                        selectedPatient.claimNumber === "Not specified" ||
                        !patient?.claimNumber ||
                        patient.claimNumber === "Not specified" ||
                        selectedPatient.claimNumber === patient.claimNumber);

                    return (
                      <div
                        key={idx}
                        className={`group relative rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                          isSelected
                            ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-25 shadow-lg shadow-blue-100"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-md"
                        }`}
                        onClick={() => onSelectPatient(patient)}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-blue-500">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className="p-4">
                          {/* Patient Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2.5 rounded-xl ${
                                  isSelected
                                    ? "bg-blue-100 border border-blue-200"
                                    : "bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200"
                                }`}
                              >
                                {getPatientIcon(patient)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-base">
                                  {patient?.patientName &&
                                  patient.patientName.toLowerCase() !==
                                    "unknown"
                                    ? patient.patientName
                                    : "Patient"}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {patient.status &&
                                    patient.status.toLowerCase() !==
                                      "unknown" && (
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}
                                      >
                                        {patient.status}
                                      </span>
                                    )}
                                  {patient.visitType &&
                                    patient.visitType.toLowerCase() !==
                                      "unknown" && (
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVisitTypeColor(patient.visitType)}`}
                                      >
                                        {patient.visitType}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Patient Details */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              {(() => {
                                const dobValue = patient?.dob
                                  ? formatDOB(patient.dob)
                                  : "";
                                if (
                                  !dobValue ||
                                  dobValue.toLowerCase().includes("invalid") ||
                                  dobValue.toLowerCase() === "unknown"
                                )
                                  return null;
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>DOB: {dobValue}</span>
                                  </div>
                                );
                              })()}
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4" />
                                <span
                                  className={
                                    patient?.claimNumber !== "Not specified"
                                      ? "font-medium"
                                      : "text-gray-500"
                                  }
                                >
                                  {patient?.claimNumber !== "Not specified"
                                    ? formatClaimNumber(patient?.claimNumber)
                                    : "No Claim"}
                                </span>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-3">
                              {patient.physician &&
                                patient.physician.toLowerCase() !==
                                  "unknown" && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <UserPen className="w-3.5 h-3.5" />
                                    <span className="truncate">
                                      Dr. {patient.physician.split(" ")[0]}
                                    </span>
                                  </div>
                                )}

                              {patient.lastVisit &&
                                patient.lastVisit.toLowerCase() !== "unknown" &&
                                !isNaN(
                                  new Date(patient.lastVisit).getTime(),
                                ) && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {new Date(
                                        patient.lastVisit,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                )}
                            </div>

                            {/* Document Count */}
                            {patient.documentIds &&
                              patient.documentIds.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <Folder className="w-3.5 h-3.5" />
                                  <span>
                                    {patient.documentIds.length} document
                                    {patient.documentIds.length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* View Button */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {(() => {
                                  if (!patient.createdAt)
                                    return "New Selection";
                                  const d = new Date(patient.createdAt);
                                  return isNaN(d.getTime())
                                    ? ""
                                    : `Added ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                                })()}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleViewDetails(e, patient)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group-hover:translate-x-0.5"
                            >
                              <span>View Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Hover Gradient Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  <span className="font-medium text-gray-900">
                    {filteredPatients.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">
                    {patients.length}
                  </span>{" "}
                  patients
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-gray-600">
                    {patients.filter((p) => p.status === "active").length}{" "}
                    active
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Collapsed View */}
        {collapsed && (
          <div className="flex flex-col items-center py-6 space-y-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
              <Users className="w-6 h-6 text-blue-600" />
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {patients.length}
              </div>
              <div className="text-xs text-gray-600">Patients</div>
            </div>

            <div className="space-y-4">
              {patients.slice(0, 3).map((patient, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => onSelectPatient(patient)}
                >
                  <div className="w-4 h-4 mx-auto">
                    {getPatientIcon(patient)}
                  </div>
                </div>
              ))}
            </div>

            {patients.length > 3 && (
              <div className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                +{patients.length - 3} more
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Summary Modal */}
      {isModalOpen && modalPatient && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out"
          onClick={() => setIsModalOpen(false)}
          style={{ animation: "fadeIn 0.3s ease-out forwards" }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-blue-500/10"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s ease-out forwards" }}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Patient Details
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {isEditing
                      ? "Editing patient information"
                      : "View and manage patient data"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                }}
                className="p-2.5 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Patient Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-blue-600" />
                    Patient Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedPatient.patientName || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient,
                          patientName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter patient name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                      {modalPatient.patientName || "Not specified"}
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedPatient.dob?.split("T")[0] || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient,
                          dob: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                      {modalPatient.dob
                        ? formatDOB(modalPatient.dob)
                        : "Not specified"}
                    </div>
                  )}
                </div>

                {/* Date of Injury */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    Date of Injury (DOI)
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedPatient.doi?.split("T")[0] || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient,
                          doi: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                      {modalPatient.doi
                        ? new Date(modalPatient.doi).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )
                        : "Not specified"}
                    </div>
                  )}
                </div>

                {/* Claim Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Claim Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedPatient.claimNumber || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient,
                          claimNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter claim number"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                      {modalPatient.claimNumber !== "Not specified"
                        ? formatClaimNumber(modalPatient.claimNumber)
                        : "Not specified"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {isEditing &&
                  "Make changes and click Save to update patient details"}
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedPatient({
                          patientName: modalPatient.patientName,
                          dob: modalPatient.dob,
                          doi: modalPatient.doi || "",
                          claimNumber: modalPatient.claimNumber,
                        });
                      }}
                      disabled={isSaving}
                      className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePatient}
                      disabled={isSaving}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all border border-gray-300"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                      <UserPen className="w-4 h-4" />
                      Edit Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
