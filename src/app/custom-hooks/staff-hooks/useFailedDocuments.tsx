// hooks/useFailedDocuments.ts
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export const useFailedDocuments = () => {
  const [failedDocuments, setFailedDocuments] = useState<any[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState({
    patientName: "",
    claimNumber: "",
    dob: null as Date | null,
    doi: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const { data: session } = useSession();

  const fetchFailedDocuments = useCallback(async () => {
    try {
      const response = await fetch("/api/get-failed-document");
      if (response.ok) {
        const data = await response.json();
        setFailedDocuments(data.documents || []);
      }
    } catch (error) {
      toast.error("Failed to fetch documents, please try again", {
        duration: 5000,
        position: "top-right",
      });
    }
  }, []);

  const removeFailedDocument = useCallback((docId: string) => {
    setFailedDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    toast.success("Document deleted successfully", {
      duration: 3000,
      position: "top-right",
    });
  }, []);

  const handleRowClick = useCallback((doc: any) => {
    setSelectedDoc(doc);
    let parsedDob: Date | null = null;
    if (
      doc.db &&
      typeof doc.db === "string" &&
      doc.db.toLowerCase() !== "not specified"
    ) {
      const date = new Date(doc.db);
      if (!isNaN(date.getTime())) {
        parsedDob = date;
      }
    }
    setUpdateFormData({
      patientName: doc.patientName || "",
      claimNumber: doc.claimNumber || "",
      dob: parsedDob,
      doi: doc.doi || "",
    });
    setIsUpdateModalOpen(true);
  }, []);

  const handleUpdateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === "dob") {
        // Handle both Date objects and string values
        let dobValue: Date | null = null;
        if (value instanceof Date) {
          dobValue = value;
        } else if (typeof value === "string" && value) {
          dobValue = new Date(value);
        }
        setUpdateFormData({
          ...updateFormData,
          dob: dobValue,
        });
      } else {
        setUpdateFormData({ ...updateFormData, [name]: value });
      }
    },
    [updateFormData]
  );

  const handleUpdateSubmit = useCallback(async () => {
    if (!selectedDoc) return;

    setUpdateLoading(true);

    try {
      const updateData: any = {
        patient_name: updateFormData.patientName,
        claim_number: updateFormData.claimNumber,
        doi: updateFormData.doi,
      };
      if (updateFormData.dob && !isNaN(updateFormData.dob.getTime())) {
        updateData.dob = updateFormData.dob.toISOString().split("T")[0];
      } else {
        updateData.dob = null;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/documents/update-fail-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
          body: JSON.stringify({
            fail_doc_id: selectedDoc.id,
            document_text: selectedDoc.documentText,
            ...updateData,
            user_id: session?.user?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      toast.success("✅ Document updated successfully", {
        duration: 5000,
        position: "top-right",
      });
      setIsUpdateModalOpen(false);
      fetchFailedDocuments();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("❌ Error updating document", {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setUpdateLoading(false);
    }
  }, [
    selectedDoc,
    updateFormData,
    session?.user?.id,
    session?.user?.fastapi_token,
    fetchFailedDocuments,
  ]);

  return {
    failedDocuments,
    isUpdateModalOpen,
    selectedDoc,
    updateFormData,
    updateLoading,
    fetchFailedDocuments,
    removeFailedDocument,
    handleRowClick,
    handleUpdateInputChange,
    handleUpdateSubmit,
    setIsUpdateModalOpen,
    setUpdateFormData,
  };
};
