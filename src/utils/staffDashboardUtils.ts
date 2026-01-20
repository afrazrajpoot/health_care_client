import { handleEncryptedResponse } from "@/lib/decrypt";

// Types
export interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
}

export interface Task {
  id: string;
  description: string;
  department: string;
  status: string;
  dueDate?: string;
  patient: string;
  priority?: string;
  quickNotes?: any;
  assignee?: string;
  actions?: string[];
  type?: string;
  document?: {
    id: string;
    claimNumber: string;
    status: string;
    ur_denial_reason?: string;
    blobPath?: string;
    patientName: string;
    gcsFileLink?: string;
    fileName?: string;
  };
}

export interface PatientQuiz {
  id: string;
  patientName: string;
  dob: string;
  doi?: string;
  lang: string;
  bodyAreas?: string;
  newAppointments?: any;
  refill?: any;
  adl?: any;
  therapies?: any;
  claimNumber?: string;
  createdAt: string;
}

export interface QuestionnaireChip {
  text: string;
  type: "blue" | "amber" | "red" | "green";
}

export interface TaskStats {
  open: number;
  urgent: number;
  dueToday: number;
  completed: number;
}

export interface FailedDocument {
  id: string;
  reason: string;
  db?: string;
  doi?: string;
  claimNumber?: string;
  patientName?: string;
  documentText?: string;
  physicianId?: string;
  gcsFileLink?: string;
  fileName: string;
  fileHash?: string;
  blobPath?: string;
  summary?: string;
}

// API Functions
export const fetchRecentPatients = async (searchQuery: string = "") => {
  try {
    const params = new URLSearchParams({ mode: "wc" });
    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }
    const response = await fetch(`/api/get-recent-patients?${params}`);
    if (!response.ok) throw new Error("Failed to fetch patients");
    const data1 = await response.json();
    const data: any = handleEncryptedResponse(data1);
    return data;
  } catch (error) {
    console.error("Error fetching recent patients:", error);
    throw error;
  }
};

export const fetchPatientTasks = async (
  patient: RecentPatient,
  page: number = 1,
  pageSize: number = 10,
  viewMode: "open" | "completed" | "all" = "open",
  taskTypeFilter?: "all" | "internal" | "external"
) => {
  try {
    // Fetch tasks based on current view (open or completed or all)
    let statusFilter: string | undefined;
    if (viewMode === "completed") {
      statusFilter = "completed";
    } else if (viewMode === "all") {
      statusFilter = "all";
    } else {
      statusFilter = undefined;
    }

    const taskParams = new URLSearchParams({
      mode: "wc",
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    // Filter by patient name first (most reliable)
    taskParams.append("search", patient.patientName);

    // Also add claim filter if available for better matching
    if (patient.claimNumber && patient.claimNumber !== "Not specified") {
      taskParams.append("claim", patient.claimNumber);
    }

    // Add document IDs to the query parameters if available
    if (patient.documentIds && patient.documentIds.length > 0) {
      patient.documentIds.forEach((docId) => {
        taskParams.append(`documentId`, docId);
      });
    }

    // Add status filter if showing completed tasks
    if (statusFilter) {
      taskParams.append("status", statusFilter);
    }

    // Add type filter (internal/external)
    if (taskTypeFilter && taskTypeFilter !== "all") {
      taskParams.append("type", taskTypeFilter);
    }

    const response = await fetch(`/api/tasks?${taskParams}`);
    if (!response.ok) throw new Error("Failed to fetch tasks");

    const data1 = await response.json();
    const data: any = handleEncryptedResponse(data1);
    const tasks = data.tasks || [];
    const totalCount = data.totalCount || 0;

    if (Array.isArray(tasks)) {
      return { tasks, totalCount };
    } else {
      return { tasks: [], totalCount: 0 };
    }
  } catch (error) {
    console.error("Error fetching patient tasks:", error);
    return { tasks: [], totalCount: 0 };
  }
};

export const fetchPatientData = async (patient: RecentPatient) => {
  // Fetch patient quiz
  const quizParams = new URLSearchParams({
    patientName: patient.patientName,
  });
  if (patient.dob) {
    const dobDate = patient.dob.split("T")[0];
    quizParams.append("dob", dobDate);
  }
  if (
    patient.claimNumber &&
    patient.claimNumber !== "Not specified"
  ) {
    quizParams.append("claimNumber", patient.claimNumber);
  }

  // Use Promise.allSettled to handle errors gracefully and prevent one failure from blocking the other
  const [quizResult, intakeUpdateResult] = await Promise.allSettled([
    fetch(`/api/patient-intakes?${quizParams}`),
    fetch(`/api/patient-intake-update?${quizParams}`),
  ]);

  let patientQuiz = null;
  let patientIntakeUpdate = null;

  // Handle quiz response
  if (quizResult.status === "fulfilled" && quizResult.value.ok) {
    try {
      const quizData1 = await quizResult.value.json();
      const quizData: any = handleEncryptedResponse(quizData1);
      if (
        quizData?.success &&
        quizData?.data &&
        quizData.data.length > 0
      ) {
        patientQuiz = quizData.data[0];
      }
    } catch (error) {
      console.error("Error parsing quiz response:", error);
    }
  } else if (quizResult.status === "rejected") {
    console.error("Error fetching quiz:", quizResult.reason);
  }

  // Handle intake update response
  if (
    intakeUpdateResult.status === "fulfilled" &&
    intakeUpdateResult.value.ok
  ) {
    try {
      const intakeUpdateData = await intakeUpdateResult.value.json();
      if (intakeUpdateData?.success && intakeUpdateData?.data) {
        patientIntakeUpdate = intakeUpdateData.data;
      }
    } catch (error) {
      console.error("Error parsing intake update response:", error);
    }
  } else if (intakeUpdateResult.status === "rejected") {
    console.error(
      "Error fetching intake update:",
      intakeUpdateResult.reason
    );
  }

  return { patientQuiz, patientIntakeUpdate };
};

// Task Management Functions
export const updateTaskStatus = async (taskId: string, status: string, patientTasks: Task[]) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task status");
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating task status:", error);
    return { success: false, error };
  }
};

