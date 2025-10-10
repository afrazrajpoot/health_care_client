"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Trash2, Eye, AlertCircle, FileX, Download } from "lucide-react";

interface FailDoc {
  id: string;
  reasson: string;
  blobPath: string;
  physicianId: string | null;
}

export default function FailDocsPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [failDocs, setFailDocs] = useState<FailDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "http://localhost:8000";

  useEffect(() => {
    const fetchFailDocs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/fail-docs?physicianId=${session?.user?.physicianId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch failed documents");
        }
        const data = await response.json();
        setFailDocs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFailDocs();
  }, [session?.user?.physicianId]);

  const handlePreview = (blobPath: string) => {
    const previewUrl = `${API_BASE_URL}/api/preview/${encodeURIComponent(
      blobPath
    )}`;
    window.open(previewUrl, "_blank");
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this failed document?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fail-docs/${docId}?physicianId=${session?.user?.physicianId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      setFailDocs((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "An error occurred while deleting"
      );
    }
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-xl">
                <FileX className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Failed Documents
                </h1>
                <p className="text-slate-600 mt-1">
                  Physician ID:{" "}
                  <span className="font-semibold text-slate-900">
                    {session?.user?.physicianId}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Total Failed
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {failDocs.length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Card */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
              <CardTitle className="text-xl font-bold text-slate-900">
                Document List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {failDocs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <FileX className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Failed Documents
                  </h3>
                  <p className="text-slate-600">
                    All documents have been processed successfully.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-700">
                          Document ID
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Failure Reason
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          File Path
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failDocs.map((doc, index) => (
                        <TableRow
                          key={doc.id}
                          className="border-b hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="font-mono text-sm font-medium text-slate-900">
                            {doc.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="destructive"
                              className="font-medium px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              {doc.reasson}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600 truncate">
                                {doc.blobPath}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreview(doc.blobPath)}
                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc.id)}
                                className="hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}
