// components/dashboard/DashboardHeader.tsx
import { Session } from "next-auth";

interface DashboardHeaderProps {
  mode: "wc" | "gm";
  onModeChange: (mode: "wc" | "gm") => void;
  dense: boolean;
  onDenseChange: (dense: boolean) => void;
  departments: string[];
  onCreateIntakeLink: () => void;
  onAddManualTask: () => void;
  onRefresh: () => void;
  loading: boolean;
  session: Session | null;
  createLinkButtonRef: React.RefObject<HTMLButtonElement>;
  addManualTaskButtonRef: React.RefObject<HTMLButtonElement>;
}

export default function DashboardHeader({
  mode,
  onModeChange,
  dense,
  onDenseChange,
  departments,
  onCreateIntakeLink,
  onAddManualTask,
  onRefresh,
  loading,
  session,
  createLinkButtonRef,
  addManualTaskButtonRef,
}: any) {
  return (
    <div className="flex justify-between items-center mb-3 sticky top-0 bg-gray-50 z-10 pb-1.5">
      <h1 className="text-xl m-0">
        🧭 Kebilo Staff Dashboard — Mission Control v6.3
      </h1>
      <div className="flex gap-2 items-center">
        <label className="text-gray-500 text-xs flex gap-1.5 items-center">
          Mode:
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as "wc" | "gm")}
            className="p-1.5 px-2 border border-gray-200 rounded-lg text-xs"
          >
            <option value="wc">Workers&apos; Comp</option>
            <option value="gm">General Medicine</option>
          </select>
        </label>
        <label className="text-gray-500 text-xs flex gap-1.5 items-center">
          <input
            type="checkbox"
            checked={dense}
            onChange={(e) => onDenseChange(e.target.checked)}
          />
          Dense
        </label>
        <button className="px-2.5 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-blue-50 text-blue-900 border border-blue-200">
          Dept Settings
        </button>
        <button
          ref={createLinkButtonRef}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-1 px-1 rounded-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200"
          onClick={onCreateIntakeLink}
        >
          Create Intake Link
        </button>
        {/* Only show Add Manual Task for Physician role */}
        {session?.user?.role === "Physician" && (
          <button
            ref={addManualTaskButtonRef}
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-1 px-1 rounded-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200"
            onClick={onAddManualTask}
          >
            + Add Manual Task
          </button>
        )}
        <button
          className="px-2.5 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-blue-50 text-blue-900 border border-blue-200"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Tasks"}
        </button>
      </div>
    </div>
  );
}
