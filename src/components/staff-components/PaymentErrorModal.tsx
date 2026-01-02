import React from 'react';
import { AlertCircle, X } from "lucide-react";

interface PaymentErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  errorMessage?: string;
  ignoredFiles?: any[];
}

const PaymentErrorModal: React.FC<PaymentErrorModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  errorMessage,
  ignoredFiles,
}) => {
  if (!isOpen) return null;

  const hasIgnoredFiles = ignoredFiles && ignoredFiles.length > 0;

  if (!hasIgnoredFiles && !errorMessage) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
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
            <X size={20} />
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

export default PaymentErrorModal;