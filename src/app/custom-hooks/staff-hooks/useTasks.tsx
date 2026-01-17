import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Task } from "@/components/staff-components/types";
import { useSocket } from "@/providers/SocketProvider";
import { useUpdateTaskMutation, useAddManualTaskMutation, useGetTasksQuery } from "@/redux/dashboardApi";

export const useTasks = (initialMode: "wc" | "gm") => {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [updateTaskMutation] = useUpdateTaskMutation();
  const [addManualTaskMutation] = useAddManualTaskMutation();

  // Note: We don't use useGetTasksQuery here because the container manages the query state
  // But we keep the function signatures for compatibility

  const updateTask = useCallback(
    async (id: string, updates: any) => {
      try {
        await updateTaskMutation({
          taskId: id,
          ...updates
        }).unwrap();

        toast.success("✅ Task updated successfully", {
          duration: 5000,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error updating task:", error);
        toast.error("❌ Error updating task", {
          duration: 5000,
          position: "top-right",
        });
      }
    },
    [updateTaskMutation]
  );

  const toggleClaim = useCallback(
    async (id: string, currentStatus: string) => {
      const isClaimed = currentStatus === "in progress";
      const newStatus = isClaimed ? "Open" : "in progress";

      try {
        await updateTaskMutation({
          taskId: id,
          status: newStatus,
        }).unwrap();

        toast.success(isClaimed ? "✅ Task unclaimed" : "✅ Task claimed", {
          duration: 5000,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error toggling claim:", error);
        toast.error("❌ Error updating task status", {
          duration: 5000,
          position: "top-right",
        });
      }
    },
    [updateTaskMutation]
  );

  const completeTask = useCallback(
    async (id: string) => {
      try {
        await updateTaskMutation({
          taskId: id,
          status: "Completed",
        }).unwrap();
        
        toast.success("🎉 Task marked complete", {
          duration: 5000,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error completing task:", error);
      }
    },
    [updateTaskMutation]
  );

  const updateUrDenialReason = useCallback(
    async (id: string, reason: string) => {
      try {
        await updateTaskMutation({
          taskId: id,
          ur_denial_reason: reason,
        }).unwrap();

        toast.success("✅ UR denial reason updated", {
          duration: 5000,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error updating UR denial reason:", error);
        toast.error("❌ Error updating UR denial reason", {
          duration: 5000,
          position: "top-right",
        });
      }
    },
    [updateTaskMutation]
  );

  const saveNote = useCallback(
    async (e: React.MouseEvent, taskId: string) => {
      const wrap = (e.currentTarget as HTMLElement).closest(".qnote");
      if (!wrap) return;
      const t =
        (wrap.querySelector(".qtype") as HTMLSelectElement)?.value || "";
      const d =
        (wrap.querySelector(".qmore") as HTMLSelectElement)?.value || "";
      const f = (wrap.querySelector(".qfree") as HTMLInputElement)?.value || "";
      
      if (!t && !d && !f) return;

      try {
        await updateTaskMutation({
          taskId,
          quickNotes: {
            status_update: t,
            details: d,
            one_line_note: f,
            timestamp: new Date().toISOString(),
          },
        }).unwrap();

        (wrap.querySelector(".qfree") as HTMLInputElement).value = "";
        toast.success("📝 Note saved", {
          duration: 5000,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error saving note:", error);
        toast.error("❌ Error saving note", {
          duration: 5000,
          position: "top-right",
        });
      }
    },
    [updateTaskMutation]
  );

  const handleCreateManualTask = useCallback(
    async (
      formData: {
        patientName: string;
        dueDate: string;
        description: string;
        department: string;
        documentId?: string;
        urDenialReason?: string;
        claimNumber?: string;
      },
      currentMode: "wc" | "gm",
      urlClaim?: string
    ) => {
      try {
        await addManualTaskMutation({
          description: formData.description,
          department: formData.department,
          patient: formData.patientName,
          dueDate: formData.dueDate,
          status: "Open",
          actions: ["Claimed", "Complete"],
          documentId: formData.documentId,
          mode: currentMode,
          ur_denial_reason: formData.urDenialReason,
          claim_number: formData.claimNumber || urlClaim,
        }).unwrap();

        toast.success("✅ Manual task created successfully", {
          duration: 5000,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error creating manual task:", error);
        toast.error("❌ Error creating manual task", {
          duration: 5000,
          position: "top-right",
        });
      }
    },
    [addManualTaskMutation]
  );

  return {
    updateTask,
    toggleClaim,
    completeTask,
    saveNote,
    handleCreateManualTask,
    updateUrDenialReason,
  };
};
