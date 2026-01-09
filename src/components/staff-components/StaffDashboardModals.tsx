import IntakeModal from "@/components/staff-components/IntakeModal";
import ManualTaskModal from "@/components/ManualTaskModal";
import QuickNoteModal from "@/components/staff-components/QuickNoteModal";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import { AlertCircle } from "lucide-react";

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
}: StaffDashboardModalsProps) {
  // Wrapper function to convert ChangeEvent to (field, value) format
  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInputChange(name, value);
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
                window.location.reload();
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
        onClose={onClearPaymentError}
        onUpgrade={onUpgrade}
        errorMessage={paymentError || undefined}
        ignoredFiles={ignoredFiles}
      />

      {/* Upload Error Modal */}
      <UploadErrorModal
        isOpen={!!uploadError}
        onClose={onClearUploadError}
        errorMessage={uploadError || undefined}
      />

      <QuickNoteModal
        isOpen={showQuickNoteModal}
        task={selectedTaskForQuickNote}
        onClose={onCloseQuickNoteModal}
        onSave={onSaveQuickNote}
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
    </>
  );
}

// PaymentErrorModal component
const PaymentErrorModal = ({
  isOpen,
  onClose,
  onUpgrade,
  errorMessage,
  ignoredFiles,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  errorMessage?: string;
  ignoredFiles?: any[];
}) => {
  if (!isOpen) return null;

  const hasIgnoredFiles = ignoredFiles && ignoredFiles.length > 0;

  if (!hasIgnoredFiles && !errorMessage) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div
          className={`relative p-6 pb-8 flex-shrink-0 ${
            hasIgnoredFiles
              ? "bg-gradient-to-r from-orange-600 to-red-600"
              : "bg-gradient-to-r from-red-600 to-red-700"
          }`}
        >
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
            <h2 className="text-xl font-bold text-white">
              {hasIgnoredFiles ? "Files Not Uploaded" : "Upload Error"}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {hasIgnoredFiles ? (
            <>
              <p className="text-gray-700 leading-relaxed">
                {errorMessage ||
                  `${ignoredFiles.length} file${
                    ignoredFiles.length > 1 ? "s" : ""
                  } could not be uploaded:`}
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ignoredFiles.map((file, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                        <AlertCircle className="text-red-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-900 break-words">
                          {file.filename}
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {file.reason}
                        </p>
                        {file.existing_file && (
                          <p className="text-xs text-red-600 mt-1">
                            Already uploaded as:{" "}
                            <span className="font-medium">
                              {file.existing_file}
                            </span>
                          </p>
                        )}
                        {file.document_id && (
                          <p className="text-xs text-gray-500 mt-1">
                            Document ID: {file.document_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 leading-relaxed">
                {errorMessage ||
                  "An error occurred during upload. Please try again."}
              </p>
            </>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
          >
            Close
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
