// app/api/patient-intake-update/route.ts
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { AzureOpenAI } from "openai";

// Helper to get OpenAI client
function getOpenAIClient() {
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

// Helper to handle PatientIntakeUpdate
async function upsertPatientIntakeUpdate(
  prisma: any,
  openai: OpenAI,
  latestDocument: any,
  body: any
) {
  try {
    const {
      patientName,
      dob,
      claimNumber,
      doi,
      language,
      bodyAreas,
      newAppointments,
      refill,
      adl,
      therapies,
    } = body;

    // Extract tags/pills data
    const medRefillsRequested = refill?.needed ? "Yes" : "No";
    const newAppointmentsList = Array.isArray(newAppointments) && newAppointments.length > 0
      ? newAppointments.map((apt: any) => apt.type || "Unknown").join(", ")
      : null;

    // Determine ADL changes
    let adlChangesText = null;
    if (adl?.state && adl.state !== "same") {
      const adlList = Array.isArray(adl.list) ? adl.list : [];
      if (adlList.length > 0) {
        const direction = adl.state === "better" ? "↑" : adl.state === "worse" ? "↓" : "";
        adlChangesText = `${adlList[0]} ${direction}`.trim();
      }
    }

    // Prepare intake data for AI analysis
    const intakeAnalysisPrompt = `
Analyze the following patient intake form submission and generate:

1. KEY PATIENT-REPORTED CHANGES: Write a narrative summary (2-3 sentences) describing what the patient reported since their last visit. Include:
   - Medication refill status (whether needed or not)
   - New appointments that occurred
   - Changes in activities of daily living (ADLs) compared to prior visit
   - Any therapy effects if mentioned
   
   Example: "Since the last visit, the patient reports no need for medication refills. One new appointment occurred (orthopedic consultation). Patient reports a decline in grip-related activities of daily living compared to the prior visit."

2. SYSTEM INTERPRETATION: Write exactly 2 clear, concise sentences. First sentence should flag clinically relevant changes. Second sentence should note correlation with exam findings and need for treatment modification or further evaluation.
   Example: "Changes flagged as clinically relevant. Consider correlation with exam findings, treatment response, and need for treatment modification or further evaluation."

3. KEY FINDINGS: Generate a narrative summary based on the intake data. Format as a paragraph describing key findings from the patient intake. Include:
   - Patient's reported condition/concerns
   - Medication needs
   - Appointment status
   - ADL changes
   - Pain levels if relevant
   
   Example: "Patient reports ${bodyAreas || 'body area'} concerns with ${adl?.state === 'worse' ? 'worsening' : adl?.state === 'better' ? 'improving' : 'stable'} ADL status. ${medRefillsRequested === 'Yes' ? 'Medication refill requested.' : 'No medication refills needed.'} ${newAppointmentsList ? `New appointments: ${newAppointmentsList}.` : 'No new appointments reported.'}"

4. ADL EFFECT POINTS: Generate 3-5 bullet points (one per line) describing ADL effects. Each point should be concise (5-10 words max). Use keywords like "decreased", "limited", "difficulty", "worse" for negative changes, and "improved", "better", "increased" for positive changes.
   Example:
   - Grip strength decreased
   - Walking distance limited
   - Dressing difficulty increased

5. INTAKE PATIENT POINTS: Generate 3-5 bullet points (one per line) from patient intake. Each point should be concise (5-10 words max). Use keywords like "refill", "medication", "appointment", "consult", "pain", "worse", "better".
   Example:
   - Med refill requested
   - New ortho consult scheduled
   - Pain level improved after medication

6. GENERATED POINTS: Generate a consolidated list of 3-5 key points for the dashboard. These should be short, actionable, and color-coded by intent (e.g., urgent/worse = red, improved = green, neutral/info = blue/amber).
   Example:
   - Pain worsened (Red)
   - Med refill needed (Blue)
   - ADLs improved (Green)

Patient Intake Data:
- Patient Name: ${patientName}
- Medication Refill Needed: ${medRefillsRequested}
- New Appointments: ${newAppointmentsList || "None"}
- ADL State: ${adl?.state || "same"}
- ADL Changes: ${JSON.stringify(adl?.list || [])}
- Pain Level (before -> after): ${refill?.before || "N/A"} -> ${refill?.after || "N/A"}
- Therapies: ${JSON.stringify(therapies || [])}
- Body Areas: ${bodyAreas || "N/A"}

Generate in this exact format:
KEY PATIENT-REPORTED CHANGES:
[Narrative summary - 2-3 sentences describing patient-reported changes since last visit]

SYSTEM INTERPRETATION:
[Sentence 1. Sentence 2.]

KEY FINDINGS:
[Narrative summary based on intake data - describe key findings from patient intake]

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

    const intakeCompletion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical assistant. For KEY PATIENT-REPORTED CHANGES: write a narrative summary (2-3 sentences) describing patient-reported changes since last visit. For SYSTEM INTERPRETATION: write exactly 2 clear sentences. For KEY FINDINGS: write a narrative summary based on intake data. For points: use bullet format.",
        },
        { role: "user", content: intakeAnalysisPrompt },
      ],
      temperature: 0.3,
    });

    let keyPatientReportedChanges = "";
    let systemInterpretation = "";
    let keyFindings = "";
    let adlEffectPoints: string[] = [];
    let intakePatientPoints: string[] = [];

    const content = intakeCompletion.choices[0].message.content?.trim() || "";

    // Parse KEY PATIENT-REPORTED CHANGES
    const keyChangesMatch = content.match(/KEY PATIENT-REPORTED CHANGES:\s*([\s\S]+?)(?=SYSTEM INTERPRETATION:|$)/);
    if (keyChangesMatch) {
      keyPatientReportedChanges = keyChangesMatch[1].trim();
    }

    // Parse SYSTEM INTERPRETATION (2 sentences)
    const systemMatch = content.match(/SYSTEM INTERPRETATION:\s*([\s\S]+?)(?=KEY FINDINGS:|ADL EFFECT POINTS:|$)/);
    if (systemMatch) {
      systemInterpretation = systemMatch[1].trim();
    }

    // Parse KEY FINDINGS
    const keyFindingsMatch = content.match(/KEY FINDINGS:\s*([\s\S]+?)(?=ADL EFFECT POINTS:|INTAKE PATIENT POINTS:|$)/);
    if (keyFindingsMatch) {
      keyFindings = keyFindingsMatch[1].trim();
    }

    // Parse ADL EFFECT POINTS
    const adlMatch = content.match(/ADL EFFECT POINTS:\s*([\s\S]+?)(?=INTAKE PATIENT POINTS:|$)/);
    if (adlMatch) {
      adlEffectPoints = adlMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Parse INTAKE PATIENT POINTS
    const intakeMatch = content.match(/INTAKE PATIENT POINTS:\s*([\s\S]+?)(?=GENERATED POINTS:|$)/);
    if (intakeMatch) {
      intakePatientPoints = intakeMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Parse GENERATED POINTS
    let generatedPoints: string[] = [];
    const generatedMatch = content.match(/GENERATED POINTS:\s*([\s\S]+?)$/);
    if (generatedMatch) {
      generatedPoints = generatedMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Fallback if parsing fails
    if (!keyPatientReportedChanges && !systemInterpretation) {
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        keyPatientReportedChanges = lines[0].replace(/^KEY PATIENT-REPORTED CHANGES:\s*/i, '').trim();
        systemInterpretation = lines[1].replace(/^SYSTEM INTERPRETATION:\s*/i, '').trim();
      }
    }

    // Fallback for key findings if not parsed
    if (!keyFindings) {
      const adlStatus = adl?.state === 'worse' ? 'worsening' : adl?.state === 'better' ? 'improving' : 'stable';
      const medStatus = medRefillsRequested === 'Yes' ? 'Medication refill requested.' : 'No medication refills needed.';
      const apptStatus = newAppointmentsList ? `New appointments: ${newAppointmentsList}.` : 'No new appointments reported.';
      keyFindings = `Patient reports ${bodyAreas || 'body area'} concerns with ${adlStatus} ADL status. ${medStatus} ${apptStatus}`;
    }

    // Build whereClause with DOB fix
    const whereClause: any = {
      patientName: {
        equals: patientName,
        mode: "insensitive",
      },
    };

    if (dob) {
      whereClause.dob = dob;
    }

    if (claimNumber && claimNumber !== "Not specified") {
      whereClause.claimNumber = claimNumber;
    } else {
      whereClause.claimNumber = null;
    }

    const updateData = {
      dob: dob || null,
      doi: doi || null,
      documentId: latestDocument?.id || null,
      keyPatientReportedChanges,
      systemInterpretation,
      keyFindings,
      adlEffectPoints,
      intakePatientPoints,
      generatedPoints,
      medRefillsRequested,
      newAppointments: newAppointmentsList,
      adlChanges: adlChangesText,
      intakeData: {
        newAppointments,
        refill,
        adl,
        therapies,
        bodyAreas,
        language,
      },
    };

    const existingUpdate = await (prisma as any).patientIntakeUpdate.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (existingUpdate) {
      await (prisma as any).patientIntakeUpdate.update({
        where: { id: existingUpdate.id },
        data: updateData,
      });
    } else {
      await (prisma as any).patientIntakeUpdate.create({
        data: {
          patientName,
          claimNumber: claimNumber || null,
          ...updateData,
        },
      });
    }
  } catch (error) {
    console.error("Error in upsertPatientIntakeUpdate:", error);
  }
}

// Separate async function for ADL analysis with timeout
async function processADLAnalysis(latestDocument: any, body: any) {
  try {
    const {
      bodyAreas,
      language,
      newAppointments,
      refill,
      adl,
      therapies,
    } = body;

    const painLevel = refill
      ? `${refill.before || "N/A"} -> ${refill.after || "N/A"}`
      : "N/A";
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

Line 1 Format: List affected daily activities as short phrases (e.g., "dressing, bathing, walking, climbing stairs")
Line 2 Format: List work restrictions as short phrases (e.g., "lifting heavy objects, prolonged standing, driving long distances")

Rules:
- Use ONLY short noun phrases separated by commas
- NO complete sentences, NO words like "may", "patient", "restrictions in", "unable to"
- Just list the activities/restrictions directly
- Base affected ADLs on patient selected list and symptom trend (e.g., if "better", focus on improved ones; if "worse", emphasize impacts)
- If pain is high (before > 5) or therapies show positive effects (e.g., "Much Better" or "Slightly Better"), reduce restrictions or emphasize improvements; if "No Change" or negative, maintain or increase restrictions
- Explicitly consider therapy effects: For each therapy with positive rating, incorporate relief in restrictions (e.g., if Physical Therapy is "Much Better", reduce "prolonged standing")
- Include body areas in restrictions if relevant (e.g., "neck strain" for neck issues)

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending

Output your 2 lines now:
      `;

    const openai = getOpenAIClient();

    // Add timeout for OpenAI call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("OpenAI request timeout")), 30000); // 30 second timeout
    });

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You are a medical ADL analyzer. Output exactly 2 lines with comma-separated short phrases only. Analyze the patient data provided and list: Line 1 = affected daily activities, Line 2 = work restrictions. Use direct phrases like "lifting heavy objects" not sentences like "patient cannot lift". Prioritize therapy effects in adjusting restrictions.',
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200, // Limit response size
      }),
      timeoutPromise
    ]) as any;

    let adlsAffected = "";
    let workRestrictions = "";

    if (completion && completion.choices && completion.choices[0]) {
      const content = completion.choices[0].message.content?.trim();
      if (content) {
        const lines = content
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line);
        if (lines.length >= 2) {
          adlsAffected = lines[0];
          workRestrictions = lines[1];
        }
      }
    }

    await prisma.aDL.upsert({
      where: {
        documentId: latestDocument.id,
      },
      update: {
        adlsAffected,
        workRestrictions,
      },
      create: {
        adlsAffected,
        workRestrictions,
        documentId: latestDocument.id,
      },
    });

  } catch (error) {
    console.error("Error in ADL analysis:", error);
    // Don't throw - we don't want to fail the main request
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    await ensurePrismaConnection();

    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName") || searchParams.get("patient_name");
    const dob = searchParams.get("dob");
    const claimNumber = searchParams.get("claimNumber") || searchParams.get("claim_number");

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      patientName: {
        equals: patientName,
        mode: "insensitive",
      },
    };

    if (dob) {
      // Flexible DOB matching to handle various formats (ISO, US, etc.)
      const cleanDob = dob.split("T")[0].trim();
      const possibleDobs = new Set<string>();
      possibleDobs.add(cleanDob);

      // Try to parse YYYY-MM-DD
      const isoMatch = cleanDob.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      // Try to parse MM-DD-YYYY or DD-MM-YYYY
      const otherMatch = cleanDob.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

      if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        const mm = m.padStart(2, '0');
        const dd = d.padStart(2, '0');
        possibleDobs.add(`${y}-${mm}-${dd}`); // YYYY-MM-DD
        possibleDobs.add(`${mm}-${dd}-${y}`); // MM-DD-YYYY
        possibleDobs.add(`${mm}/${dd}/${y}`); // MM/DD/YYYY
      } else if (otherMatch) {
        const [_, p1, p2, y] = otherMatch;
        const v1 = p1.padStart(2, '0');
        const v2 = p2.padStart(2, '0');

        // Add variations to cover MM-DD and DD-MM
        possibleDobs.add(`${v1}-${v2}-${y}`);
        possibleDobs.add(`${v1}/${v2}/${y}`);
        possibleDobs.add(`${y}-${v1}-${v2}`);

        // Swapped
        possibleDobs.add(`${v2}-${v1}-${y}`);
        possibleDobs.add(`${v2}/${v1}/${y}`);
        possibleDobs.add(`${y}-${v2}-${v1}`);
      }

      whereClause.OR = Array.from(possibleDobs).map(d => ({ dob: d }));
    }

    if (claimNumber && claimNumber !== "Not specified") {
      whereClause.claimNumber = claimNumber;
    }

    // Get the most recent PatientIntakeUpdate for this patient
    const intakeUpdate = await prisma.patientIntakeUpdate.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            patientName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!intakeUpdate) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No intake updates found for this patient",
      });
    }

    return NextResponse.json({
      success: true,
      data: intakeUpdate,
    });
  } catch (error) {
    console.error("Error fetching patient intake update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnection();
    const body = await request.json();
    const {
      patientName,
      dob,
      claimNumber,

    } = body;

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name and Language are required" },
        { status: 400 }
      );
    }

    // 1. Get documents (fast operation)
    const patientDocuments = await prisma.document.findMany({
      where: {
        patientName,
        dob,
        claimNumber: claimNumber || undefined,
      },
      include: {
        adl: true,
        bodyPartSnapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const latestDocument = patientDocuments
      .filter((doc: any) => doc.reportDate)
      .sort(
        (a: any, b: any) =>
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      )[0];

    // 2. Process OpenAI calls
    if (latestDocument) {
      // Await ADL analysis
      await processADLAnalysisWithTimeout(latestDocument, body).catch(console.error);
    }

    // Process PatientIntakeUpdate synchronously
    // We use a separate approach to avoid prisma connection issues
    const result = await processPatientIntakeUpdate(latestDocument || null, body);

    // Return success immediately with the result
    return NextResponse.json({
      success: true,
      data: result,
      message: "Submission processed successfully."
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function with timeout for ADL analysis
async function processADLAnalysisWithTimeout(document: any, body: any) {
  const TIMEOUT_MS = 30000; // 30 seconds
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    // Create a promise that rejects on timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('ADL analysis timeout')), TIMEOUT_MS);
    });

    await Promise.race([
      processADLAnalysis(document, body),
      timeoutPromise
    ]);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('ADL analysis aborted due to timeout');
    } else {
      console.error('ADL analysis failed:', error);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// New function to handle PatientIntakeUpdate synchronously with detailed analysis
async function processPatientIntakeUpdate(document: any, body: any) {
  const OPENAI_TIMEOUT_MS = 25000; // 25 seconds for OpenAI

  try {
    // Get fresh connections
    await ensurePrismaConnection();
    const openai = getOpenAIClient();

    const {
      patientName,
      dob,
      claimNumber,
      doi,
      language,
      bodyAreas,
      newAppointments,
      refill,
      adl,
      therapies,
      notes
    } = body;

    // Extract tags/pills data
    const medRefillsRequested = refill?.needed ? "Yes" : "No";
    const newAppointmentsList = Array.isArray(newAppointments) && newAppointments.length > 0
      ? newAppointments.map((apt: any) => apt.type || "Unknown").join(", ")
      : null;

    // Determine ADL changes
    let adlChangesText = null;
    if (adl?.state && adl.state !== "same") {
      const adlList = Array.isArray(adl.list) ? adl.list : [];
      if (adlList.length > 0) {
        const direction = adl.state === "better" ? "↑" : adl.state === "worse" ? "↓" : "";
        adlChangesText = `${adlList[0]} ${direction}`.trim();
      }
    }

    // Prepare intake data for AI analysis
    const intakeAnalysisPrompt = `
Analyze the following patient intake form submission and generate:

1. KEY PATIENT-REPORTED CHANGES: Write a narrative summary (2-3 sentences) describing what the patient reported since their last visit. Include:
   - Medication refill status (whether needed or not)
   - New appointments that occurred
   - Changes in activities of daily living (ADLs) compared to prior visit
   - Any therapy effects if mentioned
   
   Example: "Since the last visit, the patient reports no need for medication refills. One new appointment occurred (orthopedic consultation). Patient reports a decline in grip-related activities of daily living compared to the prior visit."

2. SYSTEM INTERPRETATION: Write exactly 2 clear, concise sentences. First sentence should flag clinically relevant changes. Second sentence should note correlation with exam findings and need for treatment modification or further evaluation.
   Example: "Changes flagged as clinically relevant. Consider correlation with exam findings, treatment response, and need for treatment modification or further evaluation."

3. KEY FINDINGS: Generate a narrative summary based on the intake data. Format as a paragraph describing key findings from the patient intake. Include:
   - Patient's reported condition/concerns
   - Medication needs
   - Appointment status
   - ADL changes
   - Pain levels if relevant
   
   Example: "Patient reports ${bodyAreas || 'body area'} concerns with ${adl?.state === 'worse' ? 'worsening' : adl?.state === 'better' ? 'improving' : 'stable'} ADL status. ${medRefillsRequested === 'Yes' ? 'Medication refill requested.' : 'No medication refills needed.'} ${newAppointmentsList ? `New appointments: ${newAppointmentsList}.` : 'No new appointments reported.'}"

4. ADL EFFECT POINTS: Generate 3-5 bullet points (one per line) describing ADL effects. Each point should be concise (5-10 words max). Use keywords like "decreased", "limited", "difficulty", "worse" for negative changes, and "improved", "better", "increased" for positive changes.
   Example:
   - Grip strength decreased
   - Walking distance limited
   - Dressing difficulty increased

5. INTAKE PATIENT POINTS: Generate 3-5 bullet points (one per line) from patient intake. Each point should be concise (5-10 words max). Use keywords like "refill", "medication", "appointment", "consult", "pain", "worse", "better".
   Example:
   - Med refill requested
   - New ortho consult scheduled
   - Pain level improved after medication

6. GENERATED POINTS: Generate a consolidated list of 3-5 key points for the dashboard. These should be short, actionable, and color-coded by intent (e.g., urgent/worse = red, improved = green, neutral/info = blue/amber).
   Example:
   - Pain worsened (Red)
   - Med refill needed (Blue)
   - ADLs improved (Green)

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
[Narrative summary - 2-3 sentences describing patient-reported changes since last visit]

SYSTEM INTERPRETATION:
[Sentence 1. Sentence 2.]

KEY FINDINGS:
[Narrative summary based on intake data - describe key findings from patient intake]

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

    // Set up abort controller for OpenAI
    const controller = new AbortController();
    const openaiTimeout = setTimeout(() => {
      controller.abort();
    }, OPENAI_TIMEOUT_MS);

    // Run the OpenAI call with race between actual call and timeout
    let intakeCompletion;
    try {
      intakeCompletion = await Promise.race([
        openai.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a medical assistant. For KEY PATIENT-REPORTED CHANGES: write a narrative summary (2-3 sentences) describing patient-reported changes since last visit. For SYSTEM INTERPRETATION: write exactly 2 clear sentences. For KEY FINDINGS: write a narrative summary based on intake data. For points: use bullet format.",
            },
            { role: "user", content: intakeAnalysisPrompt },
          ],
          temperature: 0.3,
        }, {
          signal: controller.signal,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenAI call timeout')), OPENAI_TIMEOUT_MS)
        )
      ]);
    } catch (openaiError) {
      clearTimeout(openaiTimeout);
      if (openaiError.name === 'AbortError' || openaiError.message === 'OpenAI call timeout') {
        console.error('OpenAI call timed out - using fallback data');
        // Use fallback data when OpenAI times out
        return await createFallbackIntakeUpdate(prisma, body);
      }
      throw openaiError;
    }

    clearTimeout(openaiTimeout);

    // Process the successful response
    const content = intakeCompletion.choices[0]?.message?.content?.trim() || "";

    let keyPatientReportedChanges = "";
    let systemInterpretation = "";
    let keyFindings = "";
    let adlEffectPoints: string[] = [];
    let intakePatientPoints: string[] = [];
    let generatedPoints: string[] = [];

    // Parse KEY PATIENT-REPORTED CHANGES
    const keyChangesMatch = content.match(/KEY PATIENT-REPORTED CHANGES:\s*([\s\S]+?)(?=SYSTEM INTERPRETATION:|$)/);
    if (keyChangesMatch) {
      keyPatientReportedChanges = keyChangesMatch[1].trim();
    }

    // Parse SYSTEM INTERPRETATION (2 sentences)
    const systemMatch = content.match(/SYSTEM INTERPRETATION:\s*([\s\S]+?)(?=KEY FINDINGS:|ADL EFFECT POINTS:|$)/);
    if (systemMatch) {
      systemInterpretation = systemMatch[1].trim();
    }

    // Parse KEY FINDINGS
    const keyFindingsMatch = content.match(/KEY FINDINGS:\s*([\s\S]+?)(?=ADL EFFECT POINTS:|INTAKE PATIENT POINTS:|$)/);
    if (keyFindingsMatch) {
      keyFindings = keyFindingsMatch[1].trim();
    }

    // Parse ADL EFFECT POINTS
    const adlMatch = content.match(/ADL EFFECT POINTS:\s*([\s\S]+?)(?=INTAKE PATIENT POINTS:|$)/);
    if (adlMatch) {
      adlEffectPoints = adlMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Parse INTAKE PATIENT POINTS
    const intakeMatch = content.match(/INTAKE PATIENT POINTS:\s*([\s\S]+?)(?=GENERATED POINTS:|$)/);
    if (intakeMatch) {
      intakePatientPoints = intakeMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Parse GENERATED POINTS
    const generatedMatch = content.match(/GENERATED POINTS:\s*([\s\S]+?)$/);
    if (generatedMatch) {
      generatedPoints = generatedMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Fallback if parsing fails
    if (!keyPatientReportedChanges && !systemInterpretation) {
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        keyPatientReportedChanges = lines[0].replace(/^KEY PATIENT-REPORTED CHANGES:\s*/i, '').trim();
        systemInterpretation = lines[1].replace(/^SYSTEM INTERPRETATION:\s*/i, '').trim();
      }
    }

    // Fallback for key findings if not parsed
    if (!keyFindings) {
      const adlStatus = adl?.state === 'worse' ? 'worsening' : adl?.state === 'better' ? 'improving' : 'stable';
      const medStatus = medRefillsRequested === 'Yes' ? 'Medication refill requested.' : 'No medication refills needed.';
      const apptStatus = newAppointmentsList ? `New appointments: ${newAppointmentsList}.` : 'No new appointments reported.';
      keyFindings = `Patient reports ${bodyAreas || 'body area'} concerns with ${adlStatus} ADL status. ${medStatus} ${apptStatus}`;
    }

    // Construct the update data with all fields
    const updateData = {
      dob: dob || null,
      doi: doi || null,
      documentId: document?.id || null,
      keyPatientReportedChanges,
      systemInterpretation,
      keyFindings,
      adlEffectPoints,
      intakePatientPoints,
      generatedPoints,
      medRefillsRequested,
      newAppointments: newAppointmentsList,
      adlChanges: adlChangesText,
      intakeData: {
        newAppointments,
        refill,
        adl,
        therapies,
        bodyAreas,
        language: 'en',
        notes: notes || null,
      },
    };

    // Upsert logic with timeout protection
    return await Promise.race([
      upsertIntakeRecordWithData(prisma, body, updateData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database operation timeout')), 5000)
      )
    ]);

  } catch (error) {
    console.error('Patient intake update failed:', error);

    // Try to save error information
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
      throw error; // Re-throw if we can't even save the error
    }
  }
}

// Helper function to upsert intake record with full data
async function upsertIntakeRecordWithData(prisma: any, body: any, updateData: any) {
  const { patientName, dob, claimNumber } = body;

  const existing = await prisma.patientIntakeUpdate.findFirst({
    where: {
      patientName,
      dob,
      claimNumber: claimNumber || null,
    },
  });

  if (existing) {
    return await prisma.patientIntakeUpdate.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  } else {
    return await prisma.patientIntakeUpdate.create({
      data: {
        patientName,
        claimNumber: claimNumber || null,
        ...updateData,
      },
    });
  }
}

// Helper function to upsert intake record
async function upsertIntakeRecord(prisma: any, body: any, intakeData: any) {
  const { patientName, dob, language, notes, claimNumber } = body;

  const existing = await prisma.patientIntakeUpdate.findFirst({
    where: {
      patientName,
      dob,
      claimNumber: claimNumber || null,
    },
  });

  const finalIntakeData = {
    ...intakeData,
    language: 'en',
    notes: notes || null
  };

  if (existing) {
    return await prisma.patientIntakeUpdate.update({
      where: { id: existing.id },
      data: {
        intakeData: finalIntakeData,
        updatedAt: new Date(),
      },
    });
  } else {
    return await prisma.patientIntakeUpdate.create({
      data: {
        patientName,
        dob,
        claimNumber: claimNumber || null,
        intakeData: finalIntakeData,
      },
    });
  }
}

// Fallback function when OpenAI times out
async function createFallbackIntakeUpdate(prisma: any, body: any) {
  const { patientName, dob, language, notes, claimNumber } = body;

  const fallbackData = {
    summary: "Analysis timed out - using basic patient information",
    patientName,
    language: 'en',
    notes: notes || null,
    timestamp: new Date().toISOString(),
    status: 'timeout_fallback'
  };

  const existing = await prisma.patientIntakeUpdate.findFirst({
    where: {
      patientName,
      dob,
      claimNumber: claimNumber || null,
    },
  });

  if (existing) {
    return await prisma.patientIntakeUpdate.update({
      where: { id: existing.id },
      data: {
        intakeData: fallbackData,
        updatedAt: new Date(),
      },
    });
  } else {
    return await prisma.patientIntakeUpdate.create({
      data: {
        patientName,
        dob,
        claimNumber: claimNumber || null,
        intakeData: fallbackData,
      },
    });
  }
}


