"use client";
import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Bot,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  Copy,
  Download,
  ChevronDown,
  BookOpen,
  Zap,
  Plus,
  MoreVertical,
  Calendar,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const newDocuments = [
  {
    type: "Attorney Letter",
    id: "35-30:917",
    color: "doc-attorney",
    date: "2 hours ago",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "Attorney Letter",
    id: "32:997",
    color: "doc-attorney",
    date: "3 hours ago",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "Attorney Letter",
    id: "3/2/914",
    color: "doc-attorney",
    date: "5 hours ago",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "PR-5 denial Uady",
    id: "4 Confidence be in torcers",
    color: "doc-specialty",
    date: "Yesterday",
    actions: ["Open PDF", "Draft Done"],
  },
];

const allCorrespondence = [
  {
    type: "QME Report",
    summary: "Not received",
    confidence: null,
    date: "Today",
    color: "doc-qme",
    actions: ["Open PDF", "Draft RFA", "Mark Done"],
  },
  {
    type: "UR Denial",
    summary: "Summary: Patient seen for follow-up, recommended...",
    confidence: "92% AI Confidence",
    date: "Today",
    color: "doc-ur-denial",
    actions: ["Open PDF", "Draft RFA"],
  },
  {
    type: "UR Denial",
    summary: "Summary: Denial based on lack of medical necessity.",
    confidence: "91% AI Confidence",
    date: "Yesterday",
    color: "doc-ur-denial",
    actions: ["Open PDF", "Draft RFA"],
  },
  {
    type: "Imaging Report",
    summary: "Summary: Denial based on lack of medical necessity.",
    confidence: "92% AI Confidence",
    date: "2 days ago",
    color: "doc-imaging",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "Specialty Consult",
    summary: "Summary: Denial based on their PT request for 12 PT supported",
    confidence: null,
    date: "3 days ago",
    color: "doc-specialty",
    actions: ["Mark Done"],
  },
];

const tasks = [
  {
    id: 1,
    title: "Draft RFA for UR Denial",
    assignee: "Monica Stevens",
    dueDate: "Today",
    priority: "+3 days",
    status: "active",
  },
];

const getDocTypeColor = (color: string, theme: string) => {
  const colorMapLight: { [key: string]: string } = {
    "doc-qme": "bg-blue-500",
    "doc-attorney": "bg-emerald-500",
    "doc-ur-denial": "bg-red-500",
    "doc-imaging": "bg-purple-500",
    "doc-specialty": "bg-amber-500",
  };

  return colorMapLight[color] || "bg-gray-500";
};

const getDocTypeColorLight = (color: string) => {
  const colorMapLight: { [key: string]: string } = {
    "doc-qme": "bg-blue-50 text-blue-700 border-blue-200",
    "doc-attorney": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "doc-ur-denial": "bg-red-50 text-red-700 border-red-200",
    "doc-imaging": "bg-purple-50 text-purple-700 border-purple-200",
    "doc-specialty": "bg-amber-50 text-amber-700 border-amber-200",
  };

  return colorMapLight[color] || "bg-gray-50 text-gray-700 border-gray-200";
};

