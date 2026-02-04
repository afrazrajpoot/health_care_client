// app/api/patient-intake-update/route.ts
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { AzureOpenAI } from "openai";

// --- Types & Interfaces ---

interface IntakeBody {
  patientName: string;
  dob: string;
  claimNumber?: string;
  doi?: string;
  language?: string;
  bodyAreas?: string;
  newAppointments?: Array<{ type: string }>;
  refill?: {
    needed: boolean;
    before?: string;
    after?: string;
  };
  adl?: {
    state: "better" | "worse" | "same";
    list: string[];
  };
  therapies?: any[];
  notes?: string;
}

interface DetailedShortSummary {
  header: {
    date: string;
    title: string;
    author: string;
    disclaimer: string;
    source_type: string;
  };
  summary: {
    items: Array<{
      field: string;
      expanded: string;
      collapsed: string;
      context_expansion: Array<{
        bullet: string;
        context: string;
        confidence: number;
      }>;
    }>;
  };
}

interface ParsedIntakeData {
  keyPatientReportedChanges: string;
  systemInterpretation: string;
  keyFindings: string;
  adlEffectPoints: string[];
  intakePatientPoints: string[];
  generatedPoints: string[];
  // These will be stored in the intakeData JSON instead of separate columns
  longSummary?: string;
  shortSummaryJson?: DetailedShortSummary;
  reportTitle?: string;
}

// --- OpenAI Client Helper ---

function getOpenAIClient(): OpenAI | AzureOpenAI {
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const standardApiKey = process.env.OPENAI_API_KEY;

  if (azureApiKey && azureEndpoint && azureDeployment) {
    return new AzureOpenAI({
      apiKey: azureApiKey,
      endpoint: azureEndpoint,
      deployment: azureDeployment,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    });
  }

  const apiKey = standardApiKey || azureApiKey;
  if (!apiKey) {
    throw new Error("Missing OpenAI API Key");
  }

  return new OpenAI({
    apiKey: apiKey,
  });
}

// --- Prompt Helpers ---

function generateIntakeAnalysisPrompt(body: IntakeBody, medRefillsRequested: string, newAppointmentsList: string | null): string {
  const { patientName, bodyAreas, adl, refill, therapies, notes } = body;
  const today = new Date().toISOString().split('T')[0];

  return `
Analyze the following patient intake form submission for "${patientName}".
Current Date: ${today}

Patient Intake Data:
- Body Areas: ${bodyAreas || "N/A"}
- Medication Refill Needed: ${medRefillsRequested}
- New Appointments: ${newAppointmentsList || "None"}
- ADL State: ${adl?.state || "same"}
- ADL Changes: ${JSON.stringify(adl?.list || [])}
- Pain Level (before -> after): ${refill?.before || "N/A"} -> ${refill?.after || "N/A"}
- Therapies: ${JSON.stringify(therapies || [])}
- Notes: ${notes || "None"}

Generate a comprehensive medical analysis and return it strictly as a JSON object with the following fields:

1. "long_summary": A detailed, professional narrative medical report (approx 300-500 words) using formal medical terminology, formatted with markdown.
2. "short_summary": {
    "header": {
      "date": "${today}",
      "title": "[Generate a professional medical title based on findings]",
      "author": "AI Medical Assistant",
      "disclaimer": "This document is a restatement of the patient intake data and adheres to strict medical reporting standards.",
      "source_type": "Patient Intake Form"
    },
    "summary": {
      "items": [
        {
          "field": "assessment",
          "expanded": "Detailed assessment bullets based on intake findings.",
          "collapsed": "Concise assessment summary.",
          "context_expansion": [
            { "bullet": "Finding 1", "context": "Supporting snippet from intake", "confidence": 0.9 }
          ]
        },
        {
          "field": "plan",
          "expanded": "Detailed plan bullets (medications, apps, therapies).",
          "collapsed": "Concise plan summary.",
          "context_expansion": [...]
        },
        {
          "field": "pertinent_exam",
          "expanded": "Bullets describing patient-reported symptoms and functional status.",
          "collapsed": "Concise functional summary.",
          "context_expansion": [...]
        },
        {
          "field": "medication_changes",
          "expanded": "Refill needs and pain management details.",
          "collapsed": "Medication status summary.",
          "context_expansion": [...]
        },
        {
          "field": "chief_complaint",
          "expanded": "Detailed complaint bullets based on body areas and notes.",
          "collapsed": "Concise complaint summary.",
          "context_expansion": [...]
        }
      ]
    },
    "_context_expansion_metadata": { "total_items": 5, "expansion_enabled": true, "items_with_context": 5 }
  }

3. "keyPatientReportedChanges": Narrative summary (2-3 sentences).
4. "systemInterpretation": Exactly 2 clear sentences.
5. "keyFindings": Narrative summary paragraph.
6. "adlEffectPoints": List of 3-5 concise bullets.
7. "intakePatientPoints": List of 3-5 concise bullets.
8. "generatedPoints": List of 3-5 color-coded actionable points.

CRITICAL: Return ONLY raw JSON. No markdown formatting blocks or extra text.
`;
}

