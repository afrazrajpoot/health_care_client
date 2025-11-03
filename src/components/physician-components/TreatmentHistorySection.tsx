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
  referralDoctor?: string; // Fixed potential misspelling
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

const TimelineIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1.73 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <path d="M3.27 6.96L12 12.01l8.73-5.05"></path>
    <path d="M12 22.08V12"></path>
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

  // State for timeline visibility per body part
  const [showTimeline, setShowTimeline] = React.useState<{
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

  const toggleTimeline = (bodyPartId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowTimeline((prev) => ({
      ...prev,
      [bodyPartId]: !prev[bodyPartId],
    }));
  };

  // Helper to parse and sort snapshots by report_date (descending for latest first)
  const sortSnapshotsByDate = (
    snapshots: BodyPartSnapshot[]
  ): BodyPartSnapshot[] => {
    return [...snapshots].sort((a, b) => {
      const dateA = a.document_report_date
        ? new Date(a.document_report_date).getTime()
        : 0;
      const dateB = b.document_report_date
        ? new Date(b.document_report_date).getTime()
        : 0;
      return dateB - dateA; // Descending
    });
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
            {Object.entries(groupedBodyParts).map(([bodyPart, snapshots]) => {
              const sortedSnapshots = sortSnapshotsByDate(snapshots);
              const latestSnapshot = sortedSnapshots[0];
              const hasMultiple = sortedSnapshots.length > 1;

              return (
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
                      {/* Latest Snapshot Card */}
                      {latestSnapshot && (
                        <div className="snapshot-card latest">
                          <div className="snapshot-meta">
                            <span className="snapshot-date">
                              Latest:{" "}
                              {formatDate(latestSnapshot.document_report_date)}
                            </span>
                          </div>
                          <div className="snapshot-content">
                            <ul>
                              {latestSnapshot.dx &&
                                latestSnapshot.dx !== "Not specified" &&
                                latestSnapshot.dx !== "" && (
                                  <li>
                                    <strong>Diagnosis:</strong>{" "}
                                    {latestSnapshot.dx}
                                  </li>
                                )}
                              {latestSnapshot.recommended &&
                                latestSnapshot.recommended !==
                                "Not specified" &&
                                latestSnapshot.recommended !== "" && (
                                  <li>
                                    <strong>Treatment Plan:</strong>{" "}
                                    {latestSnapshot.recommended}
                                  </li>
                                )}
                              {latestSnapshot.consultingDoctor &&
                                latestSnapshot.consultingDoctor !==
                                "Not specified" &&
                                latestSnapshot.consultingDoctor !== "" && (
                                  <li>
                                    <strong>Consulting Doctor:</strong>{" "}
                                    {latestSnapshot.consultingDoctor}
                                  </li>
                                )}
                              {latestSnapshot.referralDoctor &&
                                latestSnapshot.referralDoctor !==
                                "Not specified" &&
                                latestSnapshot.referralDoctor !== "" && (
                                  <li>
                                    <strong>Referral Doctor:</strong>{" "}
                                    {latestSnapshot.referralDoctor}
                                  </li>
                                )}
                              {latestSnapshot.urDecision &&
                                latestSnapshot.urDecision !== "Not specified" &&
                                latestSnapshot.urDecision !== "" && (
                                  <li>
                                    <strong>UR Decision:</strong>{" "}
                                    {latestSnapshot.urDecision}
                                  </li>
                                )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Timeline Dropdown/Button - Only show if multiple snapshots */}
                      {hasMultiple && (
                        <div className="timeline-toggle">
                          <button
                            className="timeline-btn"
                            onClick={(e) => toggleTimeline(bodyPart, e)}
                          >
                            <TimelineIcon />
                            {showTimeline[bodyPart] ? "Hide" : "View"} Timeline
                          </button>
                        </div>
                      )}

                      {/* Timeline Section */}
                      {hasMultiple && showTimeline[bodyPart] && (
                        <div className="timeline-section">
                          {/* <h5 className="timeline-title">Date-Wise Timeline</h5> */}
                          <div className="timeline">
                            {sortedSnapshots.map((snapshot, index) => (
                              <div
                                key={snapshot.id || index}
                                className="timeline-item"
                              >
                                <div className="timeline-date">
                                  {formatDate(snapshot.document_report_date)}
                                </div>
                                <div className="timeline-content">
                                  {snapshot.recommended &&
                                    snapshot.recommended !== "Not specified" &&
                                    snapshot.recommended !== "" && (
                                      <div className="timeline-entry">
                                        <strong>Treatment Plan:</strong>{" "}
                                        {snapshot.recommended}
                                      </div>
                                    )}
                                  {snapshot.consultingDoctor &&
                                    snapshot.consultingDoctor !==
                                    "Not specified" &&
                                    snapshot.consultingDoctor !== "" && (
                                      <div className="timeline-entry">
                                        <strong>Consulting Doctor:</strong>{" "}
                                        {snapshot.consultingDoctor}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

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
        .snapshot-card.latest {
          margin-bottom: 12px;
          border-left-color: #10b981;
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
        .timeline-toggle {
          margin-bottom: 12px;
        }
        .timeline-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }
        .timeline-btn:hover {
          background: #e5e7eb;
        }
        .timeline-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .timeline-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .timeline-date {
          min-width: 80px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .timeline-content {
          flex: 1;
        }
        .timeline-entry {
          margin-bottom: 4px;
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }
        .timeline-entry:last-child {
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
