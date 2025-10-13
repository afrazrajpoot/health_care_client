// app/dashboard/components/FailedDocuments.tsx
import { useState } from "react";

interface FailedDocument {
  id: string;
  patientName: string;
  claimNumber: string;
  fileName: string;
  createdAt: string;
  dob?: string;
  doi?: string;
}

interface FailedDocumentsProps {
  documents: FailedDocument[];
  onRowClick: (doc: FailedDocument) => void;
}

export default function FailedDocuments({
  documents,
  onRowClick,
}: FailedDocumentsProps) {
  return (
    <div className="card">
      <h2>❌ Failed & Unspecified Documents</h2>
      {documents.length === 0 ? (
        <p>No failed or unspecified documents found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Claim Number</th>
              <th>File Name</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr
                key={doc.id || index}
                className="failed-row"
                onClick={() => onRowClick(doc)}
              >
                <td>{doc.id}</td>
                <td>{doc.patientName || "Unspecified"}</td>
                <td>{doc.claimNumber || "UNSPECIFIED"}</td>
                <td>{doc.fileName}</td>
                <td>
                  {doc.createdAt
                    ? new Date(doc.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