// --- Parsing Helpers ---

function parseAIContent(content: string): ParsedIntakeData {
  try {
    // Attempt to parse as JSON first
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanContent);

    return {
      keyPatientReportedChanges: data.keyPatientReportedChanges || "",
      systemInterpretation: data.systemInterpretation || "",
      keyFindings: data.keyFindings || "",
      adlEffectPoints: data.adlEffectPoints || [],
      intakePatientPoints: data.intakePatientPoints || [],
      generatedPoints: data.generatedPoints || [],
      longSummary: data.long_summary || "",
      shortSummaryJson: data.short_summary || null,
      reportTitle: data.short_summary?.header?.title || data.reportTitle || "",
    };
  } catch (e) {
    console.error("Failed to parse AI response as JSON, falling back to regex:", e);

    const extractSection = (regex: RegExp) => {
      const match = content.match(regex);
      return match ? match[1].trim() : "";
    };

    const extractPoints = (regex: RegExp) => {
      const match = content.match(regex);
      if (!match) return [];
      return match[1]
        .split('\n')
        .map((line: string) => line.replace(/^[-•]\s*/, '').trim())
        .filter((line: string) => line.length > 0);
    };

    return {
      keyPatientReportedChanges: extractSection(/KEY PATIENT-REPORTED CHANGES:?\s*([\s\S]+?)(?=SYSTEM INTERPRETATION:?|$)/i),
      systemInterpretation: extractSection(/SYSTEM INTERPRETATION:?\s*([\s\S]+?)(?=KEY FINDINGS:?|ADL EFFECT POINTS:?|$)/i),
      keyFindings: extractSection(/KEY FINDINGS:?\s*([\s\S]+?)(?=ADL EFFECT POINTS:?|INTAKE PATIENT POINTS:?|$)/i),
      adlEffectPoints: extractPoints(/ADL EFFECT POINTS:?\s*([\s\S]+?)(?=INTAKE PATIENT POINTS:?|$)/i),
      intakePatientPoints: extractPoints(/INTAKE PATIENT POINTS:?\s*([\s\S]+?)(?=GENERATED POINTS:?|$)/i),
      generatedPoints: extractPoints(/GENERATED POINTS:?\s*([\s\S]+?)$/i),
    };
  }
}

// --- Core Logic Functions ---

