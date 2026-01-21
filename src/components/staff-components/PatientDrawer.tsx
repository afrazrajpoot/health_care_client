"use client";

import { useState, useCallback, useEffect } from "react";
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
  UserSquare2
} from "lucide-react";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
  status?: "active" | "inactive" | "pending" | "completed";
  visitType?: "new" | "follow-up" | "consultation" | "emergency";
  physician?: string;
  lastVisit?: string;
  nextAppointment?: string;
  notes?: string;
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

  const filteredPatients = patients.filter(patient => {
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
    <aside
      className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-xl shadow-gray-100/50 h-[calc(100vh-2rem)]"
      style={{
        width: collapsed ? "72px" : "360px",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
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
          
          <button className={`p-2 rounded-lg transition-all duration-300 ${collapsed ? 'rotate-180' : ''} group-hover:bg-white/20`}>
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
          <div className="h-[calc(100vh-240px)] overflow-y-auto overflow-x-hidden px-4 py-3">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : !Array.isArray(filteredPatients) || filteredPatients.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserSearch className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No Patients Found" : "No Patients Available"}
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
                  const isSelected = selectedPatient?.patientName === patient?.patientName &&
                    selectedPatient?.dob === patient?.dob;

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
                            <div className={`p-2.5 rounded-xl ${
                              isSelected 
                                ? "bg-blue-100 border border-blue-200" 
                                : "bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200"
                            }`}>
                              {getPatientIcon(patient)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">
                                {patient?.patientName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                                  {patient.status || "Unknown"}
                                </span>
                                {patient.visitType && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVisitTypeColor(patient.visitType)}`}>
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
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>DOB: {formatDOB(patient?.dob)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4" />
                              <span className={patient?.claimNumber !== "Not specified" ? "font-medium" : "text-gray-500"}>
                                {patient?.claimNumber !== "Not specified"
                                  ? formatClaimNumber(patient?.claimNumber)
                                  : "No Claim"}
                              </span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="grid grid-cols-2 gap-3">
                            {patient.physician && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <UserPen className="w-3.5 h-3.5" />
                                <span className="truncate">Dr. {patient.physician.split(' ')[0]}</span>
                              </div>
                            )}
                            
                            {patient.lastVisit && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Document Count */}
                          {patient.documentIds && patient.documentIds.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Folder className="w-3.5 h-3.5" />
                              <span>{patient.documentIds.length} document{patient.documentIds.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* View Button */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Added {new Date(patient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group-hover:translate-x-0.5">
                            <span>View</span>
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
                <span className="font-medium text-gray-900">{filteredPatients.length}</span> of <span className="font-medium text-gray-900">{patients.length}</span> patients
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-600">
                  {patients.filter(p => p.status === 'active').length} active
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
            <div className="text-2xl font-bold text-gray-900 mb-1">{patients.length}</div>
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
  );
}