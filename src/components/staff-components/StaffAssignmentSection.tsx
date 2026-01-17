
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Check } from "lucide-react";
import { useGetStaffQuery } from "@/redux/staffApi";

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  image: string | null;
}

interface StaffAssignmentSectionProps {
  selectedTaskIds: string[];
  taskAssignees: { [taskId: string]: string };
  onAssign: (staffId: string, staffName: string) => Promise<void>;
}

export default function StaffAssignmentSection({
  selectedTaskIds,
  taskAssignees,
  onAssign,
}: StaffAssignmentSectionProps) {
  const { data: staffData, isLoading: loading } = useGetStaffQuery(undefined);
  const staffMembers = staffData?.staff || [];
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const handleAssignClick = async () => {
    if (!selectedStaffId) {
        toast.error("Please select a staff member");
        return;
    }
    if (selectedTaskIds.length === 0) {
        toast.error("Please select tasks to assign");
        return;
    }

    // Check for already assigned tasks - removed blocking check to allow reassignment via modal
    // The parent component (TasksSection -> StaffDashboardContainer) will handle the confirmation modal.


    const staff = staffMembers.find((s: StaffMember) => s.id === selectedStaffId);
    if (!staff) return;

    setAssigning(true);
    try {
        // We use the staff's first name as the assignee string for now, 
        // as the system seems to use names (e.g. "Assigned: MA").
        // Or we can use a consistent format like "Staff: Name".
        // The user said "assign to specific staff".
        const assigneeName = staff.firstName || staff.email || "Staff";
        await onAssign(staff.id, assigneeName);
        setSelectedStaffId(null);
    } catch (error) {
        console.error("Assignment error:", error);
        toast.error("Failed to assign tasks");
    } finally {
        setAssigning(false);
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading staff...</div>;

  if (staffMembers.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm p-4 mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Staff Assignment
      </h3>
      
      <div className="flex flex-wrap items-center gap-3">
        {staffMembers.map((staff: StaffMember) => (
          <div
            key={staff.id}
            onClick={() => setSelectedStaffId(staff.id)}
            className={`
              cursor-pointer px-3 py-2 rounded-lg border transition-all flex items-center gap-2
              ${selectedStaffId === staff.id 
                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50"}
            `}
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold overflow-hidden">
                {staff.image ? (
                    <img src={staff.image} alt={staff.firstName || ""} className="w-full h-full object-cover" />
                ) : (
                    (staff.firstName?.[0] || staff.email?.[0] || "?").toUpperCase()
                )}
            </div>
            <span className="text-sm font-medium">
              {staff.firstName} {staff.lastName}
            </span>
            {selectedStaffId === staff.id && <Check className="w-3.5 h-3.5" />}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-gray-500">
            {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
        </span>
        <button
            onClick={handleAssignClick}
            disabled={!selectedStaffId || selectedTaskIds.length === 0 || assigning}
            className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${!selectedStaffId || selectedTaskIds.length === 0 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}
            `}
        >
            {assigning ? "Assigning..." : "Assign Tasks"}
        </button>
      </div>
    </div>
  );
}