async function processADLAnalysis(latestDocument: { id: string }, body: IntakeBody) {
  try {
    const { bodyAreas, language, newAppointments, refill, adl, therapies } = body;

    const painLevel = refill ? `${refill.before || "N/A"} -> ${refill.after || "N/A"}` : "N/A";
    const symptomTrend = adl?.state || "N/A";
    const patientSelectedADLs = adl?.list || [];
    const appointmentsAttended = newAppointments || [];
    const therapyEffects = therapies || [];

    const prompt = `
Based on the patient's intake form responses, determine which ADL activities are affected and what work restrictions apply.

Patient Information:
- Body Areas: ${bodyAreas || "N/A"}
- Language: ${language}
- Pain Level (before -> after medication): ${painLevel}
- Symptom Trend (from ADLs): ${symptomTrend}
- Patient Selected ADLs: ${JSON.stringify(patientSelectedADLs)}
- New Appointments: ${JSON.stringify(appointmentsAttended)}
- Therapies and Effects: ${JSON.stringify(therapyEffects)}

Task: Generate 2 lines based on the data above.
Line 1: Affected daily activities (short phrases, comma separated)
Line 2: Work restrictions (short phrases, comma separated)

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending
`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: 'You are a medical ADL analyzer. Output exactly 2 lines with comma-separated short phrases only.',
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      const lines = content.split("\n").map((l: string) => l.trim()).filter((l: string) => l);
      if (lines.length >= 2) {
        await prisma.aDL.upsert({
          where: { documentId: latestDocument.id },
          update: { adlsAffected: lines[0], workRestrictions: lines[1] },
          create: { adlsAffected: lines[0], workRestrictions: lines[1], documentId: latestDocument.id },
        });
      }
    }
  } catch (error) {
    console.error("Error in ADL analysis:", error);
  }
}

async function processPatientIntakeUpdate(document: { id: string } | null, body: any) {
  const OPENAI_TIMEOUT_MS = 25000;

  try {
    await ensurePrismaConnection();
    const openai = getOpenAIClient();

    // Normalize body data (handle nested structures)
    const patientName = body.patientName || body.patient?.name || body.name;
    const dob = body.dob || body.patient?.dob || body.patient?.date_of_birth || body.date_of_birth;
    const claimNumber = body.claimNumber || body.claim?.claim_number || body.claim?.number || body.claim;
    const doi = body.doi || body.claim?.doi || body.date_of_injury;
    const language = body.language || body.lang || body.patient?.language || 'en';
    const bodyAreas = body.bodyAreas || body.areas;
    const newAppointments = body.newAppointments || body.appointments;
    const refill = body.refill || body.medications;
    const adl = body.adl || body.activities;
    const therapies = body.therapies || body.treatments;
    const notes = body.notes;

    console.log("📝 Processing intake update for:", { patientName, dob, claimNumber });

    const medRefillsRequested = refill?.needed ? "Yes" : "No";
    const newAppointmentsList = Array.isArray(newAppointments) && newAppointments.length > 0
      ? newAppointments.map((apt: any) => apt.type || "Unknown").join(", ")
      : null;

    let adlChangesText = null;
    if (adl?.state && adl.state !== "same") {
      const adlList = Array.isArray(adl.list) ? adl.list : [];
      if (adlList.length > 0) {
        const direction = adl.state === "better" ? "↑" : adl.state === "worse" ? "↓" : "";
        adlChangesText = `${adlList[0]} ${direction}`.trim();
      }
    }

    const normalizedBody: IntakeBody = {
      patientName, dob, claimNumber, doi, language, bodyAreas,
      newAppointments, refill, adl, therapies, notes
    };

    const prompt = generateIntakeAnalysisPrompt(normalizedBody, medRefillsRequested, newAppointmentsList);

    const intakeCompletion = await Promise.race([
      openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a medical assistant. Provide structured narrative summaries and bullet points based on patient intake data. Also suggest a key concern for the clinical summary.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OpenAI call timeout')), OPENAI_TIMEOUT_MS))
    ]);

    const content = intakeCompletion.choices[0]?.message?.content?.trim() || "";
    console.log("🤖 AI Response Content:", content);

    const parsed = parseAIContent(content);

    // Fallbacks if parsing fails or returns empty
    if (!parsed.keyPatientReportedChanges) {
      parsed.keyPatientReportedChanges = "No significant changes reported by the patient.";
    }

    if (!parsed.systemInterpretation) {
      parsed.systemInterpretation = "Clinically stable. Continue current treatment plan.";
    }

    if (!parsed.keyFindings) {
      const adlStatus = adl?.state === 'worse' ? 'worsening' : adl?.state === 'better' ? 'improving' : 'stable';
      parsed.keyFindings = `Patient reports ${bodyAreas || 'body area'} concerns with ${adlStatus} ADL status. ${medRefillsRequested === 'Yes' ? 'Medication refill requested.' : 'No medication refills needed.'} ${newAppointmentsList ? `New appointments: ${newAppointmentsList}.` : 'No new appointments reported.'}`;
    }

    // --- Update Document and Create extra data (Task and Summary Snapshot) ---
    if (document) {
      try {
        // Update the Document record with target JSON structure for whatsNew
        const whatsNewData = {
          long_summary: parsed.longSummary,
          short_summary: parsed.shortSummaryJson,
          generated_points: parsed.generatedPoints // Ensure chips are included here
        };

        await prisma.document.update({
          where: { id: document.id },
          data: {
            whatsNew: whatsNewData as any,
            briefSummary: parsed.reportTitle || parsed.keyFindings,
            aiSummarizerText: parsed.longSummary || undefined,
            status: "Intake Received",
          },
        });

        // Create a task for staff to review the intake
        await prisma.task.create({
          data: {
            description: `Review Intake: ${parsed.systemInterpretation}`,
            department: "Clinical",
            status: "Pending",
            patient: patientName,
            documentId: document.id,
            claimNumber: claimNumber || null,
            type: "internal",
            reason: "Patient Intake Submitted",
          },
        });

        // Update SummarySnapshot with key concern from intake
        const keyConcern = parsed.keyFindings.split(".")[0]; // Use first sentence as key concern
        await prisma.summarySnapshot.upsert({
          where: { documentId: document.id },
          update: {
            keyConcern: keyConcern,
            clinicalSummary: parsed.systemInterpretation,
          },
          create: {
            documentId: document.id,
            keyConcern: keyConcern,
            clinicalSummary: parsed.systemInterpretation,
            dx: "Review intake data",
            nextStep: "Consultation",
          },
        });
      } catch (extraDataError) {
        console.error("Failed to update link/create extra intake data:", extraDataError);
      }
    }

    const { shortSummaryJson, longSummary, reportTitle, ...summaryData } = parsed;

    const updateData = {
      dob: dob || null,
      doi: doi || null,
      documentId: document?.id || null,
      ...summaryData,
      medRefillsRequested,
      newAppointments: newAppointmentsList,
      adlChanges: adlChangesText,
      intakeData: {
        ...normalizedBody,
        shortSummary: shortSummaryJson,
        longSummary: longSummary,
        reportTitle: reportTitle,
        timestamp: new Date().toISOString()
      },
    };

    return await Promise.race([
      upsertIntakeRecordWithData(normalizedBody, updateData),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database operation timeout')), 5000))
    ]);

  } catch (error: any) {
    console.error('Patient intake update failed:', error);
    try {
      await ensurePrismaConnection();
      return await prisma.patientIntakeUpdate.create({
        data: {
          patientName: body.patientName,
          dob: body.dob,
          claimNumber: body.claimNumber || null,
          intakeData: {
            language: 'en',
            notes: body.notes || null,
            error: error.message,
            status: 'failed',
            timestamp: new Date().toISOString()
          },
        },
      });
    } catch (dbError) {
      console.error('Failed to save error record:', dbError);
      throw error;
    }
  }
}

