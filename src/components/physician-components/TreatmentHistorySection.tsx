import React, { useState } from "react";

const TreatmentHistory = ({ documentData }) => {
  const [expandedSystems, setExpandedSystems] = useState({});
  const [expandedTimelineEntries, setExpandedTimelineEntries] = useState({});
  const [expandedArchives, setExpandedArchives] = useState({});

  // Toggle body system expansion
  const toggleSystem = (systemId) => {
    setExpandedSystems((prev) => ({
      ...prev,
      [systemId]: !prev[systemId],
    }));
  };

  // Toggle timeline entry expansion
  const toggleTimelineEntry = (systemId, entryId) => {
    const key = `${systemId}-${entryId}`;
    setExpandedTimelineEntries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle archive expansion
  const toggleArchive = (systemId) => {
    setExpandedArchives((prev) => ({
      ...prev,
      [systemId]: !prev[systemId],
    }));
  };

  // Color mapping for systems
  const systemColors = {
    orange: "bg-orange-50",
    green: "bg-green-50",
    blue: "bg-blue-50",
    purple: "bg-purple-50",
    teal: "bg-teal-50",
    yellow: "bg-yellow-50",
    indigo: "bg-indigo-50",
    gray: "bg-gray-50",
    red: "bg-red-50",
    pink: "bg-pink-50",
  };

  // Map your system keys to the UI format
  const systemConfig = {
    musculoskeletal_system: {
      name: "🦴 Musculoskeletal System",
      color: "orange",
      id: "musculoskeletal_system",
    },
    cardiovascular_system: {
      name: "❤️ Cardiovascular System",
      color: "blue",
      id: "cardiovascular_system",
    },
    pulmonary_respiratory: {
      name: "🫁 Pulmonary / Respiratory",
      color: "green",
      id: "pulmonary_respiratory",
    },
    neurological: {
      name: "🧠 Neurological",
      color: "purple",
      id: "neurological",
    },
    gastrointestinal: {
      name: "🧬 Gastrointestinal",
      color: "teal",
      id: "gastrointestinal",
    },
    metabolic_endocrine: {
      name: "⚖️ Metabolic / Endocrine",
      color: "yellow",
      id: "metabolic_endocrine",
    },
    general_treatments: {
      name: "💊 General Treatments",
      color: "indigo",
      id: "general_treatments",
    },
    other_systems: {
      name: "📋 Other Systems",
      color: "gray",
      id: "other_systems",
    },
    psychiatric_mental_health: {
      name: "🧠 Psychiatric / Mental Health",
      color: "purple",
      id: "psychiatric_mental_health",
    },
    dental_oral: {
      name: "🦷 Dental / Oral",
      color: "blue",
      id: "dental_oral",
    },
    dermatological: {
      name: "🩹 Dermatological",
      color: "orange",
      id: "dermatological",
    },
    ent_head_neck: {
      name: "👂 ENT / Head & Neck",
      color: "teal",
      id: "ent_head_neck",
    },
    genitourinary_renal: {
      name: "🫘 Genitourinary / Renal",
      color: "yellow",
      id: "genitourinary_renal",
    },
    hematologic_lymphatic: {
      name: "🩸 Hematologic / Lymphatic",
      color: "red",
      id: "hematologic_lymphatic",
    },
    immune_allergy: {
      name: "🛡️ Immune / Allergy",
      color: "green",
      id: "immune_allergy",
    },
    ophthalmologic: {
      name: "👁️ Ophthalmologic",
      color: "blue",
      id: "ophthalmologic",
    },
    reproductive_obstetric_gynecologic: {
      name: "🩺 Reproductive / OB-GYN",
      color: "pink",
      id: "reproductive_obstetric_gynecologic",
    },
    sleep_disorders: {
      name: "😴 Sleep Disorders",
      color: "indigo",
      id: "sleep_disorders",
    },
  };

  // Transform your dynamic data into the format the UI expects
  const transformData = () => {
    const treatmentHistory = documentData?.treatment_history || {};
    const systems = [];

    // Process each system from your data
    Object.entries(treatmentHistory).forEach(([systemKey, systemData]) => {
      const config = systemConfig[systemKey];

      // Only add systems that have data
      if (
        config &&
        (systemData?.current?.length > 0 || systemData?.archive?.length > 0)
      ) {
        // Transform current entries to timeline format
        const timeline = (systemData.current || []).map((entry, index) => ({
          id: `${systemKey}-current-${index}`,
          date: entry.date || "No date",
          title: entry.event || entry?.event_type || "Treatment Event",
          detail: entry.details || "No details available",
          isArchive: false,
        }));

        // Transform archive entries to timeline format
        const archive = (systemData.archive || []).map((entry, index) => ({
          id: `${systemKey}-archive-${index}`,
          date: entry.date || "No date",
          title: entry.event
            ? `${entry.event} (archive)`
            : entry?.event_type
            ? `${entry.event_type} (archive)`
            : "Treatment Event (archive)",
          detail: entry.details || "No details available",
          isArchive: true,
        }));

        systems.push({
          id: config.id,
          name: config.name,
          color: config.color,
          timeline,
          archive,
        });
      }
    });

    // Return systems or fallback to empty array
    return systems.length > 0 ? systems : [];
  };

  // Use transformed data
  const systems = transformData();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-6">
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📋 Treatment History by System
        </h3>
      </div>

      {systems.length > 0 ? (
        systems.map((system) => (
          <div key={system.id} className="mb-4">
            {/* System Header */}
            <div
              className={`${
                systemColors[system.color]
              } p-4 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 flex justify-between items-center font-semibold select-none mt-3`}
              onClick={() => toggleSystem(system.id)}
            >
              <span className="text-gray-800">{system.name}</span>
              <span className="text-gray-500 font-bold transition-transform duration-200">
                {expandedSystems[system.id] ? "▾" : "▸"}
              </span>
            </div>

            {/* System Content */}
            {expandedSystems[system.id] && (
              <div className="mt-4 animate-fadeIn">
                {system.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className={`mb-3 p-4 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 transition-all duration-200 hover:bg-gray-100 select-none ${
                      expandedTimelineEntries[`${system.id}-${entry.id}`]
                        ? "bg-gray-100"
                        : ""
                    }`}
                    onClick={() => toggleTimelineEntry(system.id, entry.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {entry.date} — {entry.title}
                      </span>
                      <span className="text-gray-400 font-bold transition-transform duration-200">
                        {expandedTimelineEntries[`${system.id}-${entry.id}`]
                          ? "▾"
                          : "▸"}
                      </span>
                    </div>
                    {expandedTimelineEntries[`${system.id}-${entry.id}`] && (
                      <div className="mt-3 text-sm text-gray-700 leading-relaxed animate-slideDown">
                        {entry.detail}
                      </div>
                    )}
                  </div>
                ))}

                {/* Archive Section */}
                {system.archive.length > 0 && (
                  <>
                    <div
                      className="mt-4 p-3 bg-gray-100 rounded-lg cursor-pointer text-sm text-gray-700 flex justify-between items-center hover:bg-gray-200 transition-colors duration-200"
                      onClick={() => toggleArchive(system.id)}
                    >
                      <span>📁 Archive — Older Medical History</span>
                      <span className="text-gray-500 font-bold">
                        {expandedArchives[system.id] ? "▾" : "▸"}
                      </span>
                    </div>

                    {expandedArchives[system.id] && (
                      <div className="mt-3 animate-fadeIn">
                        {system.archive.map((archiveEntry) => (
                          <div
                            key={archiveEntry.id}
                            className={`mb-2 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 transition-all duration-200 hover:bg-gray-100 select-none ${
                              expandedTimelineEntries[
                                `${system.id}-${archiveEntry.id}`
                              ]
                                ? "bg-gray-100"
                                : ""
                            }`}
                            onClick={() =>
                              toggleTimelineEntry(system.id, archiveEntry.id)
                            }
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                {archiveEntry.date} — {archiveEntry.title}
                              </span>
                              <span className="text-gray-400 font-bold transition-transform duration-200">
                                {expandedTimelineEntries[
                                  `${system.id}-${archiveEntry.id}`
                                ]
                                  ? "▾"
                                  : "▸"}
                              </span>
                            </div>
                            {expandedTimelineEntries[
                              `${system.id}-${archiveEntry.id}`
                            ] && (
                              <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                                {archiveEntry.detail}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-lg font-medium">
            No treatment history data available
          </p>
          <p className="text-sm mt-1">
            Treatment records will appear here when available
          </p>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;
