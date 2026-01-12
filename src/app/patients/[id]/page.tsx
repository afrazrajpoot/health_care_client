// app/patients/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Edit,
  Download,
  User,
  Activity,
  Shield,
  Users,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

interface Patient {
  id: string;
  name: string;
  claimNo: string;
  doi: string;
  workStatus: "TTD" | "MODIFIED" | "REGULAR";
  workStatusUpdatedAt: string;
  accepted: string[];
  denied: string[];
  restrictions: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  date: string;
  summary: string;
  actions: string[];
  gcsFileLink?: string;
  patientQuizPage?: string;
}

const PatientDetail = ({ params }: { params: { id: string } }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/get-patient/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch patient data");
        }
        const data: any = await response.json();
        setRawData(data);

        // Map fetched document data to Patient interface
        const now = new Date("2025-10-07"); // Current date as provided
        const updated = new Date(data.updatedAt);
        const daysDiff = Math.floor(
          (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
        );
        const doiDate = new Date(data.doi);
        const doiFormatted = `${(doiDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${doiDate
          .getDate()
          .toString()
          .padStart(2, "0")}-${doiDate.getFullYear()}`;
        const updatedFormatted = `${String(updated.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(updated.getDate()).padStart(
          2,
          "0"
        )}-${updated.getFullYear()}`;

        // Map status to workStatus
        let workStatus: "TTD" | "MODIFIED" | "REGULAR" = "REGULAR";
        if (data.status === "Urgent") {
          workStatus = "TTD";
        } else if (data.status === "normal") {
          workStatus = "REGULAR";
        }

        const mappedPatient: Patient = {
          id: data.id,
          name: data.patientName,
          claimNo: data.claimNumber,
          doi: doiFormatted,
          workStatus,
          workStatusUpdatedAt: data.updatedAt, // Full date for calculation
          accepted: data.summarySnapshot?.dx
            ? [data.summarySnapshot.dx.split(",")[0].trim()]
            : [],
          denied: data.adl?.adlsAffected ? [data.adl.adlsAffected] : [],
          restrictions: data.adl?.workRestrictions || "None",
        };

        // Map to documents array
        const docDate = new Date(data.documentSummary?.date || data.createdAt);
        const docDateFormatted = `${String(docDate.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(docDate.getDate()).padStart(
          2,
          "0"
        )}-${docDate.getFullYear()}`;
        const mappedDocuments: Document[] = [
          {
            id: data.id,
            title: data.documentSummary?.type || "Medical Report",
            type: data.documentSummary?.type?.split(" ")[0] || "REPORT",
            date: docDateFormatted,
            summary:
              data.briefSummary ||
              data.documentSummary?.summary ||
              "No summary available",
            actions: ["Open PDF", "Mark Done"],
            gcsFileLink: data.gcsFileLink,
            patientQuizPage: data.patientQuizPage,
          },
        ];

        setPatient(mappedPatient);
        setDocuments(mappedDocuments);
      } catch (err) {
        setError("Failed to load patient data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [params.id]);

  const calculateDaysOverdue = (lastUpdate: string) => {
    const now = new Date("2025-10-07");
    const last = new Date(lastUpdate);
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const handleDownloadFile = (fileUrl: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "document.pdf"; // Adjust filename as needed
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </LayoutWrapper>
    );
  }

  if (error || !patient || !rawData) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center text-red-600">
            {error || "Patient not found"}
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  const daysOverdue = calculateDaysOverdue(patient.workStatusUpdatedAt);
  const formattedUpdatedDate = getFormattedDate(patient.workStatusUpdatedAt);

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-6 pb-8 border-b border-gray-200">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {patient.name}
                  </h1>
                  <p className="text-gray-600 font-medium">
                    {patient.claimNo} • DOI: {patient.doi}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel - Patient Info */}
              <div className="space-y-6">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-gray-700" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-gray-900">
                        Work Status
                      </h3>
                      <div
                        className={`p-4 rounded-lg border-l-4 ${
                          daysOverdue > 30
                            ? "bg-amber-50 border-l-amber-400 border border-amber-200"
                            : "bg-green-50 border-l-green-400 border border-green-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {daysOverdue > 30 && (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          <span className="font-semibold text-gray-900">
                            {patient.workStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Last updated {formattedUpdatedDate} ({daysOverdue}{" "}
                          days ago)
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium"
                        >
                          Update Work Status
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Accepted
                        </h4>
                        <div className="space-y-2">
                          {patient.accepted.map((part) => (
                            <Badge
                              key={part}
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                            >
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          Denied
                        </h4>
                        <div className="space-y-2">
                          {patient.denied.map((part) => (
                            <Badge
                              key={part}
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 font-medium"
                            >
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold mb-2 text-gray-900">
                        Restrictions
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {patient.restrictions}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-700" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Key Concern:{" "}
                        {rawData.summarySnapshot?.keyConcern || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Next Step: {rawData.summarySnapshot?.nextStep || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center Panel - Tabs */}
              <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-50 border border-gray-200">
                    <TabsTrigger
                      value="overview"
                      className="font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="new-checkin"
                      className="font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200"
                    >
                      Documents
                    </TabsTrigger>
                    <TabsTrigger
                      value="tasks"
                      className="font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-gray-200"
                    >
                      Summary
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 mt-8">
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="font-semibold text-gray-900">
                          What's New
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(rawData.whatsNew || {}).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">
                                {key}:{" "}
                                {typeof value === "string"
                                  ? value
                                  : "Updated details"}
                              </span>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="new-checkin" className="space-y-6 mt-8">
                    {documents.map((doc) => (
                      <Card
                        key={doc.id}
                        className="border border-gray-200 shadow-sm"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {doc.title}{" "}
                                <span className="text-gray-600 font-normal">
                                  {doc.date}
                                </span>
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.summary}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`font-medium ${
                                doc.type === "QME"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-[#33c7d8] border-purple-200"
                              }`}
                            >
                              {doc.type}
                            </Badge>
                          </div>

                          {/* Additional buttons for download and quiz */}
                          {doc.gcsFileLink && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownloadFile(doc.gcsFileLink!)
                                }
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download File
                              </Button>
                            </div>
                          )}
                          {doc.patientQuizPage && (
                            <div className="flex gap-2 mt-2">
                              <Link
                                href={doc.patientQuizPage}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  ADL Form
                                </Button>
                              </Link>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-8">
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="font-semibold text-gray-900">
                          Document Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <p className="font-semibold text-gray-900">
                              Diagnosis: {rawData.summarySnapshot?.dx || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Key Concern:{" "}
                              {rawData.summarySnapshot?.keyConcern || "N/A"}
                            </p>
                          </div>
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <p className="font-semibold text-gray-900">
                              Next Steps:{" "}
                              {rawData.summarySnapshot?.nextStep || "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default PatientDetail;
