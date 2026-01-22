import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI, { AzureOpenAI } from "openai";

// Timeline Event Types (as per spec)
enum TimelineEventType {
  physical_therapy = "physical_therapy",
  chiropractic_care = "chiropractic_care",
  pain_management_visit = "pain_management_visit",
  orthopedic_consult = "orthopedic_consult",
  imaging_mri = "imaging_mri",
  imaging_xray = "imaging_xray",
  injection = "injection",
  surgery = "surgery",
  ur_approval = "ur_approval",
  ur_denial = "ur_denial",
  work_status_change = "work_status_change",
  mmi_status_update = "mmi_status_update"
}

export async function POST(request: NextRequest) {
  try {
    const { document_id: bodyDocId, summary_card, patient_name: bodyName, dob: bodyDob, claim_number: bodyClaim } = await request.json();

    let document_id = bodyDocId;
    console.log("Verifying document with ID from body:", document_id);
    console.log("Received summary_card:", summary_card ? "Yes" : "No");

    let document = null;

    if (document_id) {
      document = await prisma.document.findUnique({
        where: { id: document_id },
      });
    } else {
      // Fallback: Find the latest document for this patient
      const patient_name = bodyName;
      const dob = bodyDob;
      const claim_number = bodyClaim;

      if (typeof patient_name === "string") {
        document = await prisma.document.findFirst({
          where: {
            patientName: patient_name,
            ...(dob ? { dob: dob as string } : {}),
            ...(claim_number ? { claimNumber: claim_number as string } : {}),
          },
          orderBy: { createdAt: "desc" },
        });
        if (document) document_id = document.id;
      }
    }

    if (!document || !document_id) {
      return NextResponse.json(
        { error: "No document found to verify. Please provide document_id or patient info." },
        { status: 404 }
      );
    }

    // Update the document status to verified
    await prisma.document.update({
      where: { id: document_id },
      data: { status: "verified" },
    });

    // Generate Treatment History from Summary Card (following spec)
    if (summary_card) {
      try {
        const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
        const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
        const standardApiKey = process.env.OPENAI_API_KEY;

        let openai: OpenAI | AzureOpenAI;

        if (azureApiKey && azureEndpoint && azureDeployment) {
          openai = new AzureOpenAI({
            apiKey: azureApiKey,
            endpoint: azureEndpoint,
            deployment: azureDeployment,
            apiVersion: "2024-02-15-preview",
          });
        } else if (standardApiKey) {
          openai = new OpenAI({
            apiKey: standardApiKey,
          });
        } else {
          console.error("❌ Missing OpenAI/Azure API Key");
          return NextResponse.json(
            { error: "Server misconfiguration: Missing API Key" },
            { status: 500 }
          );
        }

        const docContext = JSON.stringify(summary_card, null, 2);

        const prompt = `
You are a medical data mapping expert. Your task is to EXTRACT and MAP information from the provided summary card into a structured treatment history format organized by Body System.

🔒 CRITICAL RULES - NON-NEGOTIABLE:
1. ✅ Extract ONLY information explicitly present in the summary card
2. ❌ DO NOT infer, interpret, or generate any medical information
3. ❌ DO NOT add clinical insights or explanations not in the source
4. ❌ DO NOT rephrase medical terms - use exact terminology from source
5. ⚠️ If information is unclear or absent, omit the field entirely
6. ❌ DO NOT assume body system classifications - only map if explicitly clear
7. 🎯 This is MAPPING, not clinical analysis

📄 Input Summary Card:
${docContext}

🎯 TIMELINE EVENT TYPE CLASSIFICATION:
Each entry MUST be classified with an event_type from this list:
- "physical_therapy" - Physical therapy sessions, PT evaluations
- "chiropractic_care" - Chiropractic visits, adjustments
- "pain_management_visit" - Pain management consultations, procedures
- "orthopedic_consult" - Orthopedic consultations, follow-ups
- "imaging_mri" - MRI scans
- "imaging_xray" - X-ray imaging
- "injection" - Injections (steroid, trigger point, etc.)
- "surgery" - Surgical procedures
- "ur_approval" - Utilization review approvals
- "ur_denial" - Utilization review denials
- "work_status_change" - Work capacity changes, RTW updates
- "mmi_status_update" - Maximum medical improvement updates
- "other" - Use ONLY if none above apply (rare)

🏗️ Output Structure (maintain existing format):
{
  "musculoskeletal_system": [ // 🦴 Musculoskeletal System
    {
      "report_date": "YYYY-MM-DD", // Extract ONLY if explicitly stated
      "physician": "Dr. Name", // Extract ONLY exact name as written
      "title": "Document Title", // Extract from summary_card header
      "event_type": "physical_therapy", // REQUIRED: Must be one of the event types listed above
      "event_label": "Physical therapy completed", // REQUIRED: User-friendly label for timeline display
      "content": [
        { 
          "field": "findings",  // Use: findings, diagnosis, recommendations, work_status, mmi_status
          "collapsed": "Short summary", // Max 100 chars, factual
          "expanded": "Detailed description. Use bullet points starting with '- ' for lists." 
        }
      ],
      "document_id": "${document_id}" // Auto-added for tracking
    }
  ],
  "cardiovascular_system": [], // ❤️ Cardiovascular System
  "pulmonary_respiratory": [], // 🫁 Pulmonary / Respiratory
  "neurological": [], // 🧠 Neurological
  "gastrointestinal": [], // 🧬 Gastrointestinal
  "metabolic_endocrine": [], // ⚖️ Metabolic / Endocrine
  "general_treatments": [], // 💊 General Treatments
  "other_systems": [], // 📋 Other Systems
  "psychiatric_mental_health": [], // 🧠 Psychiatric / Mental Health
  "dental_oral": [], // 🦷 Dental / Oral
  "dermatological": [], // 🩹 Dermatological
  "ent_head_neck": [], // 👂 ENT / Head & Neck
  "genitourinary_renal": [], // 🫘 Genitourinary / Renal
  "hematologic_lymphatic": [], // 🩸 Hematologic / Lymphatic
  "immune_allergy": [], // 🛡️ Immune / Allergy
  "ophthalmologic": [], // 👁️ Ophthalmologic
  "reproductive_obstetric_gynecologic": [], // 🩺 Reproductive / OB-GYN
  "sleep_disorders": [] // 😴 Sleep Disorders
}

📋 EXTRACTION PROTOCOL:

1. **Document Identification**:
   - "report_date": Extract ONLY if date is explicitly stated (format: YYYY-MM-DD)
   - "physician": Extract ONLY the exact name as written in source
   - "title": Extract ONLY from document header - use exact wording
   - If any field is missing in source → OMIT the field entirely

2. **Event Classification** (REQUIRED):
   - "event_type": Select the most appropriate type from the list above
     * Look at document title, physician specialty, and content
     * Examples:
       - "PT Evaluation" → "physical_therapy"
       - "MRI Lumbar Spine" → "imaging_mri"
       - "Orthopedic Follow-up" → "orthopedic_consult"
       - "Work Status: Modified Duty" → "work_status_change"
       - "MMI Determination" → "mmi_status_update"
   - "event_label": Create a user-friendly label for timeline display
     * Format: "[Event Type] completed" or "[Event Type] - [Key Detail]"
     * Examples:
       - "Physical therapy completed"
       - "MRI lumbar spine completed"
       - "Orthopedic consult completed"
       - "Work status changed to modified duty"
       - "MMI status updated"

3. **Content Mapping** (field classification):
   Use ONLY these exact field values:
   - "findings" → diagnostic findings, observations, test results
   - "diagnosis" → stated diagnoses, clinical impressions
   - "recommendations" → treatment recommendations, care plans
   - "work_status" → work capacity, restrictions, RTW assessments
   - "mmi_status" → maximum medical improvement statements
   - "other" → ONLY if none above apply (use exact label from source)

4. **Content Formatting**:
   - "collapsed": Extract the most concise factual statement (max 100 chars)
   - "expanded": Extract complete details AS WRITTEN
     * Preserve exact bullet point formatting (use '- ' prefix)
     * Preserve exact medical terminology
     * Preserve exact measurements/values
     * Keep original sentence structure
     * DO NOT paraphrase or reword

5. **Body System Classification**:
   - Map to body system ONLY if summary card explicitly relates to that system
   - Common mappings:
     * Orthopedic, spine, joint, muscle → musculoskeletal_system
     * MRI, X-ray, CT imaging → musculoskeletal_system (if related to MSK)
     * Pain management → musculoskeletal_system or neurological
     * Physical therapy → musculoskeletal_system
     * Work restrictions → (classify by primary condition)
   - If unclear → use "other_systems"
   - DO NOT infer classifications

6. **Handling Missing Information**:
   - If report_date not stated → omit field
   - If physician not stated → omit field
   - If body system has no relevant data → keep array empty []
   - Never use placeholders or "Unknown"

✅ VALIDATION CHECKLIST (verify before returning):
□ Every extracted value exists verbatim in source summary card
□ event_type is assigned to every entry using exact enum values
□ event_label is present and user-friendly for every entry
□ No medical interpretations or inferences added
□ No reformulated medical language
□ Bullet points preserved exactly as in source
□ Empty arrays for non-applicable body systems
□ No fields included that weren't in source
□ document_id added to each entry

⚠️ OUTPUT REQUIREMENTS:
- Return ONLY valid JSON
- NO markdown code blocks
- NO explanatory text
- NO additional commentary
- NO preamble

🎯 Remember: Documents → Summary Cards → Timeline
You are working with a SUMMARY CARD, not raw documents.
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are a medical data extraction expert. You extract and map information exactly as written without inference or interpretation." 
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1, // Low temperature for consistent extraction
        });

        const newDocHistoryData = JSON.parse(completion.choices[0].message.content || "{}");
        
        // Ensure document_id is added to each entry AND validate event_type
        Object.keys(newDocHistoryData).forEach(key => {
          if (Array.isArray(newDocHistoryData[key])) {
            newDocHistoryData[key] = newDocHistoryData[key].map((item: any) => {
              // Validate event_type exists and is valid
              const validEventTypes = Object.values(TimelineEventType);
              if (!item.event_type || !validEventTypes.includes(item.event_type)) {
                console.warn(`Invalid or missing event_type for entry in ${key}:`, item);
                item.event_type = 'other'; // Fallback
              }
              
              // Ensure event_label exists
              if (!item.event_label) {
                console.warn(`Missing event_label for entry in ${key}:`, item);
                item.event_label = item.title || 'Medical event'; // Fallback
              }
              
              return {
                ...item,
                document_id: document_id
              };
            });
          }
        });

        // Update TreatmentHistory in DB (Merge with existing)
        const existingTreatmentHistory = await prisma.treatmentHistory.findFirst({
          where: {
            patientName: document.patientName as string,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existingTreatmentHistory) {
          const currentHistoryData = (existingTreatmentHistory.historyData as any) || {};
          let mergedHistoryData = { ...currentHistoryData };

          // Merge logic with deduplication
          for (const systemKey in newDocHistoryData) {
            if (newDocHistoryData.hasOwnProperty(systemKey) && Array.isArray(newDocHistoryData[systemKey])) {
              const currentItems = Array.isArray(mergedHistoryData[systemKey]) ? mergedHistoryData[systemKey] : [];
              const newItems = newDocHistoryData[systemKey];
              
              // Filter out existing items for this document_id (prevent duplicates on re-verify)
              const filteredCurrentItems = currentItems.filter((item: any) => item.document_id !== document_id);
              
              // Combine and sort by report_date descending
              const combined = [...newItems, ...filteredCurrentItems];
              
              combined.sort((a: any, b: any) => {
                const dateA = new Date(a.report_date || '1970-01-01').getTime();
                const dateB = new Date(b.report_date || '1970-01-01').getTime();
                return dateB - dateA; // Most recent first
              });
              
              mergedHistoryData[systemKey] = combined;
            }
          }

          // Update existing record
          await prisma.treatmentHistory.update({
            where: { id: existingTreatmentHistory.id },
            data: {
              historyData: mergedHistoryData,
              documentId: document.id,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new record
          await prisma.treatmentHistory.create({
            data: {
              patientName: document.patientName as string,
              dob: document.dob || null,
              claimNumber: document.claimNumber || null,
              physicianId: document.physicianId || null,
              historyData: newDocHistoryData,
              documentId: document.id,
            },
          });
        }

      } catch (openaiError) {
        console.error("Error generating treatment history with OpenAI:", openaiError);
        // Continue without failing verification if OpenAI fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document verified and treatment history generated from summary card.",
      document_id: document_id,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}