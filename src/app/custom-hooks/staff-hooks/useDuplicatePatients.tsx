// hooks/useDuplicatePatients.tsx
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface DuplicateDocument {
    id: string;
    patientName: string | null;
    dob: Date | string | null;
    doi?: Date | string | null;
    claimNumber: string | null;
    createdAt: Date;
    fileName: string;
    gcsFileLink?: string | null;
    blobPath?: string | null;
    groupName: string;
}

export const useDuplicatePatients = () => {
    const [duplicateDocuments, setDuplicateDocuments] = useState<DuplicateDocument[]>([]);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<DuplicateDocument | null>(null);
    const [updateFormData, setUpdateFormData] = useState({
        patientName: "",
        dob: "",
        doi: "",
        claimNumber: "",
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const { data: session } = useSession();

    const fetchDuplicateDocuments = useCallback(async (mode?: string, patientName?: string) => {
        try {
            const params = new URLSearchParams();
            if (mode) params.append("mode", mode);
            if (patientName) params.append("patientName", patientName);

            const url = params.toString()
                ? `/api/get-duplicate-patients?${params.toString()}`
                : `/api/get-duplicate-patients?${params.toString()}`;

            const response = await fetch(url);
            const data = await response.json();
            setDuplicateDocuments(data);
        } catch (error) {
            console.error("Error fetching duplicate documents:", error);
        }
    }, []);

    const formatDateForInput = (date: Date | string | null | undefined) => {
        if (!date) return "";
        try {
            const d = new Date(date);
            return d.toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    const handleRowClick = useCallback((doc: DuplicateDocument) => {
        setSelectedDoc(doc);
        setUpdateFormData({
            patientName: doc.patientName || "",
            dob: formatDateForInput(doc.dob),
            doi: formatDateForInput(doc.doi),
            claimNumber: doc.claimNumber || "",
        });
        setIsUpdateModalOpen(true);
    }, []);

    const handleUpdateInputChange = useCallback((field: string, value: string) => {
        setUpdateFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const handleUpdateSubmit = useCallback(async () => {
        if (!selectedDoc || !session?.user) return;

        if (!updateFormData.patientName.trim()) {
            toast.error("Patient name is required");
            return;
        }

        if (!updateFormData.claimNumber.trim()) {
            toast.error("Claim number is required");
            return;
        }

        setUpdateLoading(true);

        try {
            const updateData: any = {
                patientName: updateFormData.patientName.trim(),
                claimNumber: updateFormData.claimNumber.trim(),
            };

            if (updateFormData.dob) {
                updateData.dob = new Date(updateFormData.dob).toISOString();
            }

            if (updateFormData.doi) {
                updateData.doi = new Date(updateFormData.doi).toISOString();
            }

            const response = await fetch(
                `/api/update-document?documentId=${selectedDoc.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Update failed");
            }

            toast.success("Document updated successfully");
            setIsUpdateModalOpen(false);
            setSelectedDoc(null);

            // Refresh the list
            await fetchDuplicateDocuments();
        } catch (error: any) {
            console.error("Error updating document:", error);
            toast.error(error.message || "Failed to update document");
        } finally {
            setUpdateLoading(false);
        }
    }, [selectedDoc, updateFormData, session, fetchDuplicateDocuments]);

    return {
        duplicateDocuments,
        isUpdateModalOpen,
        selectedDoc,
        updateFormData,
        updateLoading,
        fetchDuplicateDocuments,
        handleRowClick,
        handleUpdateInputChange,
        handleUpdateSubmit,
        setIsUpdateModalOpen,
    };
};
