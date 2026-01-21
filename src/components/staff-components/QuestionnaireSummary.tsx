"use client";

import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Shield,
  Info
} from "lucide-react";

interface Chip {
  text: string;
  type: "blue" | "amber" | "red" | "green";
  icon?: "check" | "alert" | "clock" | "info" | "shield";
}

interface QuestionnaireSummaryProps {
  chips: Chip[];
  completionRate?: number;
  totalQuestions?: number;
  completedQuestions?: number;
}

export default function QuestionnaireSummary({
  chips,
  completionRate = 85,
  totalQuestions = 24,
  completedQuestions = 20,
}: QuestionnaireSummaryProps) {
  if (chips.length === 0) return null;

  const getChipClasses = (type: Chip["type"]) => {
    const base = "rounded-xl font-medium flex items-center gap-2 transition-all hover:scale-[1.02]";
    switch (type) {
      case "blue":
        return `${base} border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100`;
      case "amber":
        return `${base} border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100`;
      case "red":
        return `${base} border border-red-200 bg-red-50 text-red-900 hover:bg-red-100`;
      case "green":
        return `${base} border border-green-200 bg-green-50 text-green-900 hover:bg-green-100`;
    }
  };

  const getIcon = (type: Chip["type"], customIcon?: Chip["icon"]) => {
    if (customIcon) {
      switch (customIcon) {
        case "check": return <CheckCircle className="w-4 h-4" />;
        case "alert": return <AlertCircle className="w-4 h-4" />;
        case "clock": return <Clock className="w-4 h-4" />;
        case "info": return <Info className="w-4 h-4" />;
        case "shield": return <Shield className="w-4 h-4" />;
      }
    }
    
    switch (type) {
      case "blue": return <Info className="w-4 h-4" />;
      case "amber": return <Clock className="w-4 h-4" />;
      case "red": return <AlertCircle className="w-4 h-4" />;
      case "green": return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: Chip["type"]) => {
    switch (type) {
      case "blue": return "text-blue-600";
      case "amber": return "text-amber-600";
      case "red": return "text-red-600";
      case "green": return "text-green-600";
    }
  };

  return (
    <section className="bg-white mt-[1vw] border border-gray-200 rounded-xl shadow-[0_6px_20px_rgba(15,23,42,0.06)] overflow-hidden">
      {/* Header with Progress */}
      <div className="border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="m-0 text-lg font-bold text-gray-900">Pre‑Visit Questionnaire Summary</h3>
              <p className="text-sm text-gray-500 m-0">Patient responses and status</p>
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Completion:</span>
                <span className="text-lg font-bold text-gray-900">{completionRate}%</span>
              </div>
              <p className="text-xs text-gray-500 m-0">
                {completedQuestions}/{totalQuestions} questions
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Chips Section */}
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          {chips.map((chip, idx) => (
            <div
              key={idx}
              className={`px-4 py-3 ${getChipClasses(chip.type)}`}
            >
              <div className={`${getIconColor(chip.type)}`}>
                {getIcon(chip.type, chip.icon)}
              </div>
              <span className="text-sm font-semibold">{chip.text}</span>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Pending Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Urgent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}