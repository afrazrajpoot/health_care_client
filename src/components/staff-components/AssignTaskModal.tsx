"use client";

import { useState } from "react";
import { useGetStaffQuery } from "@/redux/staffApi";
import { User, Check, X, AlertCircle } from "lucide-react";
import { Task } from "@/utils/staffDashboardUtils";

interface AssignTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onAssign: (taskId: string, assignee: string) => Promise<void>;
}

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  image: string | null;
}

import { toast } from "sonner";

export default function AssignTaskModal({
  isOpen,
  task,
  onClose,
  onAssign,
}: AssignTaskModalProps) {
  const [assigning, setAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { data: staffData, isLoading: loadingStaff, error: staffError, refetch: refetchStaff } = useGetStaffQuery(undefined);
  
  // Robust extraction of staff members
  const staffMembers = Array.isArray(staffData) 
    ? staffData 
    : (staffData?.staff || []);

  if (!isOpen || !task) return null;

  const getSelectedStaffName = () => {
    const staff = staffMembers.find((s: StaffMember) => s.id === selectedStaffId);
    return staff ? (staff.firstName || staff.email || "Staff") : "";
  };

  const executeAssignment = async (assigneeName: string) => {
    setAssigning(true);
    try {
      await onAssign(task.id, assigneeName);
      toast.success(`Task successfully assigned to ${assigneeName}`);
      onClose();
      setSelectedStaffId(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  const handleAssign = async () => {
    if (!task || !selectedStaffId) return;

    const staff = staffMembers.find((s: StaffMember) => s.id === selectedStaffId);
    if (!staff) return;

    const assigneeName = staff.firstName || staff.email || "Staff";
    const currentAssignee = task.assignee || "Unclaimed";

    // Check if task is already assigned to someone else
    if (currentAssignee !== "Unclaimed" && currentAssignee !== assigneeName) {
      setShowConfirmation(true);
      return;
    }

    // If already assigned to the same person
    if (currentAssignee === assigneeName) {
      toast.info(`Task is already assigned to ${assigneeName}`);
      onClose();
      return;
    }

    await executeAssignment(assigneeName);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {!showConfirmation && (
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="m-0 text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4" />
            Assign Task
          </h3>
          <button
            className="bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-slate-900 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        )}

        <div className="p-4 overflow-y-auto flex-1">
          {showConfirmation ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-1.5 rounded-full">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 text-sm">Task Already Assigned</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This task is currently assigned to <span className="font-bold">{task.assignee}</span>.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Are you sure you want to reassign this task to <span className="font-bold text-gray-900">{getSelectedStaffName()}</span>?
              </p>

              <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-500">
                <p className="mb-1 font-medium text-gray-700">Task Details:</p>
                <p>{task.description}</p>
              </div>
            </div>
          ) : (
            <>
            

              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-slate-700">
                  Select Staff Member
                </h4>
                <button 
                  onClick={() => refetchStaff()} 
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                  title="Refresh staff list"
                >
                  Refresh List
                </button>
              </div>
              
              {staffError && (
                <div className="text-sm text-red-500 p-3 bg-red-50 rounded border border-red-100 mb-2">
                  Error loading staff list.
                </div>
              )}
              
              {loadingStaff ? (
                <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                  Loading staff...
                </div>
              ) : staffMembers.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {staffMembers.map((staff: StaffMember) => (
                    <div
                      key={staff.id}
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`
                        cursor-pointer px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3
                        ${selectedStaffId === staff.id 
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50"}
                      `}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden border border-gray-300">
                          {staff.image ? (
                              <img src={staff.image} alt={staff.firstName || ""} className="w-full h-full object-cover" />
                          ) : (
                              (staff.firstName?.[0] || staff.email?.[0] || "?").toUpperCase()
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {staff.firstName} {staff.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {staff.role || "Staff Member"}
                        </div>
                      </div>
                      {selectedStaffId === staff.id && <Check className="w-5 h-5 text-blue-600" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded border border-gray-100">
                  No staff members found.
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 flex-shrink-0">
          {showConfirmation ? (
            <>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={assigning}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Back
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                onClick={() => executeAssignment(getSelectedStaffName())}
                disabled={assigning}
              >
                {assigning ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={assigning}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                onClick={handleAssign}
                disabled={assigning || !selectedStaffId}
              >
                {assigning ? "Assigning..." : "Assign Task"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
