"use client";

import { Calendar, FileText, User, CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
}

interface PatientHeaderProps {
  patient: RecentPatient;
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
  completedTasks?: number;
}

export default function PatientHeader({
  patient,
  formatDOB,
  formatClaimNumber,
  completedTasks = 0,
}: PatientHeaderProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] flex flex-col md:flex-row justify-between px-6 py-5 gap-4">
      {/* Left Section - Patient Info */}
      <div className="flex items-start gap-4">
        {/* Patient Avatar/Icon */}
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-2xl font-bold text-gray-900">{patient.patientName}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Visit Today</span>
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* DOB */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="font-medium">DOB: {formatDOB(patient.dob)}</span>
            </div>
            
            {/* Claim Number */}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{formatClaimNumber(patient.claimNumber)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Status & Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Completed Tasks Badge */}
        {completedTasks > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 bg-green-50">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <span className="text-sm font-bold text-green-900">{completedTasks}</span>
              <span className="text-sm font-medium text-green-700 ml-1">Completed</span>
            </div>
          </div>
        )}
        
        {/* EMR Managed Chart */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
          <ShieldCheck className="w-5 h-5 text-gray-600" />
          <div>
            <span className="text-sm font-medium text-gray-700">EMR‑managed</span>
            <span className="text-sm font-medium text-gray-700 ml-1">chart</span>
          </div>
        </div>
      </div>
    </section>
  );
}