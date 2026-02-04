// components/staff-components/DuplicatePatients.tsx
import { useState } from "react";
import {
  AlertCircle,
  Users,
  Calendar,
  User,
  FileText,
  Eye,
} from "lucide-react";

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

interface DuplicatePatientsProps {
  documents: DuplicateDocument[];
  onRowClick: (doc: DuplicateDocument) => void;
}

export default function DuplicatePatients({
  documents,
  onRowClick,
}: DuplicatePatientsProps) {
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${month}-${day}-${year}`;
  };

  const handlePreviewFile = async (
    e: React.MouseEvent,
    doc: DuplicateDocument
  ) => {
    e.stopPropagation();

    if (!doc.gcsFileLink) {
      console.error("No file link available");
      return;
    }

    setLoadingPreview(doc.id);

    try {
      // Open the GCS file link directly in a new tab
      window.open(doc.gcsFileLink, "_blank");
    } catch (error) {
      console.error("Error opening file:", error);
    } finally {
      setLoadingPreview(null);
    }
  };

  // Group documents by normalized name for display
  const groupedDocs = documents.reduce((acc, doc) => {
    const key = doc.groupName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, DuplicateDocument[]>);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-100">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-lg">
            <Users className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Potential Duplicate Patients
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {documents.length}{" "}
              {documents.length === 1 ? "document" : "documents"} with similar
              claim numbers found
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-lg">
              No potential duplicates found.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              All patient records appear unique!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
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
                      <Calendar className="w-4 h-4" />
                      DOI
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(groupedDocs).map(([groupName, groupDocs]) => (
                  <>
                    {/* Group Header */}
                    <tr className="bg-yellow-50">
                      <td colSpan={6} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-800">
                            Duplicate Group: {groupName} ({groupDocs.length}{" "}
                            records)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Group Documents */}
                    {groupDocs.map((doc, index) => (
                      <tr
                        key={doc.id}
                        onClick={() => onRowClick(doc)}
                        className="hover:bg-yellow-50 transition-colors duration-150 cursor-pointer group"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {doc.patientName || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900 font-mono">
                            {doc.claimNumber || "—"}
                          </span>
                        </td>
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
                          {formatDate(doc.dob)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(doc.doi)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {doc.gcsFileLink && (
                              <button
                                onClick={(e) => handlePreviewFile(e, doc)}
                                disabled={loadingPreview === doc.id}
                                className="inline-flex items-center justify-center p-2 border border-blue-300 rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Preview File"
                              >
                                {loadingPreview === doc.id ? (
                                  <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRowClick(doc);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500 transition-all duration-150"
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
