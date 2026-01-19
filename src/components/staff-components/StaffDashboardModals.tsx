import IntakeModal from "@/components/staff-components/IntakeModal";
import ManualTaskModal from "@/components/ManualTaskModal";
import QuickNoteModal from "@/components/staff-components/QuickNoteModal";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import { AlertCircle } from "lucide-react";
import PaymentErrorModal from "./PaymentErrorModal";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
}

interface Task {
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
}

interface StaffDashboardModalsProps {
  showModal: boolean;
  showTaskModal: boolean;
  showQuickNoteModal: boolean;
  showDocumentSuccessPopup: boolean;
  paymentError: string | null;
  ignoredFiles: any[];
  uploadError: string | null;
  selectedPatient: RecentPatient | null;
  selectedTaskForQuickNote: Task | null;
  departments: string[];
  isUpdateModalOpen: boolean;
  selectedDoc: any;
  updateFormData: any;
  updateLoading: boolean;
  onCloseModal: () => void;
  onCloseTaskModal: () => void;
  onCloseQuickNoteModal: () => void;
  onCloseDocumentSuccessPopup: () => void;
  onClearPaymentError: () => void;
  onClearUploadError: () => void;
  onUpgrade: () => void;
  onManualTaskSubmit: (formData: any) => Promise<void>;
  onSaveQuickNote: (taskId: string, quickNotes: any) => Promise<void>;
  onCloseUpdateModal: () => void;
  onUpdateInputChange: (field: string, value: string) => void;
  onUpdateSubmit: () => Promise<void>;
  reassignConfirmData: {
    isOpen: boolean;
    taskId: string;
    currentAssignee: string;
    newAssignee: string;
  } | null;
  onConfirmReassign: () => void;
  onCancelReassign: () => void;
  bulkReassignConfirmData: {
    isOpen: boolean;
    taskIds: string[];
    newAssignee: string;
    conflictingDetails: { taskId: string; currentAssignee: string }[];
  } | null;
  onConfirmBulkReassign: () => void;
  onCancelBulkReassign: () => void;
  reassignLoading: boolean;
  onBulkAssign?: (taskIds: string[], assignee: string) => Promise<void>;
  onAssignTask: (taskId: string, assignee: string) => Promise<void>;
}

