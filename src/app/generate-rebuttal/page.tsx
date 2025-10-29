"use client";

import { useState, useEffect } from "react";
import { Send, Menu, X, Search, User, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/navigation/sidebar";
import { cn } from "@/lib/utils";

interface RebuttalInput {
  body_part: string;
  modality: string;
  diagnosis: string;
  guideline_source?: string;
  reason_for_denial?: string;
  previous_response?: string;
  patient_id?: string;
  patient_name?: string;
  patient_dob?: string;
  patient_claim_number?: string;
}

interface BodyPartSnapshot {
  bodyPart: string;
  dx: string;
}

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  claimNumber?: string;
  ur_denial_reason?: string;
  bodyPartSnapshots?: BodyPartSnapshot[];
}

export default function RebuttalFormPage() {
  const [formData, setFormData] = useState<RebuttalInput>({
    body_part: "",
    modality: "",
    diagnosis: "",
    guideline_source: "MTUS",
    reason_for_denial: "",
    previous_response: "",
    patient_id: "",
    patient_name: "",
    patient_dob: "",
    patient_claim_number: "",
  });
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Patient search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Dropdown options states
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle patient search
  const handlePatientSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/recommendation?patientName=${encodeURIComponent(
          query
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // For auth session
        }
      );

      if (!res.ok) throw new Error("Failed to search patients");
      const data = await res.json();
      if (data.success) {
        setSearchResults(
          data.data.allMatchingDocuments.map((doc: any) => ({
            id: doc.id,
            name: doc.patientName,
            date_of_birth: doc.dob,
            claimNumber: doc.claimNumber,
            ur_denial_reason: doc.ur_denial_reason,
            bodyPartSnapshots: doc.bodyPartSnapshots,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePatientSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a patient and update form
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData((prev) => ({
      ...prev,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_dob: patient.date_of_birth,
      patient_claim_number: patient.claimNumber || "",
      reason_for_denial: patient.ur_denial_reason || "",
    }));

    // Populate dropdown options
    const snapshots = patient.bodyPartSnapshots || [];
    const uniqueBodyParts = [
      ...new Set(snapshots.map((s) => s.bodyPart)),
    ].sort();
    const uniqueDiagnoses = [...new Set(snapshots.map((s) => s.dx))].sort();

    setBodyParts(uniqueBodyParts);
    setDiagnoses(uniqueDiagnoses);

    // Prefill first options if available
    if (uniqueBodyParts.length > 0 && !formData.body_part) {
      setFormData((prev) => ({ ...prev, body_part: uniqueBodyParts[0] }));
    }
    if (uniqueDiagnoses.length > 0 && !formData.diagnosis) {
      setFormData((prev) => ({ ...prev, diagnosis: uniqueDiagnoses[0] }));
    }

    setSearchQuery(patient.name); // Only show patient name in the search field
    setSearchResults([]); // Hide results
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.body_part.trim() ||
      !formData.modality.trim() ||
      !formData.diagnosis.trim()
    ) {
      alert(
        "Please fill in the required fields: Body Part, Modality, and Diagnosis."
      );
      return;
    }

    setLoading(true);
    setResponse(null);
    setIsModalOpen(false);

    try {
      const res = await fetch("https://api.kebilo.com/api/rebuttal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // For auth session
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to generate rebuttal");
      const data = await res.json();
      setResponse(data.rebuttal);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setResponse(
        "⚠️ Error: Could not generate rebuttal. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const copyToClipboard = async () => {
    if (response && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(response);
        // Optional: Show a toast or alert
        alert("Rebuttal copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy: ", err);
        alert("Failed to copy to clipboard. Please select and copy manually.");
      }
    }
  };

  // Render response with improved markdown parsing: remove * and # signs, bold headings
  const renderFormattedResponse = (resp: string) => {
    if (!resp) return null;

    // Remove all asterisks (for bold/italic markdown)
    let cleaned = resp.replace(/\*/g, "").trim();

    // Split into lines
    const lines = cleaned.split("\n").filter((line) => line.trim());

    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Check for heading: starts with ## (allow optional spaces after)
      if (/^#{2}\s+/.test(trimmedLine)) {
        const headingText = trimmedLine.replace(/^#{2}\s+/, "");
        return (
          <h3
            key={index}
            className="text-xl font-bold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-1"
          >
            {headingText}
          </h3>
        );
      }

      // Regular paragraph
      if (trimmedLine) {
        return (
          <p
            key={index}
            className="text-base text-gray-700 leading-relaxed mb-2"
          >
            {trimmedLine}
          </p>
        );
      }

      return null;
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50">
      {/* Burger Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <X size={24} className="text-gray-700" />
        ) : (
          <Menu size={24} className="text-gray-700" />
        )}
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed left-0 top-0 z-50"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rebuttal Modal */}
      <AnimatePresence>
        {isModalOpen && response && !response.startsWith("⚠️") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📋 Generated Rebuttal Letter
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-gray-800 prose prose-lg max-w-none">
                {renderFormattedResponse(response)}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium flex items-center"
                >
                  <Copy size={18} className="mr-2" />
                  Copy
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <motion.div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            📝 Kebilo AI Rebuttal Generator
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Fill in the details below to generate a medical justification based
            on guidelines.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Search Section */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients by name..."
                  className="w-full p-3 pl-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
              {selectedPatient && (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <User size={14} className="mr-1" />
                  Selected: {selectedPatient.name}
                  {selectedPatient.claimNumber &&
                    ` (Claim: ${selectedPatient.claimNumber})`}
                </p>
              )}
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    {searchResults.map((patient) => (
                      <motion.li
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handlePatientSelect(patient)}
                        whileHover={{ backgroundColor: "#f9fafb" }}
                      >
                        <div className="font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          DOB: {patient.date_of_birth}{" "}
                          {patient.claimNumber &&
                            `- Claim: ${patient.claimNumber}`}
                        </div>
                        {patient.ur_denial_reason && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                            Denial Reason: {patient.ur_denial_reason}
                          </div>
                        )}
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              {searchLoading && (
                <p className="text-sm text-gray-500 mt-1">Searching...</p>
              )}
            </div>

            {/* Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Part *
                </label>
                <select
                  name="body_part"
                  value={formData.body_part}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Body Part</option>
                  {bodyParts.map((bp) => (
                    <option key={bp} value={bp}>
                      {bp}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment *
                </label>
                <input
                  type="text"
                  name="modality"
                  value={formData.modality}
                  onChange={handleInputChange}
                  placeholder="e.g., acupuncture"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis *
                </label>
                <select
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Diagnosis</option>
                  {diagnoses.map((dx) => (
                    <option key={dx} value={dx}>
                      {dx}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guideline Source
                </label>
                <select
                  name="guideline_source"
                  value={formData.guideline_source}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="MTUS">MTUS</option>
                  <option value="Aetna">Aetna</option>
                  <option value="UHC">UHC</option>
                  <option value="Blue Shield CA">Blue Shield CA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Denial
                </label>
                <input
                  type="text"
                  name="reason_for_denial"
                  value={formData.reason_for_denial}
                  onChange={handleInputChange}
                  placeholder="e.g., lack of physical exam findings"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Response
                </label>
                <input
                  type="text"
                  name="previous_response"
                  value={formData.previous_response}
                  onChange={handleInputChange}
                  placeholder="e.g., Patient reports decreased pain"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                "⏳ Generating Rebuttal..."
              ) : (
                <>
                  <Send size={18} className="inline mr-2" /> Generate Rebuttal
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[200px]">
            {loading ? (
              <p className="text-gray-500 italic">
                ⏳ Searching guidelines and generating rebuttal...
              </p>
            ) : response ? (
              response.startsWith("⚠️") ? (
                <motion.div
                  className="text-red-600 whitespace-pre-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {response}
                </motion.div>
              ) : isModalOpen ? (
                <p className="text-gray-400 text-center">
                  Rebuttal generated! View it in the modal above.
                </p>
              ) : (
                <motion.div
                  className="text-gray-800 whitespace-pre-wrap prose prose-sm max-w-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-semibold mb-2 text-blue-600">
                    Generated Rebuttal:
                  </h3>
                  {renderFormattedResponse(response)}
                </motion.div>
              )
            ) : (
              <p className="text-gray-400 text-center">
                Fill the form and submit to generate a rebuttal.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
