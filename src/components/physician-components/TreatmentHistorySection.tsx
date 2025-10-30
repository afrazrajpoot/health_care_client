// components/physician-components/TreatmentHistorySection.tsx
import { useTreatmentHistory } from "@/app/custom-hooks/staff-hooks/physician-hooks/useTreatmentHistory";
import React from "react";

// Define TypeScript interfaces for body part snapshots
interface BodyPartSnapshot {
  id: string;
  bodyPart: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  urDecision?: string;
  recommended?: string;
  aiOutcome?: string;
  consultingDoctor?: string;
  document_id?: string;
  document_created_at?: string;
  document_report_date?: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  body_part_snapshots?: BodyPartSnapshot[];
  whats_new?: { [key: string]: string };
  quick_notes_snapshots?: {
    details: string;
    timestamp: string;
    one_line_note: string;
    status_update: string;
  }[];
  adl?: {
    adls_affected: string;
    adls_affected_history: string;
    work_restrictions: string;
    work_restrictions_history: string;
    has_changes: boolean;
  };
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: {
    type: string;
    date: string;
    summary: string;
    brief_summary?: string;
    document_id?: string;
  }[];
  patient_quiz?: {
    id: string;
    patientName: string;
    dob: string;
    doi: string;
    lang: string;
    newAppt: string;
    appts: Array<{
      date: string;
      type: string;
      other: string;
    }>;
    pain: number;
    workDiff: string;
    trend: string;
    workAbility: string;
    barrier: string;
    adl: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: {
    [key: string]: {
      type: string;
      date: string;
      summary: string;
      brief_summary?: string;
      document_id?: string;
    };
  };
  allVerified?: boolean;
  gcs_file_link?: string;
  blob_path?: string;
}

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const MedicalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 transition-transform"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 transition-transform"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

interface TreatmentHistorySectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string, index?: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const TreatmentHistorySection: React.FC<TreatmentHistorySectionProps> = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}) => {
  console.log("Document data:", documentData);

  // ✅ Get body part snapshots directly from documentData
  const bodyPartSnapshots = documentData?.body_part_snapshots || [];
  console.log("Body part snapshots:", bodyPartSnapshots);

  // State for expanded/collapsed body parts
  const [expandedBodyParts, setExpandedBodyParts] = React.useState<{
    [key: string]: boolean;
  }>({});

  // Handle section header click (only for collapse/expand)
  const handleSectionHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleCopyClick = (e: React.MouseEvent, bodyPartId?: string) => {
    e.stopPropagation();
    const sectionId = bodyPartId
      ? `section-bodypart-${bodyPartId}`
      : "section-treatment";
    onCopySection(sectionId);
  };

  const toggleBodyPart = (bodyPartId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedBodyParts((prev) => ({
      ...prev,
      [bodyPartId]: !prev[bodyPartId],
    }));
  };