export const updateTaskAssignee = async (taskId: string, assignee: string, patientTasks: Task[]) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignee }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task assignee");
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating task assignee:", error);
    return { success: false, error };
  }
};

export const saveQuickNote = async (
  taskId: string,
  quickNotes: {
    status_update: string;
    details: string;
    one_line_note: string;
  }
) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quickNotes: {
          ...quickNotes,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save quick note");
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving quick note:", error);
    return { success: false, error };
  }
};

// Utility Functions
export const formatDOB = (dob: string) => {
  if (!dob) return "";
  try {
    const date = new Date(dob);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return dob;
  }
};

export const formatClaimNumber = (claim: string) => {
  if (!claim || claim === "Not specified") return "";
  return `Claim #${claim}`;
};

export const getPhysicianId = (session: any) => {
  if (!session?.user) return null;
  return session.user.role === "Physician"
    ? (session.user.id as string) || null
    : session.user.physicianId || null;
};

// Business Logic Functions
export const initializeTaskStatuses = (patientTasks: Task[]) => {
  const updatedStatuses: { [taskId: string]: string } = {};
  const updatedAssignees: { [taskId: string]: string } = {};

  patientTasks.forEach((task) => {
    if (task.id) {
      updatedStatuses[task.id] = task.status || "Pending";
      updatedAssignees[task.id] = task.assignee || "Unclaimed";
    }
  });

  return { updatedStatuses, updatedAssignees };
};

export const calculateTaskStats = (patientTasks: Task[]): TaskStats => {
  return {
    open: patientTasks.filter(
      (t) => t.status !== "Completed" && t.status !== "completed"
    ).length,
    urgent: patientTasks.filter(
      (t) =>
        t.priority === "high" || (t.dueDate && new Date(t.dueDate) < new Date())
    ).length,
    dueToday: patientTasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const today = new Date();
      return (
        due.toDateString() === today.toDateString() &&
        t.status !== "Completed" &&
        t.status !== "completed"
      );
    }).length,
    completed: patientTasks.filter(
      (t) => t.status === "Completed" || t.status === "completed"
    ).length,
  };
};