export default function StaffDashboardModals({
  showModal,
  showTaskModal,
  showQuickNoteModal,
  showDocumentSuccessPopup,
  paymentError,
  ignoredFiles,
  uploadError,
  selectedPatient,
  selectedTaskForQuickNote,
  departments,
  isUpdateModalOpen,
  selectedDoc,
  updateFormData,
  updateLoading,
  onCloseModal,
  onCloseTaskModal,
  onCloseQuickNoteModal,
  onCloseDocumentSuccessPopup,
  onClearPaymentError,
  onClearUploadError,
  onUpgrade,
  onManualTaskSubmit,
  onSaveQuickNote,
  onCloseUpdateModal,
  onUpdateInputChange: updateInputChange,
  onUpdateSubmit,
  reassignConfirmData,
  onConfirmReassign,
  onCancelReassign,
  bulkReassignConfirmData,
  onConfirmBulkReassign,
  onCancelBulkReassign,
  reassignLoading,
  onBulkAssign,
  onAssignTask,
}: StaffDashboardModalsProps) {
  // Wrapper function to convert ChangeEvent to (field, value) format
  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInputChange(name, value);
  };

  // Handle close for error modals
  const handleClosePaymentError = () => {
    onClearPaymentError();
  };

  const handleCloseUploadError = () => {
    onClearUploadError();
  };

  return (
    <>
      <IntakeModal
        isOpen={showModal}
        onClose={onCloseModal}
        selectedPatient={selectedPatient}
      />

      <ManualTaskModal
        open={showTaskModal}
        onOpenChange={onCloseTaskModal}
        departments={departments}
        defaultClaim={
          selectedPatient?.claimNumber &&
          selectedPatient.claimNumber !== "Not specified"
            ? selectedPatient.claimNumber
            : ""
        }
        defaultPatient={selectedPatient?.patientName || ""}
        defaultDocumentId={
          selectedPatient?.documentIds && selectedPatient.documentIds.length > 0
            ? selectedPatient.documentIds[0] // Use the first document ID (most recent)
            : ""
        }
        onSubmit={onManualTaskSubmit}
      />

      {/* Document Success Popup */}
      {showDocumentSuccessPopup && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Document Successfully Submitted!
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Your document has been processed and verified successfully.
            </p>
            <button
              onClick={() => {
                onCloseDocumentSuccessPopup();
              }}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Payment Error Modal */}
      <PaymentErrorModal
        isOpen={!!paymentError}
        onClose={handleClosePaymentError}
        onUpgrade={onUpgrade}
        errorMessage={paymentError || undefined}
        ignoredFiles={ignoredFiles}
      />

      {/* Upload Error Modal */}
      <UploadErrorModal
        isOpen={!!uploadError}
        onClose={handleCloseUploadError}
        errorMessage={uploadError || undefined}
      />

      <QuickNoteModal
        isOpen={showQuickNoteModal}
        task={selectedTaskForQuickNote}
        onClose={onCloseQuickNoteModal}
        onSave={onSaveQuickNote}
        onAssignTask={onAssignTask}
      />

      <UpdateDocumentModal
        open={isUpdateModalOpen}
        onOpenChange={onCloseUpdateModal}
        selectedDoc={selectedDoc}
        formData={updateFormData}
        onInputChange={handleUpdateInputChange}
        onSubmit={onUpdateSubmit}
        isLoading={updateLoading}
      />

      {/* Reassign Confirmation Modal */}
      {reassignConfirmData && reassignConfirmData.isOpen && (
        <ReassignConfirmationModal
          isOpen={reassignConfirmData.isOpen}
          currentAssignee={reassignConfirmData.currentAssignee}
          newAssignee={reassignConfirmData.newAssignee}
          onConfirm={onConfirmReassign}
          onCancel={onCancelReassign}
          isLoading={reassignLoading}
        />
      )}

      {/* Bulk Reassign Confirmation Modal */}
      {bulkReassignConfirmData && bulkReassignConfirmData.isOpen && (
        <BulkReassignConfirmationModal
          isOpen={bulkReassignConfirmData.isOpen}
          conflictingDetails={bulkReassignConfirmData.conflictingDetails}
          newAssignee={bulkReassignConfirmData.newAssignee}
          onConfirm={onConfirmBulkReassign}
          onCancel={onCancelBulkReassign}
          isLoading={reassignLoading}
        />
      )}
    </>
  );
}

// ReassignConfirmationModal component
const ReassignConfirmationModal = ({
  isOpen,
  currentAssignee,
  newAssignee,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  currentAssignee: string;
  newAssignee: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <AlertCircle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Reassign Task?</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            This task is already assigned to <span className="font-bold">{currentAssignee}</span>.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Do you want to reassign it to <span className="font-bold">{newAssignee}</span>?
          </p>
          <p className="text-sm text-gray-500">
            This will remove the task from {currentAssignee}'s list and add it to {newAssignee}'s list.
          </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? "Reassigning..." : "Confirm Reassignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

// BulkReassignConfirmationModal component
const BulkReassignConfirmationModal = ({
  isOpen,
  conflictingDetails,
  newAssignee,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  conflictingDetails: { taskId: string; currentAssignee: string }[];
  newAssignee: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <AlertCircle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Reassign Tasks?</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            The following tasks are already assigned to other staff members:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-200">
            <ul className="space-y-2">
              {conflictingDetails.map((detail) => (
                <li key={detail.taskId} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>
                    Task is currently assigned to <span className="font-bold text-gray-900">{detail.currentAssignee}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-gray-700 leading-relaxed mt-2">
            Do you want to reassign these tasks to <span className="font-bold text-blue-700">{newAssignee}</span>?
          </p>
          <p className="text-sm text-gray-500">
            This will remove the tasks from the previous staff members and add them to {newAssignee}'s list.
          </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? "Reassigning..." : "Confirm Reassignment"}
          </button>
        </div>
      </div>
    </div>
  );
};



// UploadErrorModal component
const UploadErrorModal = ({
  isOpen,
  onClose,
  errorMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <AlertCircle className="text-white" size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <AlertCircle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Upload Failed</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {errorMessage ||
              "An error occurred during upload. Please try again."}
          </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};