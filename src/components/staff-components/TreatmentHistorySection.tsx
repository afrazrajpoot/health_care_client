import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Calendar, User } from "lucide-react";

interface Report {
  report_date: string;
  physician: string;
  document_id?: string;
  gcs_file_link?: string;
  blob_path?: string;
  [key: string]: any;
}

interface TreatmentHistoryData {
  [system: string]: Report[];
}

interface TreatmentHistorySectionProps {
  historyData: TreatmentHistoryData | null;
  loading: boolean;
}

export default function TreatmentHistorySection({
  historyData,
  loading,
}: TreatmentHistorySectionProps) {
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded w-full"></div>
          <div className="h-10 bg-gray-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!historyData || Object.keys(historyData).length === 0) {
    return null;
  }

  const toggleSystem = (system: string) => {
    if (expandedSystem === system) {
      setExpandedSystem(null);
    } else {
      setExpandedSystem(system);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_6px_18px_rgba(0,0,0,0.06)] mt-4 border border-gray-100">
      <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Treatment History
      </h3>

      <div className="space-y-3">
        {Object.entries(historyData).map(([system, reports]) => (
          <div
            key={system}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSystem(system)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-700">
                  {system}
                </span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {reports.length}
                </span>
              </div>
              {expandedSystem === system ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSystem === system && (
              <div className="p-3 bg-white border-t border-gray-200 space-y-3">
                {reports.map((report, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(report.report_date)}</span>
                      </div>
                      {report.gcs_file_link && (
                        <a
                          href={report.gcs_file_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View Report <FileText className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-slate-800">
                        {report.physician}
                      </span>
                    </div>

                    {/* Render other relevant fields dynamically if needed, or specific ones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {Object.entries(report).map(([key, value]) => {
                        if (
                          [
                            "report_date",
                            "physician",
                            "document_id",
                            "gcs_file_link",
                            "blob_path",
                          ].includes(key)
                        )
                          return null;
                        if (typeof value === "object") return null;

                        return (
                          <div key={key} className="text-xs">
                            <span className="text-gray-500 capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>{" "}
                            <span className="text-slate-700 font-medium">
                              {String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
