// hooks/useFailedDocuments.ts
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useGetFailedDocumentsQuery } from "@/redux/staffApi";
import { useUpdateFailedDocumentMutation } from "@/redux/pythonApi";

export const useFailedDocuments = () => {
  const { data: failedDocsData, refetch: fetchFailedDocuments } =
    useGetFailedDocumentsQuery(undefined);
  const [updateFailedDocumentMutation] = useUpdateFailedDocumentMutation();

  const failedDocuments = failedDocsData?.documents || [];
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState({
    patientName: "",
    claimNumber: "",
    dob: null as Date | string | null,
    doi: "",
    author: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const { data: session } = useSession();

  const removeFailedDocument = useCallback((docId: string) => {
    // Note: In a real app, you'd probably have a delete mutation
    // toast.success("Document deleted successfully", {
    //   duration: 3000,
    //   position: "top-right",
    // });
  }, []);

  const handleRowClick = useCallback((doc: any) => {
    setSelectedDoc(doc);
    let parsedDob: Date | string | null = null;
    if (doc.dob) {
      if (
        typeof doc.dob === "string" &&
        doc.dob.toLowerCase() !== "not specified"
      ) {
        // Keep as string for the modal to handle parsing
        parsedDob = doc.dob;
      } else if (doc.dob instanceof Date) {
        parsedDob = doc.dob;
      }
    }
    setUpdateFormData({
      patientName: doc.patientName || "",
      claimNumber: String(doc.claimNumber || ""),
      dob: parsedDob,
      doi: doc.doi || "",
      author: doc.author || "",
    });
    setIsUpdateModalOpen(true);
  }, []);

  const handleUpdateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === "dob") {
        // Handle both Date objects and string values
        let dobValue: Date | null = null;
        if ((value as any) instanceof Date) {
          dobValue = value as any;
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
    [updateFormData],
  );

  const handleUpdateSubmit = useCallback(async () => {
    if (!selectedDoc) return;

    setUpdateLoading(true);

    try {
      const updateData: any = {
        patient_name: updateFormData.patientName,
        claim_number: updateFormData.claimNumber,
        doi: updateFormData.doi,
        author: updateFormData.author,
      };

      // Handle DOB - can be Date object or string
      if (updateFormData.dob) {
        if (typeof updateFormData.dob === "string") {
          updateData.dob = updateFormData.dob;
        } else if (
          updateFormData.dob instanceof Date &&
          !isNaN(updateFormData.dob.getTime())
        ) {
          updateData.dob = updateFormData.dob.toISOString().split("T")[0];
        }
      } else {
        updateData.dob = null;
      }

      await updateFailedDocumentMutation({
        fail_doc_id: selectedDoc.id,
        document_text: selectedDoc.documentText,
        ...updateData,
        user_id: session?.user?.id,
      }).unwrap();

      toast.success("✅ Document updated successfully", {
        duration: 5000,
        position: "top-right",
      });
      setIsUpdateModalOpen(false);
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
    updateFailedDocumentMutation,
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
