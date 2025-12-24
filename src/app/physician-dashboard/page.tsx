"use client";
import React, { useState } from "react";

const App = () => {
  const [recentPatientsVisible, setRecentPatientsVisible] = useState(false);
  const [openCard, setOpenCard] = useState("patient-intake");

  const patientInfo = {
    name: "Christina Rodriguez",
    dob: "9/20/1971",
    claim: "1207-WC-24",
    doi: "12/9/2024",
    visits: "5 Visits",
  };

  const statusChips = [
    { id: 1, status: "red", text: "Adjuster name needed — Ortho consult" },
    {
      id: 2,
      status: "amber",
      text: "Scheduling attempt pending — MRI Right Shoulder",
    },
    {
      id: 3,
      status: "blue",
      text: "UR decision pending — EMG/NCS Upper Extremities",
    },
    { id: 4, status: "amber", text: "Records requested — Prior PT notes" },
    { id: 5, status: "red", text: "Signature required — PR‑2 attachment" },
    { id: 6, status: "amber", text: "Facility scheduling — Ortho follow‑up" },
    { id: 7, status: "blue", text: "Authorization pending — PT 6 visits" },
    { id: 8, status: "amber", text: "Patient contacted — Awaiting callback" },
    { id: 9, status: "red", text: "Time‑sensitive — MRI slot expiring" },
  ];

  const whatsNewItems = [
    {
      id: "patient-intake",
      icon: "🧾",
      title: "Patient Intake Update",
      subtitle: "Completed 12/8/2025 • Since last visit",
      pills: [
        { text: "Med refills requested: No", type: "default" },
        { text: "New appointments: Ortho consult", type: "gray" },
        { text: "ADL change: Grip ↓", type: "gray" },
      ],
      details: {
        keyChanges:
          "Since the last visit, the patient reports no need for medication refills. One new appointment occurred (orthopedic consultation). Patient reports a decline in grip-related activities of daily living compared to the prior visit.",
        systemInterpretation:
          "Changes flagged as clinically relevant. Consider correlation with exam findings, treatment response, and need for treatment modification or further evaluation.",
      },
      hasDocument: false,
    },
    {
      id: "mri-wrist",
      icon: "📘",
      title: "MRI – Right Wrist",
      subtitle: "Mark Yeh, MD • 11/13/2025",
      pills: [
        { text: "High‑grade TFCC tear", type: "default" },
        { text: "Tendinosis", type: "gray" },
        { text: "Sprains", type: "gray" },
      ],
      details: {
        keyFindings:
          "High‑grade partial thickness tear of triangular fibrocartilage; ligament sprains; osteoarthritic changes; nerve flattening; joint effusion.",
        recommendations:
          "Correlate clinically for CTS; follow up with treating specialist; consider conservative management vs surgical consult as indicated.",
      },
      hasDocument: true,
    },
    {
      id: "mri-hand",
      icon: "📘",
      title: "MRI – Right Hand",
      subtitle: "Mark Yeh, MD • 11/13/2025",
      pills: [
        { text: "CMC osteoarthritis", type: "default" },
        { text: "Ligament sprain", type: "gray" },
      ],
      details: {
        keyFindings: "Moderate CMC OA; MCP sprain; small intraosseous cyst.",
        recommendations:
          "Continue conservative management; re‑evaluate symptoms and function at follow‑up.",
      },
      hasDocument: true,
    },
    {
      id: "emg-ncs",
      icon: "⚡",
      title: "EMG/NCS – Upper Extremities",
      subtitle: "Don Masao • 11/11/2025",
      pills: [
        { text: "Bilateral CTS", type: "default" },
        { text: "Ulnar neuropathy", type: "gray" },
      ],
      details: {
        keyFindings:
          "Abnormal nerve conduction compatible with CTS; additional findings suggest ulnar neuropathy.",
        recommendations:
          "Repeat EMG in 6 months if persistent; consider splinting/therapy; correlate with exam.",
      },
      hasDocument: true,
    },
    {
      id: "ortho-consult",
      icon: "🩺",
      title: "Ortho Consult",
      subtitle: "Smith, MD • 11/10/2025",
      pills: [
        { text: "Impingement suspected", type: "default" },
        { text: "ROM ↓ 20%", type: "gray" },
        { text: "MRI recommended", type: "gray" },
      ],
      details: {
        keyFindings:
          "Exam suggests impingement; ROM reduced; consider imaging correlation.",
        recommendations:
          "Obtain MRI; continue conservative care pending results.",
      },
      hasDocument: true,
    },
    {
      id: "pt-note",
      icon: "📝",
      title: "PT Note",
      subtitle: "10/18/2025",
      pills: [
        { text: "40% improvement", type: "default" },
        { text: "Strength ↑", type: "gray" },
      ],
      details: {
        keyFindings: "Therapy progress documented with measurable gains.",
        recommendations: "Continue PT; reinforce HEP.",
      },
      hasDocument: true,
    },
    {
      id: "pain-management",
      icon: "🩺",
      title: "Pain Management Follow‑up",
      subtitle: "10/22/2025",
      pills: [
        { text: "Myofascial pain", type: "default" },
        { text: "Consider injections", type: "gray" },
      ],
      details: {
        keyFindings: "Trigger points noted; prior modalities reviewed.",
        recommendations:
          "Discuss injection options; continue conservative measures.",
      },
      hasDocument: true,
    },
  ];

  const recentPatients = [
    "Christina Rodriguez — MRI • 12/9/2025",
    "Araceli Murillo — QME • 12/9/2025",
    "Mark Harris — Psych • 12/9/2025",
    "Yolanda Pena — Progress • 12/9/2025",
    "Henry Mota — Orders • 12/9/2025",
    "Dale Rosado — Office Visit • 12/9/2025",
  ];

  const toggleCard = (cardId: any) => {
    setOpenCard(openCard === cardId ? null : cardId);
  };

  return (
    <div className="font-[Arial] bg-[#f5f7fa] p-5 text-[#111827] max-w-full overflow-x-hidden min-h-screen">
      <div className="max-w-[1400px] mx-auto relative">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 mb-[14px]">
          <div className="bg-white p-[14px_16px] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] flex items-center gap-[10px] flex-wrap">
            <div className="text-[18px] font-bold mr-1">{patientInfo.name}</div>
            <div className="bg-[#eef2ff] px-3 py-[6px] rounded-full text-[13px] text-[#111827]">
              DOB: {patientInfo.dob}
            </div>
            <div className="bg-[#eef2ff] px-3 py-[6px] rounded-full text-[13px] text-[#111827]">
              Claim: {patientInfo.claim}
            </div>
            <div className="bg-[#eef2ff] px-3 py-[6px] rounded-full text-[13px] text-[#111827]">
              DOI: {patientInfo.doi}
            </div>
            <div className="bg-[#e8f5e9] px-3 py-[6px] rounded-full text-[13px] text-[#111827]">
              {patientInfo.visits}
            </div>
          </div>
        </div>

        {/* Recent Patients Toggle */}
        <div
          className={`fixed right-0 top-1/2 -translate-y-1/2 bg-[#3f51b5] text-white p-[10px_12px] rounded-l-[12px] shadow-[0_8px_18px_rgba(0,0,0,0.18)] cursor-pointer z-[9998] font-extrabold text-[13px] flex items-center gap-2 ${
            recentPatientsVisible ? "checked" : ""
          }`}
          onClick={() => setRecentPatientsVisible(!recentPatientsVisible)}
        >
          <span className="[writing-mode:vertical-rl] rotate-180 tracking-[0.02em]">
            Recent Patients
          </span>
          <div
            className={`[writing-mode:horizontal-tb] text-[16px] leading-[1] ${
              recentPatientsVisible ? "rotate-180" : ""
            }`}
          >
            ◀
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-[14px] items-start max-w-full relative">
          {/* Main Content */}
          <div className="relative">
            {/* Staff Status Panel */}
            <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] overflow-hidden mb-[14px]">
              <div className="flex items-center justify-between p-[12px_14px] border-b border-[#e5e7eb]">
                <div>
                  <div className="font-extrabold">Staff Status</div>
                  <div className="text-[12px] text-[#6b7280]">
                    Patient-specific • Read-only
                  </div>
                </div>
              </div>
              <div className="p-[12px_14px] overflow-hidden">
                <div className="w-full max-w-full flex flex-nowrap gap-[10px] overflow-x-auto overflow-y-hidden pb-2 scroll-smooth -webkit-overflow-scrolling-touch scroll-snap-type-x-proximity">
                  {statusChips.map((chip) => (
                    <div
                      key={chip.id}
                      className="inline-flex items-center gap-2 px-3 py-[6px] rounded-full border border-[#e5e7eb] bg-white text-[12px] font-extrabold text-[#111827] flex-shrink-0 scroll-snap-start"
                    >
                      <div
                        className={`w-[10px] h-[10px] rounded-full ${
                          chip.status === "red"
                            ? "bg-[#ef4444]"
                            : chip.status === "amber"
                            ? "bg-[#f59e0b]"
                            : chip.status === "blue"
                            ? "bg-[#3b82f6]"
                            : "bg-[#9ca3af]"
                        }`}
                      ></div>
                      {chip.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What's New Panel */}
            <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between p-[12px_14px] border-b border-[#e5e7eb]">
                <div>
                  <div className="font-extrabold">
                    What's New Since Last Visit
                  </div>
                  <div className="text-[12px] text-[#6b7280]">
                    Scan-only cards • Click to expand • Expanded content scrolls
                    inside the card
                  </div>
                </div>
                <div className="text-[12px] text-[#6b7280]">
                  {whatsNewItems.length} items
                </div>
              </div>
              <div className="max-h-[420px] overflow-auto p-[10px_10px_12px]">
                {whatsNewItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-[14px] mb-[10px] overflow-hidden ${
                      openCard === item.id
                        ? "border-[#e5e7eb]"
                        : "border-[#e5e7eb]"
                    }`}
                  >
                    <div
                      className={`p-[10px_12px] cursor-pointer flex gap-[10px] items-start ${
                        openCard === item.id ? "bg-[#f9fafb]" : ""
                      }`}
                      onClick={() => toggleCard(item.id)}
                    >
                      <div className="w-[34px] h-[34px] rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[16px] flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-[10px]">
                          <div className="min-w-0">
                            <div
                              className={`text-[14px] font-extrabold truncate ${
                                openCard === item.id
                                  ? "text-[#0f172a]"
                                  : "text-[#111827]"
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="text-[12px] text-[#6b7280] mt-[2px]">
                              {item.subtitle}
                            </div>
                          </div>
                          <div className="flex gap-[8px] items-center flex-shrink-0">
                            {item.hasDocument && (
                              <button className="inline-flex items-center gap-[6px] px-3 py-[6px] rounded-full border border-[#e5e7eb] bg-white text-[12px] font-extrabold text-[#1a237e] hover:bg-[#eef2ff] transition-colors whitespace-nowrap">
                                📄 View Original
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-[8px] items-center flex-wrap mt-[6px]">
                          {item.pills.map((pill, index) => (
                            <span
                              key={index}
                              className={`text-[12px] px-2 py-1 rounded-full font-bold ${
                                pill.type === "gray"
                                  ? "bg-[#f3f4f6] text-[#374151] font-semibold"
                                  : "bg-[#eef2ff] text-[#1a237e]"
                              }`}
                            >
                              {pill.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {openCard === item.id && (
                      <div className="border-t border-[#e5e7eb] p-[10px_12px] bg-[#fafafa]">
                        <div className="grid gap-[8px]">
                          {item.details.keyChanges && (
                            <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-[10px]">
                              <div className="text-[12px] text-[#6b7280] font-extrabold uppercase tracking-[0.02em]">
                                Key Patient-Reported Changes
                              </div>
                              <div className="text-[13px] text-[#111827] mt-[6px] leading-[1.35] max-h-[120px] overflow-auto pr-1.5">
                                {item.details.keyChanges}
                              </div>
                            </div>
                          )}
                          {item.details.keyFindings && (
                            <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-[10px]">
                              <div className="text-[12px] text-[#6b7280] font-extrabold uppercase tracking-[0.02em]">
                                Key Findings
                              </div>
                              <div className="text-[13px] text-[#111827] mt-[6px] leading-[1.35] max-h-[120px] overflow-auto pr-1.5">
                                {item.details.keyFindings}
                              </div>
                            </div>
                          )}
                          {item.details.systemInterpretation && (
                            <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-[10px]">
                              <div className="text-[12px] text-[#6b7280] font-extrabold uppercase tracking-[0.02em]">
                                System Interpretation
                              </div>
                              <div className="text-[13px] text-[#111827] mt-[6px] leading-[1.35] max-h-[120px] overflow-auto pr-1.5">
                                {item.details.systemInterpretation}
                              </div>
                            </div>
                          )}
                          {item.details.recommendations && (
                            <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-[10px]">
                              <div className="text-[12px] text-[#6b7280] font-extrabold uppercase tracking-[0.02em]">
                                Recommendations
                              </div>
                              <div className="text-[13px] text-[#111827] mt-[6px] leading-[1.35] max-h-[120px] overflow-auto pr-1.5">
                                {item.details.recommendations}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Patients Panel - Fixed Position next to toggle */}
        {recentPatientsVisible && (
          <div className="fixed right-[60px] top-1/2 -translate-y-1/2 z-[9997]">
            <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] overflow-hidden w-[320px]">
              <div className="flex items-center justify-between p-[12px_14px] border-b border-[#e5e7eb]">
                <div className="font-extrabold">Recent Patients</div>
                <div className="text-[12px] text-[#6b7280]">
                  Quick jump list
                </div>
              </div>
              <div className="p-0 max-h-[400px] overflow-y-auto">
                {recentPatients.map((patient, index) => (
                  <div
                    key={index}
                    className="p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer"
                  >
                    {patient}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating New Order Button */}
        <button className="fixed bottom-[18px] right-[18px] bg-[#3f51b5] text-white px-4 py-3 rounded-full shadow-[0_8px_18px_rgba(0,0,0,0.18)] cursor-pointer text-[14px] font-bold z-[9999] hover:bg-[#354497] transition-colors">
          + New Order
        </button>
      </div>
    </div>
  );
};

export default App;
