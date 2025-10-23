// components/dashboard/ModalsWrapper.tsx
import IntakeModal from "@/components/staff-components/IntakeModal";
import ManualTaskModal from "@/components/ManualTaskModal";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalsWrapperProps {
  showModal: boolean;
  onCloseModal: () => void;
  showTaskModal: boolean;
  onCloseTaskModal: (open: boolean) => void;
  departments: string[];
  onCreateManualTask: (formData: any) => Promise<void>;
  isUpdateModalOpen: boolean;
  onCloseUpdateModal: (open: boolean) => void;
  selectedDoc: any;
  updateFormData: any;
  onUpdateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateSubmit: () => Promise<void>;
  updateLoading: boolean;
  isFileModalOpen: boolean;
  onCloseFileModal: (open: boolean) => void;
  selectedFiles: File[];
  formatSize: (bytes: number) => string;
  uploading: boolean;
  onFileSubmit: () => Promise<void>;
  onFileCancel: () => void;
}

export default function ModalsWrapper({
  showModal,
  onCloseModal,
  showTaskModal,
  onCloseTaskModal,
  departments,
  onCreateManualTask,
  isUpdateModalOpen,
  onCloseUpdateModal,
  selectedDoc,
  updateFormData,
  onUpdateInputChange,
  onUpdateSubmit,
  updateLoading,
  isFileModalOpen,
  onCloseFileModal,
  selectedFiles,
  formatSize,
  uploading,
  onFileSubmit,
  onFileCancel,
}: ModalsWrapperProps) {
  return (
    <>
      <IntakeModal isOpen={showModal} onClose={onCloseModal} />

      <ManualTaskModal
        open={showTaskModal}
        onOpenChange={onCloseTaskModal}
        departments={departments}
        onSubmit={onCreateManualTask}
      />

      <UpdateDocumentModal
        open={isUpdateModalOpen}
        onOpenChange={onCloseUpdateModal}
        selectedDoc={selectedDoc}
        formData={updateFormData}
        onInputChange={onUpdateInputChange}
        onSubmit={onUpdateSubmit}
        isLoading={updateLoading}
      />

      {/* File Submission Modal */}
      <Dialog open={isFileModalOpen} onOpenChange={onCloseFileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selected Files ({selectedFiles.length})</DialogTitle>
            <DialogDescription>
              Review your selected files before submitting for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span
                    className="text-sm truncate flex-1 mr-2"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ({formatSize(file.size)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="flex space-x-2">
            <button
              className="mr-2 px-3 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors disabled:opacity-50"
              onClick={onFileCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              onClick={onFileSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </span>
              ) : (
                "Submit for Processing"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
