// app/dashboard/components/FailedDocuments.tsx
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  FileX,
  Calendar,
  User,
  FileText,
  Hash,
  Eye,
  Trash2,
  X,
  Scissors,
  Loader2,
  CheckCircle2,
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
  onDocumentDeleted?: (docId: string) => void;
  mode?: "wc" | "gm";
  physicianId?: string;
}

export default function FailedDocuments({
  documents,
  onRowClick,
  onDocumentDeleted,
  mode = "wc",
  physicianId,
}: FailedDocumentsProps) {
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<FailedDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [documentToSplit, setDocumentToSplit] = useState<FailedDocument | null>(
    null
  );
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResults, setSplitResults] = useState<any>(null);
  const [pageRanges, setPageRanges] = useState<
    Array<{ start_page: number; end_page: number; report_title: string }>
  >([{ start_page: 1, end_page: 1, report_title: "" }]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const handlePreviewFile = async (
    e: React.MouseEvent,
    doc: FailedDocument
  ) => {
    e.stopPropagation();

    if (!doc.gcsFileLink) {
      console.error("No file link available");
      return;
    }

    setLoadingPreview(doc.id);

    try {
      // Modify the GCS URL to force inline display instead of download
      let previewUrl = doc.gcsFileLink;

      // For GCS signed URLs, add response-content-disposition=inline parameter
      if (
        previewUrl.includes("storage.googleapis.com") ||
        previewUrl.includes("storage.cloud.google.com")
      ) {
        const separator = previewUrl.includes("?") ? "&" : "?";
        previewUrl = `${previewUrl}${separator}response-content-disposition=inline`;
      }

      // Use Google Docs Viewer for PDF files to ensure they open in browser
      const fileName = doc.fileName?.toLowerCase() || "";
      if (
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsx")
      ) {
        // Use Google Docs Viewer to display the file
        previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
          doc.gcsFileLink
        )}&embedded=true`;
      }

      // Open in a new tab/window for preview
      const newWindow = window.open(
        previewUrl,
        "_blank",
        "noopener,noreferrer"
      );
      if (!newWindow) {
        console.error("Popup was blocked. Please allow popups for this site.");
      }
    } catch (error) {
      console.error("Error opening file:", error);
    } finally {
      setLoadingPreview(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: FailedDocument) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/get-failed-document/${documentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      // Notify parent component about the deletion
      if (onDocumentDeleted) {
        onDocumentDeleted(documentToDelete.id);
      }

      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  const handleSplitClick = (e: React.MouseEvent, doc: FailedDocument) => {
    e.stopPropagation();
    if (!doc.blobPath) {
      alert("No blob path available - cannot extract pages from document");
      return;
    }
    setDocumentToSplit(doc);
    setSplitModalOpen(true);
    setSplitResults(null);
    // Initialize with one page range
    setPageRanges([{ start_page: 1, end_page: 1, report_title: "" }]);
  };

  const handleAddPageRange = () => {
    setPageRanges([
      ...pageRanges,
      { start_page: 1, end_page: 1, report_title: "" },
    ]);
  };

  const handleRemovePageRange = (index: number) => {
    if (pageRanges.length > 1) {
      setPageRanges(pageRanges.filter((_, i) => i !== index));
    }
  };

  const handlePageRangeChange = (
    index: number,
    field: "start_page" | "end_page" | "report_title",
    value: string | number
  ) => {
    const updated = [...pageRanges];
    updated[index] = { ...updated[index], [field]: value };
    setPageRanges(updated);
  };

  const handleSplitAndProcess = async () => {
    if (!documentToSplit || !documentToSplit.blobPath || !physicianId) {
      toast.error("Missing required information for splitting", {
        duration: 5000,
      });
      return;
    }

    // Validate page ranges
    const validRanges = pageRanges.filter(
      (range) =>
        range.start_page > 0 &&
        range.end_page >= range.start_page &&
        range.report_title.trim() !== ""
    );

    if (validRanges.length === 0) {
      toast.error(
        "Please add at least one valid page range with a report title",
        {
          duration: 5000,
        }
      );
      return;
    }

    setIsSplitting(true);
    setSplitResults(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_PYTHON_API_URL || "https://api.doclatch.com"
        }/api/documents/split-and-process-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: mode,
            physician_id: physicianId,
            original_filename: documentToSplit.fileName || "split_document",
            fail_doc_id: documentToSplit.id,
            blob_path: documentToSplit.blobPath, // GCS blob path to extract pages from
            page_ranges: validRanges, // Staff-provided page ranges
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to split document");
      }

      const data = await response.json();
      setSplitResults(data);
      // Show success message
      if (data.saved_documents && data.saved_documents > 0) {
        toast.success(
          `Successfully split and saved ${data.saved_documents} document(s)!`,
          {
            description: `Document IDs: ${
              data.document_ids?.join(", ") || "N/A"
            }`,
            duration: 5000,
          }
        );
        // Optionally refresh the failed documents list
        if (onDocumentDeleted && documentToSplit.id) {
          setTimeout(() => {
            onDocumentDeleted(documentToSplit.id);
          }, 1000);
        }
      } else {
        toast.warning("Documents processed but not all were saved", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error splitting document:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to split and process document",
        {
          duration: 5000,
        }
      );
    } finally {
      setIsSplitting(false);
    }
  };

  const handleCloseSplitModal = () => {
    setSplitModalOpen(false);
    setDocumentToSplit(null);
    setSplitResults(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="  px-6 py-4 border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Documents & Action Required
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
                    {/* <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                      {doc.id}
                    </td> */}
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
                        {/* {doc.documentText && (
                          <button
                            onClick={(e) => handleSplitClick(e, doc)}
                            className="inline-flex items-center justify-center p-2 border border-purple-300 rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 transition-all duration-150"
                            title="Split & Process Document"
                          >
                            <Scissors className="w-4 h-4" />
                          </button>
                        )} */}
                        <button
                          onClick={(e) => handleDeleteClick(e, doc)}
                          className="inline-flex items-center justify-center p-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all duration-150"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(doc);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all duration-150"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 transition-opacity"
              onClick={handleCancelDelete}
            />

            {/* Modal */}
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Delete Document
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this document? This
                        action cannot be undone.
                      </p>
                      {documentToDelete && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700">
                            {documentToDelete.fileName}
                          </p>
                          {documentToDelete.patientName && (
                            <p className="text-sm text-gray-500 mt-1">
                              Patient: {documentToDelete.patientName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleCancelDelete}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split & Process Modal */}
      {splitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 transition-opacity"
              onClick={handleCloseSplitModal}
            />

            {/* Modal */}
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Scissors className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        Split & Process Document
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Split multi-report document into individual reports
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseSplitModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {documentToSplit && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700">
                      {documentToSplit.fileName}
                    </p>
                    {documentToSplit.patientName && (
                      <p className="text-sm text-gray-500 mt-1">
                        Patient: {documentToSplit.patientName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Reason: {documentToSplit.reason}
                    </p>
                  </div>
                )}

                {!splitResults && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Specify Page Ranges for Each Report:
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Enter the page numbers where each report starts and
                        ends. For example: QME on pages 1-5, PR2 on pages 6-10.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {pageRanges.map((range, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 border border-gray-200 rounded-md"
                        >
                          <div className="flex-1 grid grid-cols-12 gap-2">
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Start Page
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={range.start_page}
                                onChange={(e) =>
                                  handlePageRangeChange(
                                    index,
                                    "start_page",
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                End Page
                              </label>
                              <input
                                type="number"
                                min={range.start_page}
                                value={range.end_page}
                                onChange={(e) =>
                                  handlePageRangeChange(
                                    index,
                                    "end_page",
                                    parseInt(e.target.value) || range.start_page
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="col-span-5">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Report Title (e.g., QME, PR2)
                              </label>
                              <input
                                type="text"
                                value={range.report_title}
                                onChange={(e) =>
                                  handlePageRangeChange(
                                    index,
                                    "report_title",
                                    e.target.value
                                  )
                                }
                                placeholder="QME, PR2, PR4, etc."
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="col-span-1 flex items-end">
                              {pageRanges.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePageRange(index)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Remove"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPageRange}
                      className="w-full px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
                    >
                      + Add Another Page Range
                    </button>

                    <div className="pt-4 border-t">
                      <button
                        type="button"
                        disabled={isSplitting}
                        onClick={handleSplitAndProcess}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSplitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Extracting Pages & Processing...
                          </>
                        ) : (
                          <>
                            <Scissors className="w-4 h-4" />
                            Extract Pages & Process Documents
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {splitResults && (
                  <div className="mt-4">
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Successfully split into {splitResults.total_reports}{" "}
                            report(s)
                          </p>
                          {splitResults.saved_documents > 0 && (
                            <p className="text-xs text-green-700 mt-1">
                              {splitResults.saved_documents} document(s) saved
                              to database
                              {splitResults.document_ids &&
                                splitResults.document_ids.length > 0 && (
                                  <span className="ml-2">
                                    (IDs: {splitResults.document_ids.join(", ")}
                                    )
                                  </span>
                                )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {splitResults.reports?.map(
                        (report: any, index: number) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Report {report.report_index}:{" "}
                                  {report.report_title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  Type: {report.document_type} (Confidence:{" "}
                                  {(
                                    report.document_type_confidence * 100
                                  ).toFixed(0)}
                                  %)
                                </p>
                              </div>
                              {report.status === "failed" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Failed
                                </span>
                              ) : report.document_id ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Saved (ID:{" "}
                                  {report.document_id.substring(0, 8)}...)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Processed
                                </span>
                              )}
                            </div>

                            {report.error ? (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800">
                                  Error: {report.error}
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                    Short Summary:
                                  </p>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    {report.short_summary || "N/A"}
                                  </p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                    Long Summary:
                                  </p>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                                    {report.long_summary || "N/A"}
                                  </p>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {report.start_page && report.end_page && (
                                    <p className="text-xs text-gray-400">
                                      Pages: {report.start_page}-
                                      {report.end_page} (
                                      {report.page_count ||
                                        report.end_page -
                                          report.start_page +
                                          1}{" "}
                                      pages)
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    Text length: {report.text_length} characters
                                  </p>
                                  {report.patient_name && (
                                    <p className="text-xs text-gray-600">
                                      Patient: {report.patient_name}
                                    </p>
                                  )}
                                  {report.claim_number && (
                                    <p className="text-xs text-gray-600">
                                      Claim: {report.claim_number}
                                    </p>
                                  )}
                                  {report.document_id && (
                                    <p className="text-xs text-blue-600 font-medium">
                                      Document ID: {report.document_id}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleCloseSplitModal}
                  className="inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
