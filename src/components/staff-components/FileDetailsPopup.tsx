import React from 'react';
import { FileDetails } from "@/components/staff-components/types";

interface FileDetailsPopupProps {
  isOpen: boolean;
  files: FileDetails[];
  uploading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const FileDetailsPopup: React.FC<FileDetailsPopupProps> = ({
  isOpen,
  files,
  uploading,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">File Details</h2>
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={index} className="text-sm">
              <strong>Name:</strong> {file.name} <br />
              <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB <br />
              <strong>Type:</strong> {file.type}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDetailsPopup;