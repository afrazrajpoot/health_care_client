// hooks/useOfficePulse.ts
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

// import { Pulse } from "@/components/staff-components/types";

export const useOfficePulse = () => {
  const [fetchedPulse, setFetchedPulse] = useState<any | null>(null);
  const [workflowStats, setWorkflowStats] = useState<{
    labels: string[];
    vals: number[];
    date: string;
    hasData: boolean;
  } | null>(null);
  const { data: session, status } = useSession();

  const fetchOfficePulse = useCallback(async () => {
    if (!session?.user?.fastapi_token) {
      console.warn("No FastAPI token available, skipping office pulse fetch");
      return;
    }

    // ✅ Determine physician ID based on role
    const user = session?.user;
    const physicianId =
      user?.role === "Physician"
        ? user?.id // if Physician, use their own ID
        : user?.physicianId || ""; // otherwise, use assigned physician's ID

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/office-pulse?physicianId=${physicianId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.fastapi_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch office pulse");
      }

      const data = await response.json();
      setFetchedPulse(data.pulse);
    } catch (error) {
      console.error("Error fetching office pulse:", error);
      setFetchedPulse(null);
    }
  }, [session?.user?.fastapi_token]);

  const fetchWorkflowStats = useCallback(async () => {
    if (!session?.user?.fastapi_token) {
      console.warn("No FastAPI token available, skipping workflow stats fetch");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/workflow-stats`,
        {
          headers: {
            Authorization: `Bearer ${session.user.fastapi_token}`,
          },
        }
      );

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
  }, [session?.user?.fastapi_token]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOfficePulse();
      fetchWorkflowStats();
    }
  }, [status, fetchOfficePulse, fetchWorkflowStats]);

  return {
    pulse: fetchedPulse,
    workflowStats,
    fetchOfficePulse,
    fetchWorkflowStats,
  };
};