export const getStatusOptions = (task: Task): string[] => {
  const currentStatus = task.status;
  const baseOptions = [
    "Pending",
    "In Progress",
    "Waiting Callback",
    "Completed",
  ];

  if (
    currentStatus.toLowerCase().includes("signature") ||
    currentStatus.toLowerCase().includes("physician")
  ) {
    return ["Physician Signature", "Reviewed", "Signed", "Completed"];
  }
  if (currentStatus.toLowerCase().includes("scheduling")) {
    return ["Pending Scheduling", "Left VM", "Scheduled", "Completed"];
  }
  if (
    currentStatus.toLowerCase().includes("appeal") ||
    currentStatus.toLowerCase().includes("authorization")
  ) {
    return ["In Progress", "Left VM", "Waiting Callback", "Completed"];
  }

  return baseOptions;
};

export const getAssigneeOptions = (task: Task): string[] => {
  return [
    "Unclaimed",
    "Assigned: MA",
    "Assigned: Admin",
    "Assigned: Scheduler",
    "Physician",
  ];
};

export const getQuestionnaireChips = (
  patientIntakeUpdate: any,
  patientQuiz: PatientQuiz | null
): QuestionnaireChip[] => {
  const chips: QuestionnaireChip[] = [];

  // Use AI-generated points from PatientIntakeUpdate if available
  if (patientIntakeUpdate) {
    // Add generated points (prioritized)
    if (
      patientIntakeUpdate.generatedPoints &&
      Array.isArray(patientIntakeUpdate.generatedPoints)
    ) {
      patientIntakeUpdate.generatedPoints.forEach((point: string) => {
        if (point && point.trim()) {
          let text = point.trim();
          let type: "blue" | "amber" | "red" | "green" = "blue";

          // Check for explicit color in parentheses, brackets, or just at the end
          const colorMatch = text.match(/[(\[]?(Red|Blue|Green|Amber)[)\]]?/i);
          if (colorMatch) {
            const color = colorMatch[1].toLowerCase();
            if (color === "red") type = "red";
            else if (color === "green") type = "green";
            else if (color === "amber") type = "amber";
            else type = "blue";

            // Remove the color tag from text
            text = text.replace(/\s*[(\[]?(Red|Blue|Green|Amber)[)\]]?/i, "").trim();
          } else {
            // Fallback to keyword matching
            const lowerPoint = text.toLowerCase();
            if (
              lowerPoint.includes("worse") ||
              lowerPoint.includes("decreased") ||
              lowerPoint.includes("limited") ||
              lowerPoint.includes("difficulty") ||
              lowerPoint.includes("pain")
            ) {
              type = "red";
            } else if (
              lowerPoint.includes("improved") ||
              lowerPoint.includes("better") ||
              lowerPoint.includes("increased") ||
              lowerPoint.includes("good")
            ) {
              type = "green";
            } else if (
              lowerPoint.includes("unchanged") ||
              lowerPoint.includes("same") ||
              lowerPoint.includes("stable")
            ) {
              type = "green";
            } else {
              type = "blue";
            }
          }
          chips.push({ text, type });
        }
      });

    }

    // Add ADL effect points
    if (
      patientIntakeUpdate.adlEffectPoints &&
      Array.isArray(patientIntakeUpdate.adlEffectPoints)
    ) {
      patientIntakeUpdate.adlEffectPoints.forEach((point: string) => {
        if (point && point.trim()) {
          // Determine chip type based on content
          const lowerPoint = point.toLowerCase();
          let type: "blue" | "amber" | "red" | "green" = "blue";
          if (
            lowerPoint.includes("worse") ||
            lowerPoint.includes("decreased") ||
            lowerPoint.includes("limited") ||
            lowerPoint.includes("difficulty")
          ) {
            type = "red";
          } else if (
            lowerPoint.includes("improved") ||
            lowerPoint.includes("better") ||
            lowerPoint.includes("increased")
          ) {
            type = "green";
          } else if (
            lowerPoint.includes("unchanged") ||
            lowerPoint.includes("same")
          ) {
            type = "green";
          } else {
            type = "amber";
          }
          chips.push({ text: point.trim(), type });
        }
      });
    }

    // Add intake patient points
    if (
      patientIntakeUpdate.intakePatientPoints &&
      Array.isArray(patientIntakeUpdate.intakePatientPoints)
    ) {
      patientIntakeUpdate.intakePatientPoints.forEach((point: string) => {
        if (point && point.trim()) {
          // Determine chip type based on content
          const lowerPoint = point.toLowerCase();
          let type: "blue" | "amber" | "red" | "green" = "blue";
          if (
            lowerPoint.includes("refill") ||
            lowerPoint.includes("medication")
          ) {
            type = "blue";
          } else if (
            lowerPoint.includes("appointment") ||
            lowerPoint.includes("consult")
          ) {
            type = "blue";
          } else if (
            lowerPoint.includes("improved") ||
            lowerPoint.includes("better")
          ) {
            type = "green";
          } else if (
            lowerPoint.includes("worse") ||
            lowerPoint.includes("pain")
          ) {
            type = "red";
          } else {
            type = "amber";
          }
          chips.push({ text: point.trim(), type });
        }
      });
    }
  }

  // Fallback to patient quiz parsing if no AI-generated points available
  if (chips.length === 0 && patientQuiz) {
    try {
      if (patientQuiz.refill) {
        const refill =
          typeof patientQuiz.refill === "string"
            ? JSON.parse(patientQuiz.refill)
            : patientQuiz.refill;
        if (
          refill &&
          (refill.requested ||
            refill.needed ||
            Object.keys(refill).length > 0)
        ) {
          chips.push({ text: "Medication refill requested", type: "blue" });
        }
      }

      if (patientQuiz.therapies) {
        const therapies =
          typeof patientQuiz.therapies === "string"
            ? JSON.parse(patientQuiz.therapies)
            : patientQuiz.therapies;
        const therapyArray = Array.isArray(therapies)
          ? therapies
          : typeof therapies === "object"
            ? Object.values(therapies)
            : [];
        if (
          therapyArray.some(
            (t: any) =>
              t?.missed ||
              t?.status === "missed" ||
              (typeof t === "string" && t.toLowerCase().includes("missed"))
          )
        ) {
          chips.push({ text: "Missed PT session", type: "amber" });
        }
      }

      if (patientQuiz.newAppointments) {
        const newApps =
          typeof patientQuiz.newAppointments === "string"
            ? JSON.parse(patientQuiz.newAppointments)
            : patientQuiz.newAppointments;
        const appsArray = Array.isArray(newApps)
          ? newApps
          : typeof newApps === "object"
            ? Object.values(newApps)
            : [];
        if (appsArray.length > 0) {
          chips.push({ text: "New appointment scheduled", type: "blue" });
        }
      }

      if (patientQuiz.adl) {
        const adls = Array.isArray(patientQuiz.adl)
          ? patientQuiz.adl
          : typeof patientQuiz.adl === "string"
            ? JSON.parse(patientQuiz.adl)
            : typeof patientQuiz.adl === "object"
              ? Object.values(patientQuiz.adl)
              : [];

        if (
          adls.length === 0 ||
          (Array.isArray(adls) &&
            adls.every(
              (a: any) =>
                !a ||
                a === "unchanged" ||
                (typeof a === "string" &&
                  a.toLowerCase().includes("unchanged"))
            ))
        ) {
          chips.push({ text: "ADLs unchanged", type: "green" });
        } else {
          chips.push({ text: "ADLs changed", type: "amber" });
        }
      } else {
        chips.push({ text: "ADLs unchanged", type: "green" });
      }

      chips.push({ text: "No ER visits", type: "green" });
    } catch (error) {
      console.error("Error parsing patient quiz data:", error);
      chips.push({ text: "ADLs unchanged", type: "green" });
      chips.push({ text: "No ER visits", type: "green" });
    }
  }

  return chips;
};

// Constants
export const DEPARTMENTS = [
  "Medical/Clinical",
  "Scheduling & Coordination",
  "Administrative / Compliance",
  "Authorizations & Denials",
];

export const TASK_PAGE_SIZE = 5;
