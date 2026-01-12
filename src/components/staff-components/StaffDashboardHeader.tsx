"use client";

import Link from "next/link";

interface StaffDashboardHeaderProps {
  onCreateIntakeLink: () => void;
  onAddTask: () => void;
  onUploadDocument: () => void;
}

export default function StaffDashboardHeader({
  onCreateIntakeLink,
  onAddTask,
  onUploadDocument,
}: StaffDashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0 h-[4vw]">
      <div className="flex items-center gap-3 font-extrabold text-lg">
        <img src="/logo.png" alt="DocLatch Logo" width={50} height={50} />
        DocLatch — Staff Dashboard
      </div>
      <div className="flex gap-2.5">
        <button
          className="border border-blue-600 bg-blue-600 text-white rounded-lg px-2.5 py-1.5 font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
          onClick={onCreateIntakeLink}
        >
          Create Intake Link
        </button>
        <Link
          href="/dashboard"
          className="border flex items-center justify-center border-gray-200 text-center bg-white rounded-lg px-2.5 py-1.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
        >
          Dashboard
        </Link>
        <button
          className="border border-gray-200 bg-white rounded-lg px-2.5 py-1 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onUploadDocument}
        >
          <img
            src="/logo.png"
            alt="Upload Icon"
            className="inline-block mr-2 w-[2.5vw] h-[2.5vw]"
          />{" "}
          Upload Document
        </button>
        <button
          className="border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onAddTask}
        >
          Add Task
        </button>
      </div>
    </header>
  );
}
