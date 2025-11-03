// hooks/useOfficePulse.ts
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
// import { Pulse } from "@/components/staff-components/types";

export const useOfficePulse = () => {
  const [fetchedPulse, setFetchedPulse] = useState<any | null>(null);
  const [workflowStats, setWorkflowStats] = useState<{
    labels: string[];
    vals: number[];
    date: string;
    hasData: boolean;
  } | null>(null);

  const fetchOfficePulse = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/office-pulse`);

      if (!response.ok) {
        throw new Error("Failed to fetch office pulse");
      }

      const data = await response.json();
      setFetchedPulse(data.pulse);
    } catch (error) {
      console.error("Error fetching office pulse:", error);
      setFetchedPulse(null);
    }
  }, []);

  const fetchWorkflowStats = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/workflow-stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch workflow stats");
      }

      const data = await response.json();
      if (data.success) {
        setWorkflowStats({
          labels: data.data.labels,
          vals: data.data.vals,
          date: data.data.date,
          hasData: data.data.hasData,
        });
      }
    } catch (error) {
      console.error("Error fetching workflow stats:", error);
      setWorkflowStats(null);
    }
  }, []);

  useEffect(() => {
    fetchOfficePulse();
    fetchWorkflowStats();
  }, [fetchOfficePulse, fetchWorkflowStats]);

  return {
    pulse: fetchedPulse,
    workflowStats,
    fetchOfficePulse,
    fetchWorkflowStats,
  };
};
