// components/dashboard/FailedDocumentsSection.tsx
import FailedDocuments from "@/components/staff-components/FailedDocuments";

interface FailedDocumentsSectionProps {
  documents: any[];
  onRowClick: (doc: any) => void;
}

export default function FailedDocumentsSection({
  documents,
  onRowClick,
}: FailedDocumentsSectionProps) {
  return <FailedDocuments documents={documents} onRowClick={onRowClick} />;
}
