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

interface ParsedIntakeData {
  keyPatientReportedChanges: string;
  systemInterpretation: string;
  keyFindings: string;
  adlEffectPoints: string[];
  intakePatientPoints: string[];
  generatedPoints: string[];
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

  return `
Analyze the following patient intake form submission and generate:

1. KEY PATIENT-REPORTED CHANGES: Write a narrative summary (2-3 sentences) describing what the patient reported since their last visit. Include medication refill status, new appointments, changes in ADLs, and therapy effects.

2. SYSTEM INTERPRETATION: Write exactly 2 clear, concise sentences. First sentence should flag clinically relevant changes. Second sentence should note correlation with exam findings and need for treatment modification or further evaluation.

3. KEY FINDINGS: Generate a narrative summary based on the intake data. Format as a paragraph describing key findings from the patient intake including condition/concerns, medication needs, appointment status, ADL changes, and pain levels.

4. ADL EFFECT POINTS: Generate 3-5 bullet points (one per line) describing ADL effects. Each point should be concise (5-10 words max). Use keywords like "decreased", "limited", "difficulty", "worse" for negative changes, and "improved", "better", "increased" for positive changes.

5. INTAKE PATIENT POINTS: Generate 3-5 bullet points (one per line) from patient intake. Each point should be concise (5-10 words max). Use keywords like "refill", "medication", "appointment", "consult", "pain", "worse", "better".

6. GENERATED POINTS: Generate a consolidated list of 3-5 key points for the dashboard. These should be short, actionable, and color-coded by intent (e.g., urgent/worse = red, improved = green, neutral/info = blue/amber).
   CRITICAL: Use ONLY the data provided below. If a field is "N/A" or "None", do not invent information. If the patient reports worsening symptoms, reflect that in the points.

Patient Intake Data:
- Patient Name: ${patientName}
- Medication Refill Needed: ${medRefillsRequested}
- New Appointments: ${newAppointmentsList || "None"}
- ADL State: ${adl?.state || "same"}
- ADL Changes: ${JSON.stringify(adl?.list || [])}
- Pain Level (before -> after): ${refill?.before || "N/A"} -> ${refill?.after || "N/A"}
- Therapies: ${JSON.stringify(therapies || [])}
- Body Areas: ${bodyAreas || "N/A"}
- Notes: ${notes || "None"}

Generate in this exact format:
KEY PATIENT-REPORTED CHANGES:
[Narrative summary]

SYSTEM INTERPRETATION:
[Sentence 1. Sentence 2.]

KEY FINDINGS:
[Narrative summary]

ADL EFFECT POINTS:
- Point 1
- Point 2
- Point 3

INTAKE PATIENT POINTS:
- Point 1
- Point 2
- Point 3

GENERATED POINTS:
- Point 1
- Point 2
- Point 3
`;
}

// --- Parsing Helpers ---

function parseAIContent(content: string): ParsedIntakeData {
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
            content: "You are a medical assistant. Provide structured narrative summaries and bullet points based on patient intake data.",
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

    const updateData = {
      dob: dob || null,
      doi: doi || null,
      documentId: document?.id || null,
      ...parsed,
      medRefillsRequested,
      newAppointments: newAppointmentsList,
      adlChanges: adlChangesText,
      intakeData: {
        ...normalizedBody,
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
      .sort((a: any, b: any) => new Date(b.reportDate!).getTime() - new Date(a.reportDate!).getTime())[0];

    if (latestDocument) {
      await processADLAnalysis(latestDocument, body).catch(console.error);
    }

    const result = await processPatientIntakeUpdate(latestDocument || null, body);

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
