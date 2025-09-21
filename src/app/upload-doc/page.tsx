"use client";
import { useState } from "react";
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
  Menu,
  Home,
  File,
  Settings,
  Moon,
  Sun,
  Eye,
  Copy,
  Download,
  ChevronDown,
  Highlight,
  BookOpen,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
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
    date: "Recent",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "Attorney Letter",
    id: "32:997",
    color: "doc-attorney",
    date: "Recent",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "Attorney Letter",
    id: "3/2/914",
    color: "doc-attorney",
    date: "Recent",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "PR-5 denial Uady",
    id: "4 Confidence be in torcers",
    color: "doc-specialty",
    date: "Recent",
    actions: ["Open PDF", "Draft Done"],
  },
];

const allCorrespondence = [
  {
    type: "QME Report",
    summary: "Nont recieved",
    confidence: null,
    date: "Recent",
    color: "doc-qme",
    actions: ["Open PDF", "Draft RFA", "Mark Done"],
  },
  {
    type: "UR Denial",
    summary: "Summary: Patient seen for follow-foul, recommended...",
    confidence: "92% AI Confidence",
    date: "Recent",
    color: "doc-ur-denial",
    actions: ["Open PDF", "Draft RFA"],
  },
  {
    type: "UR Denial",
    summary: "Summary: Denial based on lack of medical necessity.",
    confidence: "91% AI Confidence",
    date: "Recent",
    color: "doc-ur-denial",
    actions: ["Open PDF", "Draft RFA"],
  },
  {
    type: "Imaging Report",
    summary: "Summary: Denial based on lack of medical necessity.",
    confidence: "92% AI Confidence",
    date: "Recent",
    color: "doc-imaging",
    actions: ["Open PDF", "Draft Done"],
  },
  {
    type: "Specialty Consult",
    summary: "Summary: Denial based or ther tif wquest for 12 PT supported",
    confidence: null,
    date: "Recent",
    color: "doc-specialty",
    actions: ["Mark Done"],
  },
];

const tasks = [
  {
    id: 1,
    title: "Draft RFA for UR Denial",
    assignee: "Assigned to Monica",
    dueDate: "Due Today",
    priority: "+3 days",
    status: "active",
  },
];

const getDocTypeColor = (color: string, theme: string) => {
  const colorMapLight: { [key: string]: string } = {
    "doc-qme": "bg-blue-400",
    "doc-attorney": "bg-green-400",
    "doc-ur-denial": "bg-red-400",
    "doc-imaging": "bg-purple-400",
    "doc-specialty": "bg-yellow-400",
  };

  const colorMapDark: { [key: string]: string } = {
    "doc-qme": "bg-blue-700",
    "doc-attorney": "bg-green-700",
    "doc-ur-denial": "bg-red-700",
    "doc-imaging": "bg-purple-700",
    "doc-specialty": "bg-yellow-700",
  };

  const colorMap = theme === "dark" ? colorMapDark : colorMapLight;
  return colorMap[color] || "bg-gray-400";
};

