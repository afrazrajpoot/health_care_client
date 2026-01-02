import { useState, useCallback } from "react";

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
  const [searchLoading, setSearchLoading] = useState(false);

  const getPhysicianId = useCallback((session: any): string | null => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? (session.user.id as string) || null
      : session.user.physicianId || null;
  }, []);

  const fetchSearchResults = useCallback(
    async (query: string, session: any) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const currentPhysicianId = getPhysicianId(session);
      try {
        setSearchLoading(true);
        const response = await fetch(
          `/api/dashboard/recommendation?patientName=${encodeURIComponent(
            query
          )}&claimNumber=${encodeURIComponent(query)}&dob=${encodeURIComponent(
            query
          )}&physicianId=${encodeURIComponent(
            currentPhysicianId || ""
          )}&mode=${encodeURIComponent(mode)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }
        const data: any = await response.json();
        if (data.success && data.data.allMatchingDocuments) {
          const patients: Patient[] = data.data.allMatchingDocuments.map(
            (doc: any) => ({
              id: doc.id,
              patientName: doc.patientName,
              dob: formatDateToString(doc.dob),
              doi: formatDateToString(doc.doi),
              claimNumber: doc.claimNumber || "Not specified",
            })
          );
          setSearchResults(patients);
        } else {
          setSearchResults([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching search results:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [mode, getPhysicianId]
  );

  const formatDateToString = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string, session: any) => {
      fetchSearchResults(query, session);
    }, 300),
    [fetchSearchResults, debounce]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, session: any) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      debouncedSearch(query, session);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  return { searchQuery, searchResults, searchLoading, handleSearchChange, getPhysicianId };
};