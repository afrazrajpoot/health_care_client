"use client";

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
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0 h-[50px]">
      <div className="flex items-center gap-3 font-extrabold text-[15px]">
        <span className="bg-blue-600 text-white px-2 py-1.5 rounded-lg text-xs">DL</span> DocLatch — Staff Dashboard
      </div>
      <div className="flex gap-2.5">
        <button className="border border-blue-600 bg-blue-600 text-white rounded-lg px-2.5 py-1.5 font-semibold text-xs cursor-pointer hover:bg-blue-700 transition-colors" onClick={onCreateIntakeLink}>
          Create Intake Link
        </button>
        <button className="border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 font-semibold text-xs cursor-pointer hover:bg-gray-50 transition-colors" onClick={onUploadDocument}>
          Upload Document
        </button>
        <button className="border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 font-semibold text-xs cursor-pointer hover:bg-gray-50 transition-colors" onClick={onAddTask}>Add Task</button>
      </div>
    </header>
  );
}