// Professional Text Preview Component
const ProfessionalTextPreview = ({ result }: { result: any }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const formatConfidence = (confidence: number) => {
    const percentage = (confidence * 100).toFixed(1);
    const color =
      confidence > 0.8
        ? "bg-emerald-500"
        : confidence > 0.6
          ? "bg-amber-500"
          : "bg-red-500";
    return { percentage, color };
  };

  const getConfidenceMessage = (confidence: number) => {
    if (confidence > 0.8) return "Excellent extraction quality";
    if (confidence > 0.6) return "Good extraction quality";
    return "Review extraction quality";
  };

  const confidenceInfo = formatConfidence(result.confidence);

  const textPreview = showFullText
    ? result.text
    : result.text.substring(0, 500) + "...";
  const wordCount = result.text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleCopyText = () => {
    navigator.clipboard.writeText(result.text);
    toast.success("Text copied to clipboard!");
  };

  const handleCopySummary = () => {
    if (result.summary) {
      navigator.clipboard.writeText(result.summary);
      toast.success("Summary copied to clipboard!");
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([result.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.fileInfo?.originalName || "document"}_extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Text downloaded successfully!");
  };

  return (
    <TooltipProvider>
      <Card className="border border-gray-200/80 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200/50">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Document Analysis Report
                    <Badge variant="outline" className="text-xs font-medium border-gray-300">
                      {result.pages} Page{result.pages !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {readingTime} min read • {wordCount.toLocaleString()} words
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Copy extracted text</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadText}
                    className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Download as TXT</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Confidence Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-amber-50 rounded border border-amber-200/50">
                  <Zap className="h-3 w-3 text-amber-600" />
                </div>
                AI Extraction Quality
              </h3>
              <Badge className={`text-xs font-medium text-white ${confidenceInfo.color}`}>
                {confidenceInfo.percentage}%
              </Badge>
            </div>
            <div className="space-y-3">
              <Progress value={Number(confidenceInfo.percentage)} className="h-2" />
              <p className="text-xs text-gray-600">
                {getConfidenceMessage(result.confidence)}
              </p>
            </div>
          </div>

          <Separator className="bg-gray-100" />

          {/* Summary Section */}
          {result.summary && (
            <>
              <Collapsible open={showSummary} onOpenChange={setShowSummary}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between w-full py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-blue-50 rounded border border-blue-200/50">
                          <BookOpen className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900">AI Summary</span>
                        <Badge variant="secondary" className="text-xs ml-2 bg-gray-100 text-gray-700 border border-gray-300">
                          GPT-4o
                        </Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${showSummary ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                    <p className="text-sm leading-relaxed text-gray-700">
                      {result.summary}
                    </p>
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopySummary}
                        className="text-xs h-7 hover:bg-blue-100"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Summary
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator className="bg-gray-100" />
            </>
          )}

          {/* Text Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-gray-50 rounded border border-gray-200/50">
                  <FileText className="h-3 w-3 text-gray-600" />
                </div>
                Extracted Content
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullText(!showFullText)}
                className="text-xs h-8 border-gray-300 hover:bg-gray-50"
              >
                {showFullText ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Full Text
                  </>
                )}
              </Button>
            </div>

            {/* Professional Text Container */}
            <ScrollArea className="h-80 rounded-xl border border-gray-200 bg-white">
              <div className="p-6 space-y-4">
                {/* Document Header */}
                <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${confidenceInfo.color}`}
                    ></div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {result.fileInfo?.originalName || "Document"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs border-gray-300">
                    Page {result.pages} of {result.pages}
                  </Badge>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm leading-6 text-gray-700">
                      {textPreview.split("\n").map((line: string, index: number) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {line || "\u00A0"}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Highlighted Keywords */}
                  {result.entities && result.entities.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <div className="p-1 bg-amber-50 rounded border border-amber-200/50">
                          <Zap className="h-3 w-3 text-amber-600" />
                        </div>
                        <span className="font-medium">
                          Key Entities Found ({result.entities.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.entities
                          .slice(0, 5)
                          .map((entity: any, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200"
                            >
                              {entity.type}
                            </Badge>
                          ))}
                        {result.entities.length > 5 && (
                          <Badge variant="outline" className="text-xs border-gray-300">
                            +{result.entities.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* en */}
                {/* Footer Stats */}
                {!showFullText && (
                  <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Preview of {wordCount.toLocaleString()} total words
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullText(true)}
                      className="text-xs h-7 px-3 hover:bg-gray-50"
                    >
                      Read Full Document
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {showFullText && (
              <div className="flex flex-wrap gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  className="text-xs border-gray-300 hover:bg-gray-50"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadText}
                  className="text-xs border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download TXT
                </Button>
                {result.entities && result.entities.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 px-3 hover:bg-gray-50"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {result.entities.length} Entities
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Click to view extracted entities and form fields</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default function ClinicDocuments() {
  const [searchTerm, setSearchTerm] = useState("");

  // Upload functionality states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Global drag and drop event handlers
  useEffect(() => {
    const handleGlobalDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setShowUpload(true);
      }
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    // Add event listeners to document
    document.addEventListener('dragenter', handleGlobalDragEnter);
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    // Cleanup
    return () => {
      document.removeEventListener('dragenter', handleGlobalDragEnter);
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 40 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 40MB",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
      toast.success("File selected", {
        description: file.name,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("document", selectedFile);

    try {
      const response = await fetch(
        "http://localhost:8000/api/extract-document",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUploadResult(data);
        toast.success("Processing Complete!", {
          description: `Successfully extracted ${data.pages} pages`,
        });

        const newDoc = {
          type: "Uploaded Document",
          id: data.fileInfo?.originalName || `DOC-${Date.now()}`,
          color: "doc-specialty",
          date: "Just Now",
          actions: ["Open PDF", "View Results", "Mark Done"],
        };

        toast.success("Document added to your list!", {
          description: `New document: ${newDoc.type} (${newDoc.id})`,
        });
      } else {
        throw new Error(data.error || "Processing failed");
      }
    } catch (error: any) {
      toast.error("Processing Failed", {
        description: error.message || "Failed to process document",
      });
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleCopyResults = () => {
    if (uploadResult) {
      navigator.clipboard.writeText(JSON.stringify(uploadResult, null, 2));
      toast.success("Copied to Clipboard", {
        description: "Results copied successfully",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Validate file type
      const allowedTypes = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        toast.error("Invalid file type", {
          description: "Please upload PDF, DOCX, JPG, or PNG files only",
        });
        return;
      }

      // Validate file size
      if (file.size > 40 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 40MB",
        });
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
      setShowUpload(true); // Show upload section when file is dropped
      toast.success("File ready for upload", {
        description: `${file.name} (${formatSize(file.size)})`,
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Toaster position="top-right" richColors />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600 mt-2">
              Upload and process healthcare documents using AI-powered extraction
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-72 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowUpload(!showUpload)}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Upload
            </Button>
          </div>
        </div>

        {/* Enhanced Document Upload Zone */}
        <Card className="border border-gray-200/80 shadow-sm bg-white">
          <CardContent className="pt-6">
            {showUpload ? (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${selectedFile
                  ? "border-emerald-300 bg-emerald-50/50"
                  : isDragOver
                    ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                  }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                {uploading ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Processing Document...
                      </h3>
                      <p className="text-gray-600">
                        {selectedFile?.name} • {formatSize(selectedFile?.size || 0)}
                      </p>
                      <div className="mt-4 max-w-xs mx-auto">
                        <Progress value={65} className="h-2" />
                        <p className="text-xs text-gray-500 mt-2">Extracting text and analyzing content...</p>
                      </div>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                      <Check className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Ready to Process
                      </h3>
                      <p className="text-gray-700 font-medium">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatSize(selectedFile.size)}
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                        onClick={handleUpload}
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Extract Content
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadResult(null);
                        }}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${isDragOver
                      ? "bg-blue-200 border-2 border-blue-400 scale-110"
                      : "bg-blue-100 border border-blue-200"
                      }`}>
                      <Upload className={`h-8 w-8 transition-colors duration-300 ${isDragOver ? "text-blue-700" : "text-blue-600"
                        }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {isDragOver ? "Drop files here" : "Drop your medical documents here"}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {isDragOver
                          ? "Release to select your file for processing"
                          : "Drag & drop files here or use the button below • PDF, DOCX, JPG, PNG up to 40MB"
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={uploading}
                        />
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 px-6"
                          disabled={uploading}
                          asChild
                        >
                          <span>{isDragOver ? "Drop Files Here" : "Choose Files"}</span>
                        </Button>
                      </label>
                      <Button
                        variant="outline"
                        onClick={() => setShowUpload(false)}
                        disabled={uploading}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${isDragOver
                  ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-lg"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30"
                  }`}
                onClick={() => setShowUpload(true)}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${isDragOver
                  ? "bg-blue-200 border-2 border-blue-400 scale-110"
                  : "bg-blue-100 border border-blue-200"
                  }`}>
                  <Upload className={`h-8 w-8 transition-colors duration-300 ${isDragOver ? "text-blue-700" : "text-blue-600"
                    }`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragOver ? "Drop files here" : "Drop medical documents here"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isDragOver
                    ? "Release to upload your files"
                    : "Drag & drop files here or click to browse • PDF, DOCX, JPG, PNG up to 40MB"
                  }
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  {isDragOver ? "Drop Files Here" : "Upload Files"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Text Preview */}
        {uploadResult?.success && (
          <ProfessionalTextPreview result={uploadResult} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Since Check-in */}
          <Card className="border border-gray-200/80 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-emerald-50 rounded border border-emerald-200/50">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                New Since Check-in
                <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 border border-blue-200">
                  {newDocuments.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {newDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="group p-4 border border-gray-200 rounded-lg hover:bg-gray-50/50 hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getDocTypeColor(
                            doc.color,
                            "light"
                          )}`}
                        ></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{doc.type}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ID: {doc.id}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{doc.date}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {doc.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          size="sm"
                          variant="ghost"
                          className="text-xs px-3 py-1.5 h-auto hover:bg-gray-100 text-gray-700"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Correspondence */}
          <Card className="border border-gray-200/80 shadow-sm bg-white lg:col-span-2">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-blue-50 rounded border border-blue-200/50">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                All Correspondence
                <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700 border border-gray-200">
                  {allCorrespondence.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {allCorrespondence.map((doc, index) => (
                  <div
                    key={index}
                    className="group p-5 border border-gray-200 rounded-lg hover:bg-gray-50/50 hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-4 h-4 rounded-full mt-1 ${getDocTypeColor(
                            doc.color,
                            "light"
                          )}`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">{doc.type}</p>
                            {doc.confidence && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                <Bot className="h-3 w-3 mr-1" />
                                {doc.confidence}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 ml-auto">{doc.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {doc.summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {doc.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-1.5 h-auto border-gray-300 hover:bg-gray-50"
                          >
                            {action}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card className="border border-gray-200/80 shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="p-1 bg-green-50 rounded border border-green-200/50">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              Active Tasks
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border border-green-200">
                {tasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group p-5 border border-gray-200 rounded-lg hover:bg-gray-50/50 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {task.dueDate}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        View Task
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Tracking */}
        <Card className="border border-gray-200/80 shadow-sm bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="p-1 bg-purple-50 rounded border border-purple-200/50">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              Date Tracking
              <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700 border border-gray-200">
                0
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tracking items</h3>
              <p className="text-gray-500 mb-4">Date tracking items will appear here when available</p>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Plus className="h-4 w-4 mr-2" />
                Add Tracking Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}