  // Group body part snapshots by body part name for better organization
  const groupedBodyParts = bodyPartSnapshots.reduce((acc, snapshot) => {
    const bodyPart = snapshot.bodyPart || "Unknown Body Part";
    if (!acc[bodyPart]) {
      acc[bodyPart] = [];
    }
    acc[bodyPart].push(snapshot);
    return acc;
  }, {} as Record<string, BodyPartSnapshot[]>);

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="section">
        {/* Section Header - Only this part should be clickable for collapse/expand */}
        <div className="section-header" onClick={handleSectionHeaderClick}>
          <div className="section-title">
            <MedicalIcon />
            <h3>Treatment History by Body Part</h3>
          </div>
          <div className="header-actions">
            <button
              className={`copy-btn ${copied["section-treatment"] ? "copied" : ""
                }`}
              onClick={(e) => handleCopyClick(e)}
              title="Copy All Body Parts"
            >
              {copied["section-treatment"] ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button
              className="collapse-btn"
              onClick={handleSectionHeaderClick}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            </button>
          </div>
        </div>

        {/* Section Content - This part should NOT trigger collapse/expand */}
        {!isCollapsed && (
          <div className="section-content" onClick={(e) => e.stopPropagation()}>
            {/* Body Part Snapshots */}
            {Object.entries(groupedBodyParts).map(([bodyPart, snapshots]) => (
              <div key={bodyPart} className="bodypart-group">
                {/* Body Part Header - Clickable for expanding/collapsing that specific body part */}
                <div
                  className="bodypart-header"
                  onClick={(e) => toggleBodyPart(bodyPart, e)}
                >
                  <button
                    className="bodypart-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBodyPart(bodyPart);
                    }}
                  >
                    {expandedBodyParts[bodyPart] ? (
                      <ChevronDownIcon />
                    ) : (
                      <ChevronRightIcon />
                    )}
                  </button>
                  <h4 className="bodypart-name">{bodyPart}</h4>
                  <button
                    className={`copy-btn small ${copied[`section-bodypart-${bodyPart}`] ? "copied" : ""
                      }`}
                    onClick={(e) => handleCopyClick(e, bodyPart)}
                    title={`Copy ${bodyPart} Details`}
                  >
                    {copied[`section-bodypart-${bodyPart}`] ? (
                      <CheckIcon />
                    ) : (
                      <CopyIcon />
                    )}
                  </button>
                </div>

                {/* Body Part Details - This part should NOT trigger any toggles */}
                {expandedBodyParts[bodyPart] && (
                  <div
                    className="bodypart-details"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {snapshots.map((snapshot, index) => (
                      <div key={snapshot.id || index} className="snapshot-card">
                        <div className="snapshot-meta">
                          {snapshot.document_created_at && (
                            <span className="snapshot-date">
                              {formatDate(snapshot.document_created_at)}
                            </span>
                          )}
                        </div>
                        <div className="snapshot-content">
                          <ul>
                            {snapshot.dx &&
                              snapshot.dx !== "Not specified" &&
                              snapshot.dx !== "" && (
                                <li>
                                  <strong>Diagnosis:</strong> {snapshot.dx}
                                </li>
                              )}
                            {snapshot.recommended &&
                              snapshot.recommended !== "Not specified" &&
                              snapshot.recommended !== "" && (
                                <li>
                                  <strong>Treatment Plan:</strong>{" "}
                                  {snapshot.treatmentPlane}
                                </li>
                              )}
                            {/* {snapshot.aiOutcome &&
                              snapshot.aiOutcome !== "Not specified" &&
                              snapshot.aiOutcome !== "" && (
                                <li>
                                  <strong>Outcome:</strong> {snapshot.aiOutcome}
                                </li>
                              )} */}
                            {snapshot.consultingDoctor &&
                              snapshot.consultingDoctor !== "Not specified" &&
                              snapshot.consultingDoctor !== "" && (
                                <li>
                                  <strong>Consulting Doctor:</strong>{" "}
                                  {snapshot.consultingDoctor}
                                </li>
                              )}
                            {snapshot.refrelDoctor &&
                              snapshot.refrelDoctor !== "Not specified" &&
                              snapshot.refrelDoctor !== "" && (
                                <li>
                                  <strong>Refrral Doctor:</strong>{" "}
                                  {snapshot.refrelDoctor}
                                </li>
                              )}
                            {snapshot.urDecision &&
                              snapshot.urDecision !== "Not specified" &&
                              snapshot.urDecision !== "" && (
                                <li>
                                  <strong>UR Decision:</strong>{" "}
                                  {snapshot.urDecision}
                                </li>
                              )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {bodyPartSnapshots.length === 0 && (
              <div className="no-data">
                <ul>
                  <li>No body part treatment history available</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .section {
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }
        .section-header {
          padding: 20px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .section-header:hover {
          background-color: #f8fafc;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        h3 {
          font-weight: 600;
          color: #1e3a8a;
          margin: 0;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .section-content {
          padding: 0 20px 20px 20px;
          background: white;
        }
        .summary-stats {
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #f1f5f9;
          border-radius: 6px;
        }
        .stat-text {
          font-size: 12px;
          color: #475569;
          font-weight: 500;
        }
        .bodypart-group {
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .bodypart-header {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .bodypart-header:hover {
          background: #f1f5f9;
        }
        .bodypart-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: color 0.2s;
        }
        .bodypart-toggle-btn:hover {
          color: #374151;
        }
        .bodypart-name {
          font-size: 14px;
          margin: 0;
          font-weight: 600;
          color: #374151;
          flex: 1;
        }
        .bodypart-details {
          background: white;
          padding: 12px;
        }
        .snapshot-card {
          background: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          border-left: 3px solid #3b82f6;
        }
        .snapshot-card:last-child {
          margin-bottom: 0;
        }
        .snapshot-meta {
          margin-bottom: 8px;
        }
        .snapshot-date {
          font-size: 11px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .snapshot-content ul {
          margin: 0;
          padding-left: 0;
        }
        .snapshot-content li {
          margin-bottom: 4px;
          font-size: 13px;
          line-height: 1.4;
          color: #374151;
          list-style: none;
          padding-left: 0;
        }
        .snapshot-content li:last-child {
          margin-bottom: 0;
        }
        .no-data {
          padding: 16px;
          background: #f1f5f9;
          border-radius: 6px;
          text-align: center;
        }
        .no-data ul {
          margin: 0;
          padding: 0;
        }
        .no-data li {
          color: #6b7280;
          list-style: none;
          font-size: 14px;
        }
        .copy-btn {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .copy-btn.small {
          padding: 4px 6px;
        }
        .copy-btn:hover {
          background: #cbd5e1;
        }
        .copied {
          background: #dcfce7;
          color: #166534;
        }
        .copied:hover {
          background: #bbf7d0;
        }
        .collapse-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
          color: #6b7280;
        }
        .collapse-btn:hover {
          background-color: #e5e7eb;
          color: #374151;
        }
        .w-3.5 {
          width: 0.875rem;
          height: 0.875rem;
        }
        .w-4 {
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </>
  );
};

export default TreatmentHistorySection;
