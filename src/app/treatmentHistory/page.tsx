"use client";
import React, { useState } from "react";

const PatientHistory = () => {
  const [expandedSystems, setExpandedSystems] = useState({});
  const [expandedArchives, setExpandedArchives] = useState({});
  const [expandedEntries, setExpandedEntries] = useState({});

  const toggleSystem = (systemId) => {
    setExpandedSystems((prev) => ({
      ...prev,
      [systemId]: !prev[systemId],
    }));
  };

  const toggleArchive = (archiveId, e) => {
    e.stopPropagation();
    setExpandedArchives((prev) => ({
      ...prev,
      [archiveId]: !prev[archiveId],
    }));
  };

  const toggleEntry = (entryId, e) => {
    e.stopPropagation();
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const bodySystems = [
    {
      id: "musculoskeletal",
      title: "🦴 Musculoskeletal System",
      color: "orange",
      entries: [
        {
          id: "ms1",
          date: "02/2025",
          title: "Physical Therapy (6 sessions)",
          detail:
            "Provider: Apex PT. Indication: knee pain/weakness. Outcome: strength +60%, pain improved, better tolerance for stairs. Plan: transition to home exercise program (HEP) and reassess if symptoms recur.",
        },
        {
          id: "ms2",
          date: "01/2025",
          title: "Orthopedics consult",
          detail:
            "Author: Dr. Smith (Orthopedics). Impression: suspected medial meniscus tear with early OA. Recommendations: continue conservative care; order MRI if persistent mechanical symptoms; consider injection if inadequate response.",
        },
      ],
      archivedEntries: [
        {
          id: "msa1",
          date: "2023",
          title: "Knee osteoarthritis diagnosed (archive)",
          detail:
            "Treatment: NSAID trial and activity modification. Result: partial symptom relief; ongoing episodic flare-ups noted.",
        },
        {
          id: "msa2",
          date: "2022",
          title: "Prior PT course (archive)",
          detail:
            "Brief PT course with mild improvement reported; patient transitioned to self-directed exercises.",
        },
      ],
    },
    {
      id: "cardiovascular",
      title: "❤️ Cardiovascular System",
      color: "blue",
      entries: [
        {
          id: "cv1",
          date: "11/2024",
          title: "Medication change: Amlodipine 5 → 10 mg",
          detail:
            "Reason: persistent elevated BP on prior dose. Response: improved home BP readings; no edema reported in note. Follow-up: monitor BP log and side effects.",
        },
        {
          id: "cv2",
          date: "06/2024",
          title: "Medication trial: Losartan 25 mg",
          detail:
            "Started as add-on for BP control. Stopped after dizziness/lightheadedness. Plan: avoid ARB for now; continue current regimen and reassess alternatives if BP worsens.",
        },
      ],
      archivedEntries: [
        {
          id: "cva1",
          date: "2021–2023",
          title: "BP stable on monotherapy (archive)",
          detail:
            "Notes indicate generally stable BP control on single agent; no documented complications in that period.",
        },
      ],
    },
    {
      id: "pulmonary",
      title: "🫁 Pulmonary / Respiratory",
      color: "green",
      entries: [
        {
          id: "pu1",
          date: "09/2024",
          title: "Pulmonary Function Tests",
          detail:
            "Result: normal spirometry; note suggests mild reactive airway features. Recommendation: PRN bronchodilator trial if symptomatic; follow up if persistent cough/wheeze.",
        },
      ],
      archivedEntries: [
        {
          id: "pua1",
          date: "2022",
          title: "Bronchitis episode (archive)",
          detail:
            "Acute bronchitis treated conservatively; resolved without chronic sequelae per record.",
        },
      ],
    },
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      orange: "bg-orange-50 hover:bg-orange-100",
      green: "bg-emerald-50 hover:bg-emerald-100",
      blue: "bg-blue-50 hover:bg-blue-100",
      purple: "bg-purple-50 hover:bg-purple-100",
      teal: "bg-teal-50 hover:bg-teal-100",
      yellow: "bg-yellow-50 hover:bg-yellow-100",
    };
    return colorMap[color] || "bg-gray-50 hover:bg-gray-100";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Patient Medical History
          </h1>
          <p className="text-gray-600 mt-1">
            Organized by body systems with timeline entries
          </p>
        </div>

        <div className="space-y-4">
          {bodySystems.map((system) => (
            <div
              key={system.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div
                className={`p-4 cursor-pointer transition-colors ${getColorClasses(
                  system.color
                )} flex justify-between items-center`}
                onClick={() => toggleSystem(system.id)}
              >
                <span className="font-semibold text-gray-800">
                  {system.title}
                </span>
                <span className="text-gray-500 font-bold">
                  {expandedSystems[system.id] ? "▾" : "▸"}
                </span>
              </div>

              {expandedSystems[system.id] && (
                <div className="p-4 pt-2 border-t border-gray-100">
                  <div className="space-y-3">
                    {system.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={(e) => toggleEntry(entry.id, e)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-sm text-gray-900">
                            <span className="text-gray-600 mr-2">
                              {entry.date}
                            </span>
                            {entry.title}
                          </div>
                          <span className="text-gray-400 font-bold text-sm">
                            {expandedEntries[entry.id] ? "▾" : "▸"}
                          </span>
                        </div>
                        {expandedEntries[entry.id] && (
                          <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                            {entry.detail}
                          </div>
                        )}
                      </div>
                    ))}

                    {system.archivedEntries.length > 0 && (
                      <>
                        <div
                          className="bg-gray-100 rounded-lg p-3 cursor-pointer hover:bg-gray-200 transition-colors flex justify-between items-center"
                          onClick={(e) => toggleArchive(system.id, e)}
                        >
                          <div className="flex items-center text-gray-700">
                            <span className="mr-2">📁</span>
                            <span className="text-sm font-medium">
                              Archive — Older Medical History
                            </span>
                          </div>
                          <span className="text-gray-500 font-bold text-sm">
                            {expandedArchives[system.id] ? "▾" : "▸"}
                          </span>
                        </div>

                        {expandedArchives[system.id] && (
                          <div className="space-y-3 ml-4 border-l-2 border-gray-300 pl-4">
                            {system.archivedEntries.map((archived) => (
                              <div
                                key={archived.id}
                                className="bg-gray-50 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={(e) => toggleEntry(archived.id, e)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="font-medium text-sm text-gray-900">
                                    <span className="text-gray-600 mr-2">
                                      {archived.date}
                                    </span>
                                    {archived.title}
                                  </div>
                                  <span className="text-gray-400 font-bold text-sm">
                                    {expandedEntries[archived.id] ? "▾" : "▸"}
                                  </span>
                                </div>
                                {expandedEntries[archived.id] && (
                                  <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                                    {archived.detail}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Click on any body system to expand and view timeline entries</p>
        </div>
      </div>
    </div>
  );
};

export default PatientHistory;
