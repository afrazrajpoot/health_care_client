// hooks/useADL.ts
import { useCallback } from "react";

interface ADL {
  adls_affected: string;
  adls_affected_history: string;
  work_restrictions: string;
  work_restrictions_history: string;
  has_changes: boolean;
}

interface DocumentData {
  adl?: ADL;
  // Other properties omitted for brevity
}

export const useADLData = (documentData: DocumentData | null) => {
  // Get collapsed summary
  const getADLSummary = useCallback(() => {
    return documentData?.adl?.adls_affected
      ? "Restrictions"
      : "No restrictions";
  }, [documentData]);

  // Get ADLs affected text
  const getADLsAffected = useCallback(() => {
    return documentData?.adl?.adls_affected || "Not specified";
  }, [documentData]);

  // Get work restrictions text
  const getWorkRestrictions = useCallback(() => {
    return documentData?.adl?.work_restrictions || "Not specified";
  }, [documentData]);

  return {
    getADLSummary,
    getADLsAffected,
    getWorkRestrictions,
  };
};
