"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import {
  Menu,
  X,
  Download,
  FileText,
  Calendar,
  Hash,
  User,
  ClipboardList,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface DocumentSummary {
  id: string;
  type: string;
  date: string;
  summary: string;
  documentId: string;
}

interface Document {
  id: string;
  patientName: string;
  claimNumber: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  gcsFileLink?: string;
  fileName?: string;
  originalName?: string;
  briefSummary?: string;
  dob?: string;
  doi?: string;
  reportDate?: string;
  mode?: string;
  documentSummary?: DocumentSummary;
  blobPath?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function RecentDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { data: session } = useSession();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };
    if (isSidebarOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch("/api/patient-documents");
        if (!res.ok) throw new Error("Failed to fetch documents");
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handlePreview = async (doc: Document) => {
    if (!doc.blobPath && !doc.gcsFileLink) {
      console.error("No file path found for preview");
      return;
    }

    setDownloadingId(doc.id);
    try {
      const filePath = doc.blobPath || doc.gcsFileLink;
      const response = await fetch(
        `https://api.kebilo.com/api/documents/preview/${encodeURIComponent(
          filePath
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      toast.success("Document opened successfully");
    } catch (err) {
      console.error("Preview failed:", err);
      toast.error("Failed to open preview. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.blobPath && !doc.gcsFileLink) {
      console.error("No file path found for download");
      return;
    }

    setDownloadingId(doc.id);
    try {
      const filePath = doc.blobPath || doc.gcsFileLink;
      const response = await fetch(
        `https://api.kebilo.com/api/documents/preview/${encodeURIComponent(
          filePath
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        doc.originalName || doc.fileName || `document-${doc.claimNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${doc.patientName}'s document downloaded`);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (documents.length === 0) return;

    setDownloadingAll(true);
    let successCount = 0;
    let failCount = 0;

    toast.info(`Starting download of ${documents.length} documents...`);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      if (!doc.blobPath && !doc.gcsFileLink) {
        console.warn(`Skipping document ${doc.id} - no file path`);
        failCount++;
        continue;
      }

      try {
        const filePath = doc.blobPath || doc.gcsFileLink;

        console.log(
          `Downloading ${i + 1}/${documents.length}: ${doc.patientName}`
        );

        const response = await fetch(
          `https://api.kebilo.com/api/documents/preview/${encodeURIComponent(
            filePath
          )}`,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.fastapi_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create unique filename with index to avoid duplicates
        const fileName =
          doc.originalName || doc.fileName || `document-${doc.claimNumber}`;
        const fileExtension = fileName.includes(".") ? "" : ".pdf";
        const uniqueFileName = `${i + 1}_${fileName}${fileExtension}`;

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = uniqueFileName;

        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        successCount++;
        toast.success(
          `Downloaded ${i + 1}/${documents.length}: ${doc.patientName}`
        );

        // Add delay between downloads
        if (i < documents.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      } catch (err) {
        console.error(`Download failed for ${doc.patientName}:`, err);
        failCount++;
        toast.error(`Failed to download: ${doc.patientName}`);
      }
    }

    setDownloadingAll(false);

    if (failCount > 0) {
      toast.warning(
        `Downloaded ${successCount} of ${documents.length} documents. ${failCount} failed.`
      );
    } else {
      toast.success(`Successfully downloaded all ${successCount} documents!`, {
        duration: 5000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("completed") || statusLower.includes("normal")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (statusLower.includes("pending")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    } else if (statusLower.includes("processing")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    } else if (
      statusLower.includes("urgent") ||
      statusLower.includes("moderate urgency")
    ) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    } else if (statusLower.includes("failed")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200"
      >
        <Menu size={18} className="text-gray-700" />
      </button>

      {/* Backdrop with transition */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar with enhanced transitions */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="font-semibold text-gray-800 text-base">Navigation</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/80 transition-colors duration-200"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
        <Sidebar />
      </div>

      {/* Main Content with transition when sidebar opens */}
      <main
        className={`max-w-6xl mx-auto py-10 px-5 lg:px-8 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:translate-x-16" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Document History
              </h1>
              <p className="text-gray-600 text-sm">
                View and manage all patient documents and medical records
              </p>
            </div>
            {!loading && documents.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Download size={16} />
                {downloadingAll ? "Downloading All..." : "Download All"}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600 text-sm">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
            <p className="text-red-700 text-sm font-medium">Error: {error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
            <FileText size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 text-sm">No documents found</p>
            <p className="text-gray-500 text-xs mt-1">
              Upload your first document to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <User
                          size={16}
                          className="text-blue-600 flex-shrink-0"
                        />
                        <h2 className="text-base font-semibold text-gray-900 truncate">
                          {doc.patientName}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Hash size={13} />
                        <span className="font-medium">Claim:</span>
                        <span>{doc.claimNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.documentSummary?.type && (
                        <span className="px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                          {doc.documentSummary.type}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  {/* Document Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                    {doc.dob && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={13} className="text-gray-500" />
                        <span className="text-gray-600">DOB:</span>
                        <span className="text-gray-900 font-medium">
                          {doc.dob}
                        </span>
                      </div>
                    )}
                    {doc.doi && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={13} className="text-gray-500" />
                        <span className="text-gray-600">DOI:</span>
                        <span className="text-gray-900 font-medium">
                          {doc.doi}
                        </span>
                      </div>
                    )}
                    {doc.documentSummary?.date && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={13} className="text-gray-500" />
                        <span className="text-gray-600">Document Date:</span>
                        <span className="text-gray-900 font-medium">
                          {formatShortDate(doc.documentSummary.date)}
                        </span>
                      </div>
                    )}
                    {doc.documentSummary?.type && (
                      <div className="flex items-center gap-2 text-xs">
                        <ClipboardList size={13} className="text-gray-500" />
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900 font-medium">
                          {doc.documentSummary.type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {doc.briefSummary && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-900 mb-1">
                        Clinical Summary
                      </p>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        {doc.briefSummary}
                      </p>
                    </div>
                  )}

                  {/* Document Summary Keywords */}
                  {doc.documentSummary?.summary && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-medium text-slate-900 mb-1">
                        Key Points
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {doc.documentSummary.summary}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Created: {formatDate(doc.createdAt)}</span>
                      </div>
                      {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>Updated: {formatDate(doc.updatedAt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {(doc.blobPath || doc.gcsFileLink) && (
                        <>
                          <button
                            onClick={() => handlePreview(doc)}
                            disabled={downloadingId === doc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors duration-200"
                          >
                            <FileText size={13} />
                            {downloadingId === doc.id ? "Loading..." : "View"}
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-xs font-medium rounded-md transition-colors duration-200"
                          >
                            <Download size={13} />
                            {downloadingId === doc.id
                              ? "Downloading..."
                              : "Download"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
