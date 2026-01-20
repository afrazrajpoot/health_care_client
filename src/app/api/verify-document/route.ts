import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI, { AzureOpenAI } from "openai";

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

    // 2. Update the document status to verified
    await prisma.document.update({
      where: { id: document_id },
      data: { status: "verified" },
    });

    // 3. Generate Comprehensive Treatment History using OpenAI
    // Use the provided summary_card as the main context
    
    // Construct context from summary_card
    const docContext = summary_card ? JSON.stringify(summary_card, null, 2) : "No summary available";

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

        const prompt = `
You are a medical data expert. Your task is to MAP the provided medical document summary into a structured JSON format organized by Body System.

CRITICAL RULES - VIOLATION WILL RESULT IN INVALID OUTPUT:
1. Extract ONLY information explicitly present in the source document
2. DO NOT infer, interpret, or generate any medical information
3. DO NOT add clinical insights or explanations not in the source
4. DO NOT rephrase medical terms - use exact terminology from source
5. If information is unclear or absent, leave the field empty or omit it
6. DO NOT assume body system classifications - only map if explicitly clear from context


Input Document Summary:
${docContext}

For each Body System, you must create a list of entries corresponding to the document information.
Since there is only one document provided, you will likely create a single entry in one or more relevant body systems.

JSON Structure:
{
  "musculoskeletal_system": [ // 🦴 Musculoskeletal System
    {
      "report_date": "YYYY-MM-DD",
      "physician": "Dr. Name",
      "title": "Document Title", // Extract from header.title
      "content": [
        { 
          "field": "findings",  
          "collapsed": "Short summary of finding", 
          "expanded": "Detailed description. Use bullet points starting with '- ' for lists." 
        }
      ]
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


  EXTRACTION PROTOCOL:
1. **Document Identification**:
   - "report_date": Extract ONLY if explicitly stated (format: YYYY-MM-DD)
   - "physician": Extract ONLY the exact name as written
   - "title": Extract ONLY from document header - use exact wording

2. **Content Mapping**:
   - "field": Use ONLY these exact values when applicable:
     * "findings" - for diagnostic findings/observations
     * "diagnosis" - for stated diagnoses
     * "recommendations" - for treatment recommendations
     * "work_status" - for work capacity assessments
     * "mmi_status" - for maximum medical improvement status
     * "other" - ONLY if none above apply, with exact label from source
   
   - "collapsed": Extract the most concise factual statement (max 100 chars)
   - "expanded": Extract complete details AS WRITTEN. Preserve:
     * Exact bullet point formatting (use '- ' prefix)
     * Exact medical terminology
     * Exact measurements/values
     * Original sentence structure

3. **Body System Classification**:
   - Map to body system ONLY if document explicitly relates to that system
   - If unclear, use "other_systems"
   - DO NOT classify based on assumptions

4. **Handling Missing Information**:
   - If report_date is not stated: omit the field entirely
   - If physician is not stated: omit the field entirely
   - If a body system has no relevant data: keep array empty []

VALIDATION CHECKLIST BEFORE RETURNING:
□ Every extracted value exists verbatim in source document
□ No medical interpretations or inferences added
□ No reformulated medical language
□ Bullet points preserved exactly as in source
□ Empty arrays for non-applicable body systems
□ No fields included that weren't in source

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON
- NO markdown code blocks
- NO explanatory text
- NO additional commentary


Rules:
1. **Map Data Only**: Do not generate new insights. Extract exactly what is in the document summary.
2. **Title**: The "title" field MUST be extracted from the document header title.
3. **Fields**: Use standard keys for "field" like: "findings", "diagnosis", "recommendations", "work_status", "mmi_status".
4. **Content**: 
   - "collapsed": A concise 1-line summary.
   - "expanded": The full details. **IMPORTANT**: If the source has bullet points, preserve them.
5. If the document has no relevant info for a system, keep that system's array empty.
6. Return ONLY the JSON object.
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // Use a capable model for synthesis
          messages: [
            { role: "system", content: "You are a medical data extraction and synthesis expert." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        const newDocHistoryData = JSON.parse(completion.choices[0].message.content || "{}");
        
        // Add document_id to each entry for deduplication
        Object.keys(newDocHistoryData).forEach(key => {
            if (Array.isArray(newDocHistoryData[key])) {
                newDocHistoryData[key] = newDocHistoryData[key].map((item: any) => ({
                    ...item,
                    document_id: document_id
                }));
            }
        });

        // 4. Update TreatmentHistory in DB (Merge with existing)
        
        // First, try to find an existing treatment history for this patient
        // Note: Using findFirst as there might not be a unique constraint on these fields together
        const existingTreatmentHistory = await prisma.treatmentHistory.findFirst({
          where: {
            patientName: document.patientName as string,
            // Only separate mainly by patientName as DOB/Claim might be missing sometimes
            // If strictly needed, uncomment:
            // dob: document.dob || null, 
            // claimNumber: document.claimNumber || null,
          },
          orderBy: { createdAt: 'desc' }, // Get the most recent one
        });

        if (existingTreatmentHistory) {
          const currentHistoryData = (existingTreatmentHistory.historyData as any) || {};
          let mergedHistoryData = { ...currentHistoryData };

          // Merge logic
          for (const systemKey in newDocHistoryData) {
             if (newDocHistoryData.hasOwnProperty(systemKey) && Array.isArray(newDocHistoryData[systemKey])) {
                 const currentItems = Array.isArray(mergedHistoryData[systemKey]) ? mergedHistoryData[systemKey] : [];
                 const newItems = newDocHistoryData[systemKey];
                 
                 // Filter out existing items for this document_id to avoid duplicates (if we are re-verifying)
                 const filteredCurrentItems = currentItems.filter((item: any) => item.document_id !== document_id);
                 
                 // Combine and Sort
                 const combined = [...newItems, ...filteredCurrentItems];
                 
                 // Sort by report_date descending
                 combined.sort((a: any, b: any) => {
                     const dateA = new Date(a.report_date || '1970-01-01').getTime();
                     const dateB = new Date(b.report_date || '1970-01-01').getTime();
                     return dateB - dateA;
                 });
                 
                 mergedHistoryData[systemKey] = combined;
             }
          }

          // Update the existing record
          await prisma.treatmentHistory.update({
            where: { id: existingTreatmentHistory.id },
            data: {
              historyData: mergedHistoryData,
              documentId: document.id, // Update to latest verified doc id reference
              updatedAt: new Date(),
            },
          });
        } else {
          // Create a new record with initial data
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
        // Continue without failing the verification if OpenAI fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document verified successfully`,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}