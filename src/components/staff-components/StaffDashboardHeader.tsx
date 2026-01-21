"use client";

import Link from "next/link";

interface StaffDashboardHeaderProps {
  onCreateIntakeLink: () => void;
  onAddTask: () => void;
  onUploadDocument: () => void;
  userRole?: string;
}

export default function StaffDashboardHeader({
  onCreateIntakeLink,
  onAddTask,
  onUploadDocument,
  userRole,
}: StaffDashboardHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200/50 shadow-sm px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Brand - Keeping your original logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="DocLatch Logo" 
              width={50} 
              height={50}
              className="rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                DocLatch — Staff Dashboard
              </h1>
              <p className="text-xs text-gray-500">Healthcare Management Platform</p>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons - Enhanced design */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-200"
            onClick={onCreateIntakeLink}
          >
            <span className="text-lg">+</span>
            Create Intake Link
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl font-semibold text-sm hover:border-blue-300 hover:from-gray-100 hover:to-gray-150 transition-all text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-200"
            onClick={onUploadDocument}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Document
          </button>
          
          {userRole !== "Staff" && (
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-200"
              onClick={onAddTask}
            >
              <span className="text-lg">+</span>
              Add Task
            </button>
          )}
        </div>
      </div>
    </header>
  );
}