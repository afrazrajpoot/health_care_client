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

    // 3. Generate Comprehensive Treatment History using OpenAI
    // Fetch ALL verified documents for this patient to build a complete history
    const patientDocuments = await prisma.document.findMany({
      where: {
        patientName: document.patientName,
        dob: document.dob,
        // We can optionally filter by claimNumber if strict matching is desired, 
        // but usually patientName + DOB is enough for history.
        // claimNumber: document.claimNumber 
        status: "verified"
      },
      orderBy: { reportDate: "desc" }, // Newest first
      take: 20, // Limit to last 20 documents to fit in context
      select: {
        reportDate: true,
        briefSummary: true,
        aiSummarizerText: true,
        physicianId: true, // Added
        bodyPartSnapshots: {
          select: {
            bodyPart: true,
            keyFindings: true,
            recommended: true,
            dx: true,
            consultingDoctor: true // Added
          }
        },
        documentSummary: {
          select: {
            summary: true
          }
        }
      }
    });

    // Construct a comprehensive context from all documents
    let allDocsContext = "";
    patientDocuments.forEach((doc, index) => {
      const date = doc.reportDate ? new Date(doc.reportDate).toISOString().split('T')[0] : "Unknown Date";
      const physician = doc.bodyPartSnapshots?.[0]?.consultingDoctor || doc.physicianId || "Unknown Physician";

      allDocsContext += `\n--- Document ${index + 1} (${date}) - Physician: ${physician} ---\n`;
      allDocsContext += `Summary: ${doc.briefSummary || doc.aiSummarizerText || doc.documentSummary?.summary || "No summary"}\n`;

      if (doc.bodyPartSnapshots && doc.bodyPartSnapshots.length > 0) {
        allDocsContext += "Clinical Details:\n";
        doc.bodyPartSnapshots.forEach(bp => {
          allDocsContext += `- ${bp.bodyPart || "General"}: ${bp.dx || ""} \n  Findings: ${bp.keyFindings || ""} \n  Recommendations: ${bp.recommended || ""}\n`;
        });
      }
    });

    if (allDocsContext) {
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
You are a medical data expert. Your task is to MAP the provided medical documents into a structured JSON format organized by Body System.

Input Documents (Newest to Oldest):
${allDocsContext}

For each Body System, you must create a list of entries corresponding to the documents that contain information about that system.
Do NOT synthesize or merge information across documents. Keep each document's data separate under the relevant system.

JSON Structure:
{
  "musculoskeletal_system": [
    {
      "report_date": "YYYY-MM-DD",
      "physician": "Dr. Name",
      "content": [
        { 
          "field": "findings", 
          "collapsed": "Short summary of finding", 
          "expanded": "Detailed description. Use bullet points starting with '- ' for lists." 
        },
        { 
          "field": "recommendations", 
          "collapsed": "Short summary of recommendation", 
          "expanded": "Detailed plan. Use bullet points starting with '- ' for lists." 
        }
      ]
    }
  ],
  "cardiovascular_system": [],
  "pulmonary_respiratory": [],
  "neurological": [],
  "gastrointestinal": [],
  "metabolic_endocrine": [],
  "general_treatments": [],
  "other_systems": [],
  "psychiatric_mental_health": [],
  "dental_oral": [],
  "dermatological": [],
  "ent_head_neck": [],
  "genitourinary_renal": [],
  "hematologic_lymphatic": [],
  "immune_allergy": [],
  "ophthalmologic": [],
  "reproductive_obstetric_gynecologic": [],
  "sleep_disorders": []
}

Rules:
1. **Map Data Only**: Do not generate new insights. Extract exactly what is in the documents.
2. **Order**: Maintain the chronological order of reports (Newest first).
3. **Fields**: Use standard keys for "field" like: "findings", "diagnosis", "recommendations", "work_status", "mmi_status".
4. **Content**: 
   - "collapsed": A concise 1-line summary.
   - "expanded": The full details. **IMPORTANT**: If there are multiple points, format them as a list where each line starts with "- ".
5. If a document has no relevant info for a system, do not create an entry for it in that system.
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

        const newHistoryData = JSON.parse(completion.choices[0].message.content || "{}");

        // 4. Update or Create TreatmentHistory in DB (Overwrite with new comprehensive history)
        // We use upsert to either create or update the single history record for this patient/physician
        await prisma.treatmentHistory.upsert({
          where: {
            patientName_dob_claimNumber_physicianId: {
              patientName: document.patientName as string,
              dob: document.dob || null,
              claimNumber: document.claimNumber || null,
              physicianId: document.physicianId || null,
            },
          },
          update: {
            historyData: newHistoryData,
            documentId: document.id, // Link to the latest document that triggered this update
          },
          create: {
            patientName: document.patientName as string,
            dob: document.dob || null,
            claimNumber: document.claimNumber || null,
            physicianId: document.physicianId || null,
            historyData: newHistoryData,
            documentId: document.id,
          },
        });

      } catch (openaiError) {
        console.error("Error generating treatment history with OpenAI:", openaiError);
        // Continue without failing the verification if OpenAI fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document verified and comprehensive treatment history generated.",
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}