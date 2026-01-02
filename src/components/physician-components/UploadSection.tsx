import React from "react";

interface UploadSectionProps {
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const UploadSection = React.memo<UploadSectionProps>(
  ({ files, onFileSelect, onUpload, onCancel, loading }) => (
    <div className="mb-3.5">
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,image/*"
        onChange={onFileSelect}
        className="hidden"
      />
      {files.length > 0 && (
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