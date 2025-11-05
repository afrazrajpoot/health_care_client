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

      // Derive assignee and actions based on status for consistency
      const isClaimed = apiTask.status === "in progress";
      const assignee = isClaimed ? "You" : "Unclaimed";
      const actions = isClaimed ? ["Complete"] : ["Claimed", "Complete"];

      return {
        id: apiTask.id,
        task: apiTask.description,
        dept: apiTask.department,
        statusText: apiTask.status,
        statusClass: apiTask.status.toLowerCase().replace(/\s+/g, "-"),
        due: dueDate.toLocaleDateString(),
        overdue,
        patient: apiTask?.patient,
        assignee,
        mode: currentMode,
        notes,
        ur_denial_reason: urDenialReason, // Fixed property name
        documentId: apiTask.documentId,
        actions,
        sourceDocument: apiTask.sourceDocument,
        document: apiTask.document, // Include full document object if available
      };
    },
    []
  );

  const fetchTasks = useCallback(
    async (
      currentMode: "wc" | "gm",
      claim?: string,
      options?: {
        page?: number;
        pageSize?: number;
        search?: string;
        dept?: string;
        status?: string;
        overdueOnly?: boolean;
        priority?: string;
        dueDate?: string;
        taskType?: string;
        assignedTo?: string;
        sortBy?: string;
        sortOrder?: string;
      }
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ mode: currentMode });
        if (claim) {
          params.append("claim", claim);
        }
        if (options?.page) {
          params.append("page", String(options.page));
        }
        if (options?.pageSize) {
          params.append("pageSize", String(options.pageSize));
        }
        if (options?.search) {
          params.append("search", options.search);
        }
        if (options?.dept) {
          params.append("dept", options.dept);
        }
        if (options?.status) {
          params.append("status", options.status);
        }
        if (options?.overdueOnly) {
          params.append("overdueOnly", "true");
        }
        if (options?.priority) {
          params.append("priority", options.priority);
        }
        if (options?.dueDate) {
          params.append("dueDate", options.dueDate);
        }
        if (options?.taskType) {
          params.append("taskType", options.taskType);
        }
        if (options?.assignedTo) {
          params.append("assignedTo", options.assignedTo);
        }
        if (options?.sortBy) {
          params.append("sortBy", options.sortBy);
        }
        if (options?.sortOrder) {
          params.append("sortOrder", options.sortOrder);
        }
        const response = await fetch(`/api/tasks?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const result = await response.json();
        const apiTasks: any[] = Array.isArray(result)
          ? result
          : result.tasks || [];
        const transformedTasks = apiTasks.map((apiTask) =>
          transformApiTask(apiTask, currentMode)
        );
        setTasks(transformedTasks);

        // Return total count if available for pagination
        return {
          tasks: transformedTasks,
          totalCount: result.totalCount || transformedTasks.length,
        };
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("❌ Error fetching tasks", {
          duration: 5000,
          position: "top-right",
        });
        setTasks([]);
        return { tasks: [], totalCount: 0 };
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
        fetchTasks(initialMode, undefined);
      }
    },
    [fetchTasks, initialMode]
  );

  const toggleClaim = useCallback(
    async (id: string) => {
      const currentTask = tasks.find((t) => t.id === id);
      if (!currentTask) return;

      const isClaimed = currentTask.statusText === "in progress";
      const newStatus = isClaimed ? "Open" : "in progress";
      const newStatusClass = newStatus.toLowerCase().replace(/\s+/g, "-");
      const newAssignee = isClaimed ? "Unclaimed" : "You";
      const newActions = isClaimed ? ["Claimed", "Complete"] : ["Complete"];

      // Local update first
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                statusText: newStatus,
                statusClass: newStatusClass,
                assignee: newAssignee,
                actions: newActions,
              }
            : t
        )
      );

      // API update: only send status
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        // Revert local update on failure
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  statusText: isClaimed ? "in progress" : "Open",
                  statusClass: isClaimed ? "in-progress" : "open",
                  assignee: isClaimed ? "You" : "Unclaimed",
                  actions: isClaimed ? ["Complete"] : ["Claimed", "Complete"],
                }
              : t
          )
        );
        throw new Error("Failed to update task status");
      }

      toast.success(isClaimed ? "✅ Task unclaimed" : "✅ Task claimed", {
        duration: 5000,
        position: "top-right",
      });
    },
    [tasks]
  );

  const completeTask = useCallback(
    (id: string) => {
      updateTask(id, { statusText: "Done", statusClass: "done" });
      toast.success("🎉 Task marked complete", {
        duration: 5000,
        position: "top-right",
      });
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

        // Refetch tasks to handle pagination and filters correctly
        await fetchTasks(currentMode, urlClaim);

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
    [fetchTasks, transformApiTask]
  );

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleTasksCreated = (data: any) => {
      console.log("📡 Received 'tasks_created' event:", data);
      if (data.user_id !== session?.user?.id) return;

      // Refetch to handle pagination and filters correctly
      fetchTasks(initialMode);
    };

    socket.on("tasks_created", handleTasksCreated);

    return () => {
      socket.off("tasks_created", handleTasksCreated);
    };
  }, [socket, session?.user?.id, fetchTasks, initialMode]);

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
