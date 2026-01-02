"use client";

interface TaskSummaryProps {
  open: number;
  urgent: number;
  dueToday: number;
  completed: number;
}

export default function TaskSummary({
  open,
  urgent,
  dueToday,
  completed,
}: TaskSummaryProps) {
  return (
    <section className="bg-white border mt-[1vw] border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
      <h3 className="m-0 px-3.5 py-3 text-base font-bold border-b border-gray-200">Task Summary</h3>
      <div className="flex flex-wrap gap-2 px-4 pb-4 pt-3">
        <span className="text-xs px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-900 font-semibold whitespace-nowrap">
          Open: {open}
        </span>
        <span className="text-xs px-2 py-1 rounded-full border border-red-200 bg-red-50 text-red-900 font-semibold whitespace-nowrap">
          Urgent: {urgent}
        </span>
        <span className="text-xs px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-900 font-semibold whitespace-nowrap">
          Due Today: {dueToday}
        </span>
        <span className="text-xs px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-900 font-semibold whitespace-nowrap">
          Completed: {completed}
        </span>
      </div>
    </section>
  );
}