async function upsertIntakeRecordWithData(body: IntakeBody, updateData: any) {
  const { patientName, dob, claimNumber } = body;

  const existing = await prisma.patientIntakeUpdate.findFirst({
    where: { patientName, dob, claimNumber: claimNumber || null },
  });

  if (existing) {
    return await prisma.patientIntakeUpdate.update({
      where: { id: existing.id },
      data: { ...updateData, updatedAt: new Date() },
    });
  } else {
    return await prisma.patientIntakeUpdate.create({
      data: { patientName, claimNumber: claimNumber || null, ...updateData },
    });
  }
}

async function createFallbackIntakeUpdate(body: IntakeBody) {
  const { patientName, dob, notes, claimNumber } = body;

  const fallbackData = {
    summary: "Analysis timed out - using basic patient information",
    patientName,
    language: 'en',
    notes: notes || null,
    timestamp: new Date().toISOString(),
    status: 'timeout_fallback'
  };

  const existing = await prisma.patientIntakeUpdate.findFirst({
    where: { patientName, dob, claimNumber: claimNumber || null },
  });

  if (existing) {
    return await prisma.patientIntakeUpdate.update({
      where: { id: existing.id },
      data: { intakeData: fallbackData, updatedAt: new Date() },
    });
  } else {
    return await prisma.patientIntakeUpdate.create({
      data: { patientName, dob, claimNumber: claimNumber || null, intakeData: fallbackData },
    });
  }
}

