// components/staff-components/UpdateDuplicateModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DuplicateDocument {
    id: string;
    patientName: string | null;
    dob: Date | string | null;
    doi?: Date | string | null;
    claimNumber: string | null;
    createdAt: Date;
    fileName: string;
    gcsFileLink?: string | null;
    blobPath?: string | null;
    groupName: string;
}

interface UpdateDuplicateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDoc: DuplicateDocument | null;
    formData: {
        patientName: string;
        dob: string;
        doi: string;
        claimNumber: string;
    };
    onInputChange: (field: string, value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export default function UpdateDuplicateModal({
    open,
    onOpenChange,
    selectedDoc,
    formData,
    onInputChange,
    onSubmit,
    isLoading,
}: UpdateDuplicateModalProps) {
    if (!selectedDoc) return null;

    const formatDateForInput = (date: Date | string | null | undefined) => {
        if (!date) return "";
        try {
            const d = new Date(date);
            return d.toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        Update Duplicate Patient Record
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Info Banner */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-yellow-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-800">
                                    Potential Duplicate Detected
                                </p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    This record has a similar claim number to other records. Please
                                    verify and update the information to ensure accuracy.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Original Document Info */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Original Document Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-600">File Name:</span>
                                <p className="font-medium text-gray-900 truncate" title={selectedDoc.fileName}>
                                    {selectedDoc.fileName}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Document ID:</span>
                                <p className="font-mono text-xs text-gray-900">{selectedDoc.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Patient Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.patientName}
                                onChange={(e) => onInputChange("patientName", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Enter patient name"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date of Birth (DOB)
                                </label>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => onInputChange("dob", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date of Injury (DOI)
                                </label>
                                <input
                                    type="date"
                                    value={formData.doi}
                                    onChange={(e) => onInputChange("doi", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Claim Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.claimNumber}
                                onChange={(e) => onInputChange("claimNumber", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono"
                                placeholder="Enter claim number"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onSubmit}
                            disabled={isLoading || !formData.patientName || !formData.claimNumber}
                            className="px-6 bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                </span>
                            ) : (
                                "Update Record"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
