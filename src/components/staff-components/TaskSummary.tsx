"use client";

import { 
  Clock, 
  AlertCircle, 
  CalendarClock, 
  CheckCircle, 
  TrendingUp,
  FileCheck
} from "lucide-react";

interface TaskSummaryProps {
  open: number;
  urgent: number;
  dueToday: number;
  completed: number;
  total?: number;
}

export default function TaskSummary({
  open,
  urgent,
  dueToday,
  completed,
  total,
}: TaskSummaryProps) {
  const calculatedTotal = total || (open + urgent + dueToday + completed);
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="bg-white border mt-6 border-gray-200 rounded-xl shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
            <FileCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="m-0 text-lg font-bold text-gray-900">Task Summary</h3>
            <p className="text-sm text-gray-500 m-0">Overview of all tasks</p>
          </div>
        </div>
        
        {/* Completion Progress */}
        <div className="hidden sm:block text-right">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Completion Rate:</span>
            <span className="text-lg font-bold text-gray-900">{completionRate}%</span>
          </div>
          <p className="text-xs text-gray-500 m-0">{completed} of {calculatedTotal} tasks</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Open Tasks Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-blue-50">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{open}</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Open Tasks</h4>
            <p className="text-xs text-gray-500 m-0">Requires attention</p>
          </div>
          
          {/* Urgent Tasks Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-red-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-red-50">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{urgent}</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Urgent</h4>
            <p className="text-xs text-gray-500 m-0">High priority items</p>
          </div>
          
          {/* Due Today Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-amber-50">
                <CalendarClock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{dueToday}</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Due Today</h4>
            <p className="text-xs text-gray-500 m-0">Deadline approaching</p>
          </div>
          
          {/* Completed Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{completed}</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Completed</h4>
            <p className="text-xs text-gray-500 m-0">Finished tasks</p>
          </div>
        </div>
        
        {/* Progress Bar - Mobile View */}
        <div className="mt-6 sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">0</span>
            <span className="text-xs text-gray-500">{completed}/{calculatedTotal}</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
        </div>
      </div>
    </section>
  );
}