// --- Route Handlers ---

export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnection();
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName") || searchParams.get("patient_name");
    const dob = searchParams.get("dob");
    const claimNumber = searchParams.get("claimNumber") || searchParams.get("claim_number");

    if (!patientName) {
      return NextResponse.json({ error: "Patient Name is required" }, { status: 400 });
    }

    const whereClause: any = {
      patientName: { equals: patientName, mode: "insensitive" },
    };

    if (dob) {
      const cleanDob = dob.split("T")[0].trim();
      const possibleDobs = new Set<string>();
      possibleDobs.add(cleanDob);

      const isoMatch = cleanDob.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      const otherMatch = cleanDob.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

      if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        const mm = m.padStart(2, '0');
        const dd = d.padStart(2, '0');
        possibleDobs.add(`${y}-${mm}-${dd}`);
        possibleDobs.add(`${mm}-${dd}-${y}`);
        possibleDobs.add(`${mm}/${dd}/${y}`);
      } else if (otherMatch) {
        const [_, p1, p2, y] = otherMatch;
        const v1 = p1.padStart(2, '0');
        const v2 = p2.padStart(2, '0');
        possibleDobs.add(`${v1}-${v2}-${y}`);
        possibleDobs.add(`${v1}/${v2}/${y}`);
        possibleDobs.add(`${y}-${v1}-${v2}`);
        possibleDobs.add(`${v2}-${v1}-${y}`);
        possibleDobs.add(`${v2}/${v1}/${y}`);
        possibleDobs.add(`${y}-${v2}-${v1}`);
      }
      whereClause.OR = Array.from(possibleDobs).map(d => ({ dob: d }));
    }

    if (claimNumber && claimNumber !== "Not specified") {
      whereClause.claimNumber = claimNumber;
    }

    const intakeUpdate = await prisma.patientIntakeUpdate.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        document: { select: { id: true, patientName: true, createdAt: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: intakeUpdate,
      message: intakeUpdate ? undefined : "No intake updates found for this patient",
    });
  } catch (error) {
    console.error("Error fetching patient intake update:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnection();
    const body: any = await request.json();

    // Normalize body for initial check and document lookup
    const patientName = body.patientName || body.patient?.name || body.name;
    const dob = body.dob || body.patient?.dob || body.patient?.date_of_birth || body.date_of_birth;
    const claimNumber = body.claimNumber || body.claim?.claim_number || body.claim?.number || body.claim;

    if (!patientName) {
      return NextResponse.json({ error: "Patient Name is required" }, { status: 400 });
    }

    const patientDocuments = await prisma.document.findMany({
      where: { patientName, dob, claimNumber: claimNumber || undefined },
      include: {
        adl: true,
        bodyPartSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const latestDocument = patientDocuments
      .filter((doc: any) => doc.reportDate)
      .sort((a: any, b: any) => new Date(b.reportDate!).getTime() - new Date(a.reportDate!).getTime())[0]
      || patientDocuments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    let targetDocument = latestDocument;

    if (!targetDocument) {
      console.log("🆕 New patient detected, creating initial document record from intake");
      const doi = body.doi || body.claim?.doi || body.date_of_injury || new Date().toISOString().split('T')[0];
      const claim = claimNumber || body.claim?.claim_number || "N/A";

      targetDocument = await prisma.document.create({
        data: {
          patientName,
          dob: dob || null,
          doi: doi,
          claimNumber: claim,
          status: "Pending Intake",
          gcsFileLink: "intake-form-only",
          mode: "wc",
          reportDate: new Date(),
        }
      });
    }

    if (targetDocument) {
      await processADLAnalysis(targetDocument, body).catch(console.error);
    }

    const result = await processPatientIntakeUpdate(targetDocument, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Submission processed successfully."
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
