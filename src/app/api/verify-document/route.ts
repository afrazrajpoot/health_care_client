import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI, { AzureOpenAI } from "openai";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let document_id = searchParams.get("document_id");
    let document = null;

    if (document_id) {
      document = await prisma.document.findUnique({
        where: { id: document_id },
      });
    } else {
      // Fallback: Find the latest document for this patient
      const patient_name = searchParams.get("patient_name");
      const dob = searchParams.get("dob");
      const claim_number = searchParams.get("claim_number");

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

    // 3. Generate Treatment History using OpenAI
    const documentContent = document.aiSummarizerText || document.briefSummary || "";
    if (documentContent) {
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
You are a medical data extractor. Extract treatment history from the following medical document summary and format it into a specific JSON structure.

Document Content:
${documentContent}

JSON Structure to follow:
{
  "musculoskeletal_system": { "current": [], "archive": [] },
  "cardiovascular_system": { "current": [], "archive": [] },
  "pulmonary_respiratory": { "current": [], "archive": [] },
  "neurological": { "current": [], "archive": [] },
  "gastrointestinal": { "current": [], "archive": [] },
  "metabolic_endocrine": { "current": [], "archive": [] },
  "general_treatments": { "current": [], "archive": [] },
  "other_systems": { "current": [], "archive": [] },
  "psychiatric_mental_health": { "current": [], "archive": [] },
  "dental_oral": { "current": [], "archive": [] },
  "dermatological": { "current": [], "archive": [] },
  "ent_head_neck": { "current": [], "archive": [] },
  "genitourinary_renal": { "current": [], "archive": [] },
  "hematologic_lymphatic": { "current": [], "archive": [] },
  "immune_allergy": { "current": [], "archive": [] },
  "ophthalmologic": { "current": [], "archive": [] },
  "reproductive_obstetric_gynecologic": { "current": [], "archive": [] },
  "sleep_disorders": { "current": [], "archive": [] }
}

Rules:
1. Only include information found in the document.
2. If a system has no information, leave "current" and "archive" as empty arrays.
3. "current" should contain the most recent treatments/events mentioned.
4. "event" should be a short title (e.g., "Physical Therapy", "MRI Scan", "Medication Change").
5. "details" should be a concise description of the event.
6. Use YYYY-MM-DD format for dates if available, otherwise use what is provided.
7. Return ONLY the JSON object.
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a medical data extraction expert." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        const newHistoryData = JSON.parse(completion.choices[0].message.content || "{}");

        // Determine if the document is older than 6 months
        const reportDate = document.reportDate;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const isOld = reportDate ? new Date(reportDate) < sixMonthsAgo : false;

        // 4. Update or Create TreatmentHistory in DB
        const existingHistory = await prisma.treatmentHistory.findUnique({
          where: {
            patientName_dob_claimNumber_physicianId: {
              patientName: document.patientName as string,
              dob: document.dob || null,
              claimNumber: document.claimNumber || null,
              physicianId: document.physicianId || null,
            },
          },
        });

        if (existingHistory) {
          const mergedData = { ...(existingHistory.historyData as any) };

          Object.keys(newHistoryData).forEach((system) => {
            if (!mergedData[system]) {
              mergedData[system] = { current: [], archive: [] };
            }

            const newCurrent = newHistoryData[system].current || [];
            const newArchive = newHistoryData[system].archive || [];

            if (isOld) {
              // If document is old, add everything to archive, don't touch current
              mergedData[system].archive = [
                ...newCurrent,
                ...newArchive,
                ...(mergedData[system].archive || []),
              ].slice(0, 100);
            } else {
              // If document is recent, move old current to archive and set new current
              if (newCurrent.length > 0) {
                const oldCurrent = mergedData[system].current || [];
                mergedData[system].archive = [
                  ...oldCurrent,
                  ...newArchive,
                  ...(mergedData[system].archive || []),
                ].slice(0, 100);
                mergedData[system].current = newCurrent;
              } else {
                // Just add new archive entries if no new current
                mergedData[system].archive = [
                  ...newArchive,
                  ...(mergedData[system].archive || []),
                ].slice(0, 100);
              }
            }
          });

          await prisma.treatmentHistory.update({
            where: { id: existingHistory.id },
            data: {
              historyData: mergedData,
              documentId: document.id,
            },
          });
        } else {
          // If creating new history, respect the 6-month rule
          const initialData = { ...newHistoryData };
          if (isOld) {
            Object.keys(initialData).forEach((system) => {
              const current = initialData[system].current || [];
              const archive = initialData[system].archive || [];
              initialData[system].archive = [...current, ...archive];
              initialData[system].current = [];
            });
          }

          await prisma.treatmentHistory.create({
            data: {
              patientName: document.patientName as string,
              dob: document.dob || null,
              claimNumber: document.claimNumber || null,
              physicianId: document.physicianId || null,
              historyData: initialData,
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
      message: "Document verified and treatment history updated successfully.",
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}