import { useState, useCallback, useEffect } from "react";
import { useGetPatientRecommendationsQuery } from "@/redux/dashboardApi";

interface Patient {
  id?: string | number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

export const useSearch = (mode: "wc" | "gm") => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);

  const getPhysicianId = useCallback((session: any): string | null => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? (session.user.id as string) || null
      : session.user.physicianId || null;
  }, []);

  const formatDateToString = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  }, []);

  const physicianId = getPhysicianId(currentSession);

  const { data: recommendationData, isFetching: searchLoading } = useGetPatientRecommendationsQuery(
    {
      patientName: searchQuery,
      claimNumber: searchQuery,
      dob: searchQuery,
      physicianId: physicianId || "",
      mode,
    },
    {
      skip: !searchQuery.trim() || !physicianId,
    }
  );

  useEffect(() => {
    if (recommendationData?.success && recommendationData?.data?.allMatchingDocuments) {
      const patients: Patient[] = recommendationData.data.allMatchingDocuments.map(
        (doc: any) => ({
          id: doc.id,
          patientName: doc.patientName,
          dob: formatDateToString(doc.dob),
          doi: formatDateToString(doc.doi),
          claimNumber: doc.claimNumber || "Not specified",
        })
      );
      setSearchResults(patients);
    } else if (searchQuery.trim() === "") {
      setSearchResults([]);
    }
  }, [recommendationData, searchQuery, formatDateToString]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, session: any) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentSession(session);
  }, []);

  return { searchQuery, searchResults, searchLoading, handleSearchChange, getPhysicianId };
};