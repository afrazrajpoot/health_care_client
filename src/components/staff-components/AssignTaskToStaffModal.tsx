
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
import { toast } from "sonner";
import { DEPARTMENTS } from "@/utils/staffDashboardUtils";

interface AssignTaskToStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  onTaskCreated?: () => void;
}

export default function AssignTaskToStaffModal({
  open,
  onOpenChange,
  staffId,
  staffName,
  onTaskCreated,
}: AssignTaskToStaffModalProps) {
  const [taskFormData, setTaskFormData] = useState({
    patientName: "",
    dueDate: new Date().toISOString().split("T")[0],
    description: "",
    department: "",
    claim: "",
    documentId: "", // Added documentId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Patient Recommendation State
  const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTaskFormData({
        patientName: "",
        dueDate: new Date().toISOString().split("T")[0],
        description: "",
        department: "",
        claim: "",
        documentId: "",
      });
      setPatientSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open]);

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
      documentId: patient.id,
      claim:
        patient.claimNumber !== "Not specified"
          ? patient.claimNumber
          : prev.claim,
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

  const handleTaskFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "patientName") {
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
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the task
      const response = await fetch("/api/add-manual-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient: taskFormData.patientName, // Map patientName to patient
          description: taskFormData.description,
          department: taskFormData.department,
          dueDate: taskFormData.dueDate,
          claim: taskFormData.claim,
          documentId: taskFormData.documentId,
          assignee: staffName,
          status: "Open",
          priority: "medium",
          type: "internal",
          mode: "wc"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      toast.success(`Task assigned to ${staffName}`);
      onOpenChange(false);
      if (onTaskCreated) onTaskCreated();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Failed to assign task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Assign Task to {staffName}</DialogTitle>
          <DialogDescription>
            Create a new task and assign it directly to this staff member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="patientName" className="text-sm font-medium block mb-1">
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter patient name"
              disabled={isSubmitting}
              autoComplete="off"
              onFocus={() => {
                if (taskFormData.patientName && patientSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {/* Patient suggestions dropdown */}
            {showSuggestions && !isSubmitting && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto z-50 mt-1"
              >
                {isLoadingSuggestions ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Loading...
                  </div>
                ) : patientSuggestions.length > 0 ? (
                  patientSuggestions.map((patient, index) => (
                    <div
                      key={patient.id || index}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-3 cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {patient.patientName}
                      </div>
                      <div className="text-xs text-gray-500">
                        DOB: {patient.dob} | Claim: {patient.claimNumber}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No patients found
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="claim" className="text-sm font-medium block mb-1">
              Claim Number (Optional)
            </label>
            <input
              id="claim"
              name="claim"
              type="text"
              value={taskFormData.claim}
              onChange={handleTaskFormChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter claim number"
              disabled={isSubmitting}
            />
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="department" className="text-sm font-medium block mb-1">
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
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium block mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={taskFormData.description}
              onChange={handleTaskFormChange}
              required
              minLength={5}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Enter task description"
              disabled={isSubmitting}
            />
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
                  Assigning...
                </>
              ) : (
                "Assign Task"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
