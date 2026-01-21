import React from "react";

interface UploadSectionProps {
  files?: File[]; // Make files optional
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
  loading: boolean;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const UploadSection = React.memo<UploadSectionProps>(
  ({ files = [], onFileSelect, onUpload, onCancel, loading, fileInputRef }) => (
    <div className="mb-3.5">
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,image/*"
        onChange={onFileSelect}
        className="hidden"
        ref={fileInputRef}
      />
      {files && files.length > 0 && (
        <div className="inline-flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
          <span className="text-sm text-gray-600">
            Selected: {files.map((f) => f.name).join(", ")}
          </span>
          <button
            onClick={onUpload}
            className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm disabled:opacity-50"
            disabled={loading}
          >
            Queue for Processing
          </button>
          <button
            onClick={onCancel}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
);