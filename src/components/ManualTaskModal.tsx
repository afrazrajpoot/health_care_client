"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManualTaskData {
  patientName: string;
  dueDate: string;
  description: string;
  department: string;
  documentId?: string;
  claim?: string;
}

interface ManualTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: string[];
  defaultClaim?: string;
  defaultPatient?: string;
  defaultDocumentId?: string;
  initialData?: any;
  title?: string;
  onSubmit: (data: ManualTaskData) => Promise<void>;
}

export default function ManualTaskModal({
  open,
  onOpenChange,
  departments,
  defaultClaim,
  defaultPatient,
  defaultDocumentId,
  initialData,
  title,
  onSubmit,
}: ManualTaskModalProps) {
  const [taskFormData, setTaskFormData] = useState({
    patientName: "",
    dueDate: new Date().toISOString().split("T")[0],
    description: "",
    department: "",
    documentId: "",
    claim: defaultClaim || "",
  });

  const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableRecommendations, setEnableRecommendations] = useState(true);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Reset and initialize task modal states
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Mode: Editing
        setTaskFormData({
          patientName: initialData.patient || initialData.patientName || "",
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          description: initialData.description || "",
          department: initialData.department || "",
          documentId: initialData.documentId || (initialData.document?.id) || "",
          claim: initialData.claimNumber || initialData.claim_number || initialData.claim || defaultClaim || "",
        });
        setEnableRecommendations(false);
      } else {
        // Mode: Adding
        setTaskFormData({
          patientName: defaultPatient || "",
          dueDate: new Date().toISOString().split("T")[0],
          description: "",
          department: "",
          documentId: defaultDocumentId || "",
          claim: defaultClaim || "",
        });
        setEnableRecommendations(!defaultPatient);
      }
      setPatientSuggestions([]);
      setShowSuggestions(false);
      setIsSubmitting(false);
    }
  }, [open, initialData, defaultPatient, defaultClaim, defaultDocumentId]);

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    delay: number
  ): ((...args: Parameters<F>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<F>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch patient recommendations
  const fetchPatientRecommendations = async (query: string) => {
    if (!query.trim()) {
      setPatientSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    setIsLoadingSuggestions(true);
    setPatientSuggestions([]);

    try {
      const response = await fetch(
        `/api/dashboard/recommendation?patientName=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch patient recommendations");
      }

      const data: any = await response.json();

      if (data.success && data.data.allMatchingDocuments) {
        const patients = data.data.allMatchingDocuments.map((doc: any) => ({
          id: doc.id,
          patientName: doc.patientName,
          dob:
            doc.dob && doc.dob !== "Not specified"
              ? new Date(doc.dob).toISOString().split("T")[0]
              : "Not specified",
          claimNumber: doc.claimNumber || "Not specified",
        }));
        setPatientSuggestions(patients);
      } else {
        setPatientSuggestions([]);
      }
    } catch (err: unknown) {
      console.error("Error fetching patient recommendations:", err);
      setPatientSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Debounced fetch
  const debouncedFetchPatients = useCallback(
    debounce((query: string) => {
      fetchPatientRecommendations(query);
    }, 300),
    []
  );

  // Handle patient select
  const handlePatientSelect = (patient: any) => {
    setTaskFormData((prev) => ({
      ...prev,
      patientName: patient.patientName,
      documentId: patient.id, // Set documentId from recommendation
      claim:
        patient.claimNumber !== "Not specified"
          ? patient.claimNumber
          : prev.claim, // Use recommendation claim if available and no default
    }));
    setShowSuggestions(false);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        patientInputRef.current &&
        !patientInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Handle task form change
  const handleTaskFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "patientName" && enableRecommendations) {
      debouncedFetchPatients(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !taskFormData.patientName ||
      !taskFormData.description ||
      !taskFormData.department ||
      !taskFormData.dueDate
    ) {
      return;
    }

    // If no claim set (neither from URL nor recommendation), set default recommendation
    const finalData = {
      ...taskFormData,
      claim:
        taskFormData.claim ||
        `Recommendation-${new Date().toISOString().slice(0, 10)}`,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(finalData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[30vw]">
        <DialogHeader>
          <DialogTitle>{title || (initialData ? "Edit Task" : "Add Manual Task")}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the task details below." : "Fill in the details below to create a new manual task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="claim" className="text-sm font-medium block mb-1">
              Claim Number
            </label>
            <input
              id="claim"
              name="claim"
              type="text"
              value={taskFormData.claim}
              onChange={handleTaskFormChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter claim number"
              disabled={!!defaultClaim || isSubmitting}
              readOnly={!!defaultClaim}
            />
          </div>
          <div style={{ position: "relative" }}>
            <label
              htmlFor="patientName"
              className="text-sm font-medium block mb-1"
            >
              Patient Name
            </label>
            <input
              ref={patientInputRef}
              id="patientName"
              name="patientName"
              type="text"
              value={taskFormData.patientName}
              onChange={handleTaskFormChange}
              required
              minLength={2}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter patient name"
              onFocus={() => {
                if (
                  enableRecommendations &&
                  taskFormData.patientName &&
                  patientSuggestions.length > 0
                ) {
                  setShowSuggestions(true);
                }
              }}
              disabled={!!defaultPatient || isSubmitting}
              readOnly={!!defaultPatient}
            />
            {/* Patient suggestions dropdown */}
            {showSuggestions && !isSubmitting && enableRecommendations && (
              <div
                ref={suggestionsRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: "1000",
                  marginTop: "4px",
                }}
              >
                {isLoadingSuggestions ? (
                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    Loading...
                  </div>
                ) : patientSuggestions.length > 0 ? (
                  patientSuggestions.map((patient, index) => (
                    <div
                      key={patient.id || index}
                      onClick={() => handlePatientSelect(patient)}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom:
                          index < patientSuggestions.length - 1
                            ? "1px solid #eee"
                            : "none",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.backgroundColor =
                          "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                        {patient.patientName}
                      </div>
                      <div style={{ color: "#666", fontSize: "12px" }}>
                        DOB: {patient.dob} | Claim: {patient.claimNumber}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    No patients found
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="dueDate" className="text-sm font-medium block mb-1">
              Due Date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              value={taskFormData.dueDate}
              onChange={handleTaskFormChange}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium block mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={taskFormData.description}
              onChange={handleTaskFormChange}
              required
              minLength={10}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Enter task description"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="department"
              className="text-sm font-medium block mb-1"
            >
              Department
            </label>
            <select
              id="department"
              name="department"
              value={taskFormData.department}
              onChange={handleTaskFormChange}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData ? "Saving..." : "Creating..."}
                </>
              ) : (
                initialData ? "Save Changes" : "Create Task"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
