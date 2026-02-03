"use client";
import React, { useState, useRef } from "react";
import { useDashboard } from "./DashboardProvider";
import WhatsNewSection from "@/components/physician-components/WhatsNewSection";
import TreatmentHistorySection from "@/components/physician-components/TreatmentHistorySection";
import PatientIntakeUpdate from "@/components/physician-components/PatientIntakeUpdate";

const DashboardContent: React.FC = () => {
  const {
    documentData,
    selectedPatient,
    collapsedSections,
    toggleSection,
    taskQuickNotes,
    setShowManualTaskModal,
  } = useDashboard();

  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [whatsNewCount, setWhatsNewCount] = useState(0);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleSectionCopy = async (
    sectionId: string,
    snapshotIndex?: number,
  ) => {
    let text = "";
    const doc = documentData;

    switch (sectionId) {
      case "section-snapshot":
        const snapshots = doc?.summary_snapshots || [];
        const currentIdx = snapshotIndex || 0;
        const currentSnap = snapshots[currentIdx];
        if (currentSnap) {
          text = `Summary Snapshot\nDx: ${
            currentSnap.dx || "Not specified"
          }\nKey Concern: ${
            currentSnap.keyConcern || "Not specified"
          }\nNext Step: ${currentSnap.nextStep || "Not specified"}`;
        }
        break;
      case "section-whatsnew":
        const latestSummary = doc?.document_summaries?.[0];
        const shortSummary =
          latestSummary?.brief_summary || "No short summary available";
        const longSummary =
          latestSummary?.summary || "No long summary available";
        text = `DOCUMENT SUMMARIES\n\n`;
        text += `📋 BRIEF SUMMARY:\n${shortSummary}\n\n`;
        text += `📄 DETAILED SUMMARY:\n${longSummary}\n\n`;
        if (latestSummary) {
          text += `📊 METADATA:\n`;
          text += `Type: ${latestSummary.type}\n`;
          text += `Date: ${formatDate(latestSummary.date)}\n`;
        }
        break;
      case "section-adl":
        text = `ADL / Work Status\nADLs Affected: ${
          doc?.adl?.adls_affected || "Not specified"
        }\nWork Restrictions: ${
          doc?.adl?.work_restrictions || "Not specified"
        }`;
        break;
      case "section-patient-quiz":
        if (doc?.patient_quiz) {
          const q = doc.patient_quiz;
          text = `Patient Quiz\nLanguage: ${q.lang}\nNew Appt: ${
            q.newAppt
          }\nPain Level: ${q.pain}/10\nWork Difficulty: ${q.workDiff}\nTrend: ${
            q.trend
          }\nWork Ability: ${q.workAbility}\nBarrier: ${
            q.barrier
          }\nADLs Affected: ${q.adl.join(", ")}\nUpcoming Appts:\n`;
          q.appts.forEach((appt: any) => {
            text += `- ${appt.date} - ${appt.type} (${appt.other})\n`;
          });
          text += `Created: ${formatDate(q.createdAt)}\nUpdated: ${formatDate(
            q.updatedAt,
          )}`;
        } else {
          text = "No patient quiz data available";
        }
        break;
      default:
        if (sectionId.startsWith("section-summary-")) {
          const index = parseInt(sectionId.split("-")[2]);
          const summary = doc?.document_summaries?.[index];
          if (summary) {
            text = `${summary.type} - ${formatDate(summary.date)}\n${
              summary.summary
            }`;
          }
        }
        break;
    }

    if (!text) return;

    await handleCopy(text, sectionId);

    if (timersRef.current[sectionId]) {
      clearTimeout(timersRef.current[sectionId]);
      delete timersRef.current[sectionId];
    }

    setCopied((prev) => ({ ...prev, [sectionId]: true }));

    timersRef.current[sectionId] = setTimeout(() => {
      setCopied((prev) => {
        const newCopied = { ...prev };
        delete newCopied[sectionId];
        return newCopied;
      });
      delete timersRef.current[sectionId];
    }, 2000);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Not specified";
      }
      return date.toLocaleDateString();
    } catch {
      return "Not specified";
    }
  };

  return (
    <>
      {/* Main Grid Layout */}
      <div className="grid">
        <div>
          {!selectedPatient && !documentData ? (
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "32px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--muted)" }}>
                Click the Recent Patients button to search and select a patient
              </p>
            </div>
          ) : (
            <>
              {/* Staff Status Section - Quick Notes */}
              {documentData && (
                <div className="panel" style={{ marginBottom: "14px" }}>
                  <div className="panel-h">
                    <div>
                      <div className="title">Staff Status</div>
                      <div className="meta">Patient-specific • Read-only</div>
                    </div>
                  </div>
                  <div className="panel-body">
                    {(() => {
                      const filteredDocNotes =
                        documentData.quick_notes_snapshots?.filter(
                          (note: any) => {
                            const hasContent =
                              (note.status_update &&
                                note.status_update.trim()) ||
                              (note.one_line_note &&
                                note.one_line_note.trim()) ||
                              (note.details && note.details.trim());
                            return hasContent;
                          },
                        ) || [];

                      // Limit document notes to 3 most recent
                      const limitedDocNotes = filteredDocNotes
                        .sort((a: any, b: any) => {
                          const timeA = new Date(a.timestamp || 0).getTime();
                          const timeB = new Date(b.timestamp || 0).getTime();
                          return timeB - timeA;
                        })
                        .slice(0, 3);

                      const hasNotes =
                        limitedDocNotes.length > 0 ||
                        (taskQuickNotes && taskQuickNotes.length > 0) ||
                        [];

                      return hasNotes ? (
                        <div className="status-wrap">
                          {/* Document Quick Notes */}
                          {limitedDocNotes.map((note: any, index: number) => {
                            // Determine status color based on status_update or content
                            const getStatusColor = () => {
                              const fullContent = `${
                                note.status_update || ""
                              } ${note.one_line_note || ""} ${
                                note.details || ""
                              }`.toLowerCase();
                              if (
                                fullContent.includes("urgent") ||
                                fullContent.includes("critical") ||
                                fullContent.includes("time-sensitive") ||
                                fullContent.includes("emergency")
                              ) {
                                return "red";
                              }
                              if (
                                fullContent.includes("schedule") ||
                                fullContent.includes("pending") ||
                                fullContent.includes("waiting") ||
                                fullContent.includes("follow-up") ||
                                fullContent.includes("follow up")
                              ) {
                                return "amber";
                              }
                              if (
                                fullContent.includes("completed") ||
                                fullContent.includes("done") ||
                                fullContent.includes("approved") ||
                                fullContent.includes("resolved")
                              ) {
                                return "green";
                              }
                              if (
                                fullContent.includes("review") ||
                                fullContent.includes("clarify") ||
                                fullContent.includes("authorization") ||
                                fullContent.includes("decision") ||
                                fullContent.includes("mri") ||
                                fullContent.includes("findings")
                              ) {
                                return "blue";
                              }
                              return "gray";
                            };

                            const statusColor = getStatusColor();
                            // Build display text: prefer status_update, then one_line_note, then details
                            let displayText = "";
                            if (note.status_update) {
                              displayText = note.status_update;
                              // Append one_line_note if available and different
                              if (
                                note.one_line_note &&
                                note.one_line_note !== note.status_update
                              ) {
                                displayText += ` — ${note.one_line_note}`;
                              }
                            } else if (note.one_line_note) {
                              displayText = note.one_line_note;
                            } else if (note.details) {
                              // Truncate details if too long
                              displayText =
                                note.details.length > 50
                                  ? note.details.substring(0, 50) + "..."
                                  : note.details;
                            } else {
                              displayText = "Quick Note";
                            }

                            return (
                              <div
                                key={`doc-note-${index}`}
                                className="s-chip small"
                                title={note.details || displayText}
                              >
                                <span className={`s-dot ${statusColor}`}></span>
                                {displayText}
                              </div>
                            );
                          })}
                          {/* Task Quick Notes */}
                          {taskQuickNotes &&
                            taskQuickNotes.map((note: any, index: number) => {
                              // Determine status color based on status_update or content
                              const getStatusColor = () => {
                                const fullContent = `${
                                  note.status_update || ""
                                } ${note.one_line_note || ""} ${
                                  note.details || ""
                                }`.toLowerCase();
                                if (
                                  fullContent.includes("urgent") ||
                                  fullContent.includes("critical") ||
                                  fullContent.includes("time-sensitive") ||
                                  fullContent.includes("emergency")
                                ) {
                                  return "red";
                                }
                                if (
                                  fullContent.includes("schedule") ||
                                  fullContent.includes("pending") ||
                                  fullContent.includes("waiting") ||
                                  fullContent.includes("follow-up") ||
                                  fullContent.includes("follow up")
                                ) {
                                  return "amber";
                                }
                                if (
                                  fullContent.includes("completed") ||
                                  fullContent.includes("done") ||
                                  fullContent.includes("approved") ||
                                  fullContent.includes("resolved")
                                ) {
                                  return "green";
                                }
                                if (
                                  fullContent.includes("review") ||
                                  fullContent.includes("clarify") ||
                                  fullContent.includes("authorization") ||
                                  fullContent.includes("decision") ||
                                  fullContent.includes("mri") ||
                                  fullContent.includes("findings")
                                ) {
                                  return "blue";
                                }
                                return "gray";
                              };

                              const statusColor = getStatusColor();
                              // Build display text: prefer status_update, then one_line_note, then details
                              let displayText = "";
                              if (note.status_update) {
                                displayText = note.status_update;
                                // Append one_line_note if available and different
                                if (
                                  note.one_line_note &&
                                  note.one_line_note !== note.status_update
                                ) {
                                  displayText += ` — ${note.one_line_note}`;
                                }
                              } else if (note.one_line_note) {
                                displayText = note.one_line_note;
                              } else if (note.details) {
                                // Truncate details if too long
                                displayText =
                                  note.details.length > 50
                                    ? note.details.substring(0, 50) + "..."
                                    : note.details;
                              } else {
                                displayText = "Quick Note";
                              }

                              return (
                                <div
                                  key={`task-note-${index}`}
                                  className="s-chip small"
                                  title={note.details || displayText}
                                >
                                  <span
                                    className={`s-dot ${statusColor}`}
                                  ></span>
                                  {displayText}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                            textAlign: "center",
                            padding: "20px",
                          }}
                        >
                          No staff status updates available
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* What's New Section */}
              {documentData && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3.5">
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-200">
                    <div>
                      <div className="font-extrabold text-gray-900">
                        What's New Since Last Visit
                        {whatsNewCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            {whatsNewCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Click to expand • Expanded content scrolls inside the
                        card
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto p-2.5">
                    <div className="mb-3">
                      <PatientIntakeUpdate documentData={documentData} />
                    </div>
                    <WhatsNewSection
                      documentData={documentData}
                      mode="wc" // This should come from context
                      copied={copied}
                      onCopySection={handleSectionCopy}
                      isCollapsed={collapsedSections.whatsNew}
                      onToggle={() => toggleSection("whatsNew")}
                      onCountChange={setWhatsNewCount}
                    />
                  </div>
                </div>
              )}

              {/* Treatment History Section */}
              {documentData && (
                <div className="panel" style={{ marginBottom: "14px" }}>
                  <div className="panel-h">
                    <div>
                      <div className="title">Treatment History</div>
                      <div className="meta">Summary snapshots and history</div>
                    </div>
                  </div>
                  <div className="panel-body">
                    <TreatmentHistorySection documentData={documentData} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating New Order Button */}
      <div
        className="floating-new-order"
        onClick={() => setShowManualTaskModal(true)}
      >
        + New Order
      </div>
    </>
  );
};

export default DashboardContent;
