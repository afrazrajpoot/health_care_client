// components/dashboard/OfficePulseSection.tsx
interface WorkflowStats {
  labels: string[];
  vals: number[];
  date: string;
  hasData: boolean;
}

interface OfficePulseSectionProps {
  pulse: any | null;
  workflowStats: WorkflowStats | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRefreshStats: () => void;
}

export default function OfficePulseSection({
  pulse,
  workflowStats,
  isCollapsed,
  onToggleCollapse,
  onRefreshStats,
}: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-2">
      <h2 className="m-0 mb-2 text-base flex items-center justify-between">
        📊 Office Pulse
        <button
          className="px-2.5 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-blue-50 text-blue-900 border border-blue-200"
          onClick={onToggleCollapse}
          style={{
            fontSize: "12px",
            padding: "4px 8px",
            minHeight: "auto",
          }}
        >
          {isCollapsed ? "▼ Expand" : "▲ Collapse"}
        </button>
      </h2>
      {!isCollapsed && (
        <div className="grid grid-cols-[1.4fr_1fr] gap-3 items-start">
          <div>
            <table className="w-full border-collapse mini-table">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 p-1.5 text-left text-xs bg-gray-50 font-semibold">
                    Department
                  </th>
                  <th className="border-b border-gray-200 p-1.5 text-left text-xs bg-gray-50 font-semibold">
                    Open
                  </th>
                  <th className="border-b border-gray-200 p-1.5 text-left text-xs bg-gray-50 font-semibold">
                    Overdue
                  </th>
                  <th className="border-b border-gray-200 p-1.5 text-left text-xs bg-gray-50 font-semibold">
                    Unclaimed
                  </th>
                </tr>
              </thead>
              <tbody>
                {pulse ? (
                  pulse.depts.map((rowOrObj: any, index: number) => {
                    if (
                      typeof rowOrObj === "object" &&
                      "department" in rowOrObj
                    ) {
                      const dept = rowOrObj as any;
                      return (
                        <tr key={index}>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {dept.department}
                          </td>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {dept.open}
                          </td>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {dept.overdue}
                          </td>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {dept.unclaimed}
                          </td>
                        </tr>
                      );
                    } else {
                      const row = rowOrObj as [
                        string,
                        number,
                        number,
                        number,
                        number
                      ];
                      return (
                        <tr key={index}>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {row[0]}
                          </td>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {row[1]}
                          </td>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {row[2]}
                          </td>
                          <td className="border-b border-gray-200 p-1.5 text-left text-xs">
                            {row[4]}
                          </td>
                        </tr>
                      );
                    }
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center p-5 text-gray-500 italic"
                    >
                      No pulse data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <button
              onClick={onRefreshStats}
              className="absolute top-0 right-0 px-2.5 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-blue-50 text-blue-900 border border-blue-200"
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                minHeight: "auto",
              }}
            >
              🔄 Refresh
            </button>
            {workflowStats ? (
              workflowStats.labels.map((label, index) => (
                <div key={index} className="text-gray-700">
                  <h4 className="text-xs m-0 mb-1 text-gray-500">{label}</h4>
                  <div className="text-base font-bold text-blue-600">
                    {workflowStats.vals[index]}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-1.5 border border-gray-200 rounded-lg text-center">
                <h4 className="m-0 mb-1 text-xs text-gray-500">
                  No Workflow Stats
                </h4>
                <div className="text-2xl font-bold text-gray-900">—</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
