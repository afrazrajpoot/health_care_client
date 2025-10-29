import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Task } from "@/components/staff-components/types";
import { useSocket } from "@/providers/SocketProvider";

export const useTasks = (initialMode: "wc" | "gm") => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const { socket } = useSocket();

  const transformApiTask = useCallback(
    (apiTask: any, currentMode: "wc" | "gm"): Task => {
      const dueDate = apiTask.dueDate ? new Date(apiTask.dueDate) : new Date();
      const now = new Date();
      const overdue = dueDate < now && apiTask.status !== "Done";

      const notes = apiTask.quickNotes
        ? [
            {
              ts: new Date(apiTask.updatedAt).toLocaleString(),
              user: "System",
              line:
                apiTask.quickNotes.one_line_note ||
                apiTask.quickNotes.details ||
                "Note added",
            },
          ]
        : [];

      // Get UR denial reason from multiple possible sources
      const urDenialReason =
        apiTask.ur_denial_reason ||
        apiTask.document?.ur_denial_reason ||
        apiTask.reason ||
        "";

      return {
        id: apiTask.id,
        task: apiTask.description,
        dept: apiTask.department,
        statusText: apiTask.status,
        statusClass: apiTask.status.toLowerCase().replace(/\s+/g, "-"),
        due: dueDate.toLocaleDateString(),
        overdue,
        patient: apiTask?.document?.patientName,
        assignee: apiTask.actions.includes("Claimed") ? "You" : "Unclaimed",
        mode: currentMode,
        notes,
        ur_denial_reason: urDenialReason, // Fixed property name
        documentId: apiTask.documentId,
        actions: apiTask.actions,
        sourceDocument: apiTask.sourceDocument,
        document: apiTask.document, // Include full document object if available
      };
    },
    []
  );

  const fetchTasks = useCallback(
    async (currentMode: "wc" | "gm", claim?: string) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ mode: currentMode });
        if (claim) {
          params.append("claim", claim);
        }
        const response = await fetch(`/api/tasks?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const apiTasks: any[] = await response.json();
        const transformedTasks = apiTasks.map((apiTask) =>
          transformApiTask(apiTask, currentMode)
        );
        setTasks(transformedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("❌ Error fetching tasks");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [transformApiTask]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      try {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );

        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(updates.statusText && { status: updates.statusText }),
            ...(updates.actions && { actions: updates.actions }),
            ...(updates.ur_denial_reason && {
              ur_denial_reason: updates.ur_denial_reason,
            }),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        toast.success("✅ Task updated successfully");
      } catch (error) {
        console.error("Error updating task:", error);
        toast.error("❌ Error updating task");
        fetchTasks(initialMode, undefined);
      }
    },
    [fetchTasks, initialMode]
  );

  const toggleClaim = useCallback(
    async (id: string) => {
      const currentTask = tasks.find((t) => t.id === id);
      if (!currentTask) return;

      const isClaimed = currentTask.actions?.includes("Claimed") || false;
      const newActions = isClaimed ? ["Unclaimed"] : ["Claimed", "Complete"];

      await updateTask(id, { actions: newActions });
      toast.success(isClaimed ? "✅ Task unclaimed" : "✅ Task claimed");
    },
    [tasks, updateTask]
  );

  const completeTask = useCallback(
    (id: string) => {
      updateTask(id, { statusText: "Done", statusClass: "done" });
      toast.success("🎉 Task marked complete");
    },
    [updateTask]
  );

  // New function to update UR denial reason
  const updateUrDenialReason = useCallback(
    async (id: string, reason: string) => {
      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, ur_denial_reason: reason } : t
          )
        );

        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ur_denial_reason: reason,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update UR denial reason");
        }

        toast.success("✅ UR denial reason updated");
      } catch (error) {
        console.error("Error updating UR denial reason:", error);
        toast.error("❌ Error updating UR denial reason");
        fetchTasks(initialMode, undefined);
      }
    },
    [fetchTasks, initialMode]
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
      const line = [t, d, f].filter(Boolean).join(" · ");
      if (!line) return;
      const ts = new Date().toLocaleString();

      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  notes: [...(t.notes || []), { ts, user: "You", line }],
                }
              : t
          )
        );

        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quickNotes: {
              status_update: t,
              details: d,
              one_line_note: f,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save note");
        }

        (wrap.querySelector(".qfree") as HTMLInputElement).value = "";
        toast.success("📝 Note saved");
      } catch (error) {
        console.error("Error saving note:", error);
        toast.error("❌ Error saving note");
        fetchTasks(initialMode, undefined);
      }
    },
    [fetchTasks, initialMode]
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
        claimNumber?: string; // Add claimNumber to form data
      },
      currentMode: "wc" | "gm",
      urlClaim?: string
    ) => {
      try {
        const response = await fetch("/api/add-manual-task", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: formData.description,
            department: formData.department,
            patient: formData.patientName,
            dueDate: formData.dueDate,
            status: "Open",
            actions: ["Claimed", "Complete"],
            documentId: formData.documentId,
            mode: currentMode,
            ur_denial_reason: formData.urDenialReason, // Include UR denial reason
            claim_number: formData.claimNumber || urlClaim, // Include claim number if available from form or URL
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        const newTask: any = await response.json();
        const transformedTask = transformApiTask(newTask, currentMode);

        setTasks((prev) => [...prev, transformedTask]);

        toast.success("✅ Manual task created successfully");
      } catch (error) {
        console.error("Error creating manual task:", error);
        toast.error("❌ Error creating manual task");
      }
    },
    [transformApiTask]
  );

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleTasksCreated = (data: any) => {
      console.log("📡 Received 'tasks_created' event:", data);
      if (data.user_id !== session?.user?.id) return;

      const newTransformedTasks = data.tasks.map((apiTask: any) =>
        transformApiTask(apiTask, initialMode)
      );

      setTasks((prevTasks) => {
        const existingIds = new Set(prevTasks.map((t) => t.id));
        const uniqueNewTasks = newTransformedTasks.filter(
          (t) => !existingIds.has(t.id)
        );
        if (uniqueNewTasks.length > 0) {
          toast.success(`✅ Added ${uniqueNewTasks.length} new task(s)`);
        }
        return [...prevTasks, ...uniqueNewTasks];
      });
    };

    socket.on("tasks_created", handleTasksCreated);

    return () => {
      socket.off("tasks_created", handleTasksCreated);
    };
  }, [socket, session?.user?.id, transformApiTask, initialMode]);

  return {
    tasks,
    loading,
    fetchTasks,
    updateTask,
    toggleClaim,
    completeTask,
    saveNote,
    handleCreateManualTask,
    updateUrDenialReason, // Export the new function
  };
};
