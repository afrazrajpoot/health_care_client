"use client";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileProgress {
    index: number;
    filename: string;
    progress: number;
    status: "processing" | "success" | "failed" | "pending";
    message?: string;
}

interface ParallelProgressTrackerProps {
    filesProgress: (FileProgress | null)[];
    totalFiles: number;
    overallProgress: number;
    className?: string;
}

export function ParallelProgressTracker({
    filesProgress = [],
    totalFiles,
    overallProgress,
    className,
}: ParallelProgressTrackerProps) {
    const [displayFiles, setDisplayFiles] = useState<FileProgress[]>([]);

    // Filter and initialize files for display
    useEffect(() => {
        const validFiles = filesProgress
            .filter((f): f is FileProgress => f !== null)
            .sort((a, b) => a.index - b.index);
        setDisplayFiles(validFiles);
    }, [filesProgress]);

    const completedCount = displayFiles.filter(
        (f) => f.progress === 100
    ).length;
    const processingCount = displayFiles.filter(
        (f) => f.status === "processing" && f.progress < 100
    ).length;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Individual File Progress Cards */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {displayFiles.map((file) => (
                    <FileProgressCard key={file.index} file={file} />
                ))}
            </div>
        </div>
    );
}

function FileProgressCard({ file }: { file: FileProgress }) {
    const getStatusIcon = () => {
        switch (file.status) {
            case "success":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "failed":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "processing":
                return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
            default:
                return <FileText className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusColor = () => {
        switch (file.status) {
            case "success":
                return "border-green-200 bg-green-50";
            case "failed":
                return "border-red-200 bg-red-50";
            case "processing":
                return "border-blue-200 bg-blue-50 shadow-sm";
            default:
                return "border-gray-200 bg-gray-50";
        }
    };

    const getProgressBarColor = () => {
        switch (file.status) {
            case "success":
                return "bg-green-500";
            case "failed":
                return "bg-red-500";
            case "processing":
                return "bg-blue-500";
            default:
                return "bg-gray-300";
        }
    };

    return (
        <div
            className={cn(
                "rounded-lg border p-3 transition-all duration-300",
                getStatusColor()
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon()}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="truncate text-sm font-medium text-gray-900">
                            {file.filename}
                        </p>
                        <span className="shrink-0 text-xs font-semibold text-gray-600">
                            {file.progress}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={cn(
                                "h-full transition-all duration-300 ease-out",
                                getProgressBarColor()
                            )}
                            style={{ width: `${file.progress}%` }}
                        />
                    </div>

                    {/* Status Message */}
                    {file.message && (
                        <p className="mt-1.5 text-xs text-gray-600">{file.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
