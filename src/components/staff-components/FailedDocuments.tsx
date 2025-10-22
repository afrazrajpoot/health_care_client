// app/dashboard/components/FailedDocuments.tsx
import { useState } from "react";
import {
  AlertCircle,
  FileX,
  Calendar,
  User,
  FileText,
  Hash,
} from "lucide-react";

interface FailedDocument {
  id: string;
  reason: string;
  db?: string;
  doi?: string;
  claimNumber?: string;
  patientName?: string;
  documentText?: string;
  physicianId?: string;
  gcsFileLink?: string;
  fileName: string;
  fileHash?: string;
  blobPath?: string;
}

interface FailedDocumentsProps {
  documents: FailedDocument[];
  onRowClick: (doc: FailedDocument) => void;
}

export default function FailedDocuments({
  documents,
  onRowClick,
}: FailedDocumentsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Unprocessed Documents & Action Needed
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {documents.length}{" "}
              {documents.length === 1 ? "document" : "documents"} requiring
              attention
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FileX className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-lg">
              No failed or unspecified documents found.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              All documents have been processed successfully!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      ID
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patient Name
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Claim Number
                    </div>
                  </th>
                  {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      DOI
                    </div>
                  </th> */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      DOB
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Reason
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc, index) => (
                  <tr
                    key={doc.id || index}
                    onClick={() => onRowClick(doc)}
                    className="hover:bg-red-50 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                      {doc.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {doc.patientName ? (
                          <span className="text-sm font-medium text-gray-900">
                            {doc.patientName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unspecified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {doc.claimNumber && doc.claimNumber !== "UNSPECIFIED" ? (
                        <span className="text-sm text-gray-900 font-mono">
                          {doc.claimNumber}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          UNSPECIFIED
                        </span>
                      )}
                    </td>
                    {/* <td className="px-4 py-4 text-sm text-gray-600">
                      {doc.doi ? formatDate(doc.doi) : "—"}
                    </td> */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span
                          className="text-sm text-gray-700 truncate"
                          title={doc.fileName}
                        >
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {doc.db && doc.db !== "Not specified" ? (
                        formatDate(doc.db)
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Not specified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-red-600 font-medium">
                        {doc.reason}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(doc);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all duration-150"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