// Professional Text Preview Component
const ProfessionalTextPreview = ({ result }: { result: any }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const formatConfidence = (confidence: number) => {
    const percentage = (confidence * 100).toFixed(1);
    const color =
      confidence > 0.8
        ? "bg-green-500"
        : confidence > 0.6
        ? "bg-yellow-500"
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
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute

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
      <Card className="shadow-card border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <FileText className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Document Analysis Report
                    <Badge variant="outline" className="text-xs">
                      {result.pages} Page{result.pages !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {readingTime} min read • {wordCount} words
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
                    className="h-8 w-8 p-0"
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
                    className="h-8 w-8 p-0"
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

        <CardContent className="space-y-6">
          {/* Confidence Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                AI Extraction Quality
              </h3>
              <Badge className={`text-xs ${confidenceInfo.color}`}>
                {confidenceInfo.percentage}%
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress value={confidenceInfo.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {getConfidenceMessage(result.confidence)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Summary Section */}
          {result.summary && (
            <>
              <Collapsible open={showSummary} onOpenChange={setShowSummary}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-0 hover:bg-transparent"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">AI Summary</span>
                        <Badge variant="secondary" className="text-xs ml-2">
                          GPT-4o
                        </Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          showSummary ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {result.summary}
                    </p>
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopySummary}
                        className="text-xs h-6"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Summary
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Text Preview Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Extracted Content
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullText(!showFullText)}
                className="text-xs h-8"
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
            <ScrollArea className="h-64 rounded-lg border bg-card/50">
              <div className="p-4 space-y-4">
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${confidenceInfo.color}`}
                    ></div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {result.fileInfo?.originalName || "Document"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Page {result.pages} of {result.pages}
                  </Badge>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                  <div
                    className={cn(
                      "prose prose-sm max-w-none leading-relaxed",
                      "text-foreground/90",
                      showFullText ? "max-h-none" : "line-clamp-8"
                    )}
                  >
                    <div className="text-base leading-6">
                      <p className="mb-3 first:mb-0">
                        {textPreview.split("\n").map((line, index) => (
                          <span key={index} className="block mb-1 last:mb-0">
                            {line}
                            {line &&
                              index < textPreview.split("\n").length - 1 && (
                                <span className="block h-1 w-full"></span>
                              )}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  {/* Highlighted Keywords (if entities exist) */}
                  {result.entities && result.entities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Highlight className="h-3 w-3" />
                        <span>
                          Key Entities Found ({result.entities.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.entities
                          .slice(0, 5)
                          .map((entity: any, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                            >
                              {entity.type}
                            </Badge>
                          ))}
                        {result.entities.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.entities.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                {!showFullText && (
                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">
                      Preview of {wordCount} total words
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullText(true)}
                      className="text-xs h-6 px-3"
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
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadText}
                  className="text-xs"
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
                        className="text-xs h-8 px-3"
                      >
                        <Highlight className="h-3 w-3 mr-1" />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Upload functionality states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const { theme, setTheme } = useTheme();

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

        // Add the new document to the newDocuments array (static for demo)
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 40 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 40MB",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Clinic Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline">Logout</Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-64 bg-background border-r fixed lg:relative h-full z-40 transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <nav className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <File className="mr-2 h-4 w-4" />
              Documents
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Documents</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowUpload(!showUpload)}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Document Upload Zone */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              {showUpload ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    selectedFile
                      ? "border-green-500 bg-green-50 dark:bg-green-100/20"
                      : "border-primary/30 hover:border-primary/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {uploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-medium">
                        Processing Document...
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedFile?.name} -{" "}
                        {formatSize(selectedFile?.size || 0)}
                      </p>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-4">
                      <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Ready to Process
                        </h3>
                        <p className="text-muted-foreground">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatSize(selectedFile.size)}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="default"
                          onClick={handleUpload}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Extract Content
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setUploadResult(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Drop medical documents here
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          PDF, DOCX, or images (max 40MB)
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
                            variant="default"
                            disabled={uploading}
                            asChild
                          >
                            <span>Choose File</span>
                          </Button>
                        </label>
                        <Button
                          variant="outline"
                          onClick={() => setShowUpload(false)}
                          disabled={uploading}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setShowUpload(true)}
                >
                  <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Drop medical documents here
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Upload PDFs, DOCX, or images for AI-powered extraction
                  </p>
                  <Button variant="default">Upload Files</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Text Preview - Replace the old upload results */}
          {uploadResult?.success && (
            <ProfessionalTextPreview result={uploadResult} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Since Check-in */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">New Since Check-in</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getDocTypeColor(
                            doc.color,
                            theme ?? "light"
                          )}`}
                        ></div>
                        <div>
                          <p className="font-medium text-sm">{doc.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="sm"
                            variant="ghost"
                            className="text-xs px-2 py-1"
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
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">All Correspondence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allCorrespondence.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-4 h-4 rounded-full ${getDocTypeColor(
                            doc.color,
                            theme ?? "light"
                          )}`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{doc.type}</p>
                            {doc.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                {doc.confidence}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {doc.summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="sm"
                            variant="outline"
                            className="text-xs"
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
          </div>

          {/* Tasks Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.assignee}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {task.dueDate}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Tracking */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Date Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No date tracking items at this time</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
