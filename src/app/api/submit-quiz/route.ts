// app/api/submit-quiz/route.ts
import { prisma } from "@/lib/prisma";
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
  submission: any,
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

4. ADL EFFECT POINTS: Generate 3-5 bullet points (one per line) describing ADL effects. Each point should be concise (5-10 words max).
   Example:
   - Grip strength decreased
   - Walking distance limited
   - Dressing difficulty increased

5. INTAKE PATIENT POINTS: Generate 3-5 bullet points (one per line) from patient intake. Each point should be concise (5-10 words max).
   Example:
   - Med refill requested
   - New ortho consult scheduled
   - Pain level improved after medication

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
    const intakeMatch = content.match(/INTAKE PATIENT POINTS:\s*([\s\S]+?)$/);
    if (intakeMatch) {
      intakePatientPoints = intakeMatch[1]
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
      patientQuizId: submission.id,
      documentId: latestDocument?.id || null,
      keyPatientReportedChanges,
      systemInterpretation,
      keyFindings,
      adlEffectPoints,
      intakePatientPoints,
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


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const dob = searchParams.get("dob");
    const doi = searchParams.get("doi");

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name is required" },
        { status: 400 }
      );
    }

    const whereClause: any = { patientName };
    if (dob) {
      whereClause.dob = dob;
    }
    if (doi) {
      whereClause.doi = doi;
    }

    const submission = await prisma.patientQuiz.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    if (!patientName || !language) {
      return NextResponse.json(
        { error: "Patient Name and Language are required" },
        { status: 400 }
      );
    }

    // 1. Create submission first (fast operation)
    const submission = await prisma.patientQuiz.create({
      data: {
        patientName,
        dob,
        claimNumber: claimNumber || null,
        doi,
        lang: language,
        bodyAreas: bodyAreas || null,
        newAppointments: newAppointments || null,
        refill: refill || null,
        adl: adl || { state: "same", list: [] },
        therapies: therapies || null,
      },
    });

    // 2. Get documents (fast operation)
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

    // 3. Process OpenAI calls in background if they might timeout
    // Don't wait for these to complete before returning response
    if (latestDocument) {
      // Fire and forget - don't await
      processADLAnalysis(latestDocument, body).catch(console.error);
    }

    // Process PatientIntakeUpdate in background too
    processPatientIntakeUpdate(prisma, submission, latestDocument || null, body)
      .catch(console.error);

    // Return success immediately without waiting for AI processing
    return NextResponse.json({
      success: true,
      submission,
      message: "Submission received. AI analysis is processing in background."
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    ]);

    let adlsAffected = "";
    let workRestrictions = "";

    if (completion && completion.choices && completion.choices[0]) {
      const content = completion.choices[0].message.content?.trim();
      if (content) {
        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);
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

// Separate function for PatientIntakeUpdate
async function processPatientIntakeUpdate(prisma: any, submission: any, latestDocument: any, body: any) {
  try {
    const openai = getOpenAIClient();
    await upsertPatientIntakeUpdate(prisma, openai, submission, latestDocument, body);
  } catch (error) {
    console.error("Error in PatientIntakeUpdate:", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const dob = searchParams.get("dob");
    const doi = searchParams.get("doi");

    if (!patientName) {
      return NextResponse.json(
        { error: "Patient Name is required" },
        { status: 400 }
      );
    }

    const whereClause: any = { patientName };
    if (dob) {
      whereClause.dob = dob;
    }
    if (doi) {
      whereClause.doi = doi;
    }

    const existing = await prisma.patientQuiz.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const openai = getOpenAIClient();

    const { language, bodyAreas, newAppointments, refill, adl, therapies } =
      body;

    const submission = await prisma.patientQuiz.update({
      where: { id: existing.id },
      data: {
        lang: language || existing.lang,
        bodyAreas: bodyAreas || existing.bodyAreas,
        newAppointments: newAppointments || existing.newAppointments,
        refill: refill || existing.refill,
        adl: adl || existing.adl,
        therapies: therapies || existing.therapies,
      },
    });

    const patientDocuments = await prisma.document.findMany({
      where: {
        patientName,
        dob,
      },
      include: {
        adl: true,
      },
    });

    const sortedDocuments = patientDocuments
      .filter((doc: any) => doc.reportDate)
      .sort(
        (a: any, b: any) =>
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );

    const latestDocument = sortedDocuments.length > 0 ? sortedDocuments[0] : null;

    if (latestDocument) {
      const previousAdl =
        sortedDocuments.length > 1 ? sortedDocuments[1].adl : null;
      const previousAdlText = previousAdl
        ? `Previous ADL: adlsAffected = "${previousAdl.adlsAffected}", workRestrictions = "${previousAdl.workRestrictions}"`
        : "No previous ADL available";

      // Prepare data for OpenAI prompt (same as POST but with previous)
      const painLevel = refill
        ? `${refill.before || "N/A"} -> ${refill.after || "N/A"}`
        : "N/A";
      const symptomTrend = adl?.state || "N/A";
      const patientSelectedADLs = adl?.list || [];
      const appointmentsAttended = newAppointments || [];
      const therapyEffects = therapies || [];

      const prompt = `
Based on the patient's current intake form responses and previous ADL data, determine updated ADL activities and work restrictions.

Current Patient Information:
- Body Areas: ${bodyAreas || "N/A"}
- Language: ${language || existing.lang}
- Pain Level (before -> after medication): ${painLevel}
- Symptom Trend (from ADLs): ${symptomTrend}
- Patient Selected ADLs: ${JSON.stringify(patientSelectedADLs)}
- New Appointments: ${JSON.stringify(appointmentsAttended)}
- Therapies and Effects: ${JSON.stringify(therapyEffects)}

${previousAdlText}

Task: Compare current data with previous ADL and generate updated 2 lines.

Line 1 Format: List affected daily activities as short phrases (e.g., "dressing, bathing, walking, climbing stairs")
Line 2 Format: List work restrictions as short phrases (e.g., "lifting heavy objects, prolonged standing, driving long distances")

Rules:
- Use ONLY short noun phrases separated by commas
- NO complete sentences, NO words like "may", "patient", "restrictions in", "unable to"
- Just list the activities/restrictions directly
- If trend is "better", consider reducing restrictions
- If trend is "worse", consider adding restrictions
- Base on therapies effects and pain changes
- Explicitly consider therapy effects: For each therapy with positive rating (e.g., "Much Better" or "Slightly Better"), incorporate relief in restrictions (e.g., if Physical Therapy is "Much Better", reduce "prolonged standing"); if "No Change", maintain status quo

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending

Output your 2 lines now:
      `;

      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You output exactly 2 lines. Each line contains only comma-separated short noun phrases, NO complete sentences, NO verbs like "may", "face", "include". Just the restriction names directly. Prioritize therapy effects in adjusting restrictions.',
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      });

      let adlsAffected = "";
      let workRestrictions = "";
      try {
        const content = completion.choices[0].message.content?.trim();
        if (!content) {
          throw new Error("Empty response from OpenAI");
        }
        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);
        if (lines.length >= 2) {
          adlsAffected = lines[0];
          workRestrictions = lines[1];
        } else {
          throw new Error("Insufficient lines in response");
        }
      } catch (parseError) {
        console.error(
          "OpenAI response parse error:",
          parseError,
          "Raw content:",
          completion.choices[0].message.content
        );
        adlsAffected = "";
        workRestrictions = "";
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
    }

    // Generate PatientIntakeUpdate content using AI - now independent of document existence
    await upsertPatientIntakeUpdate(prisma, openai, submission, latestDocument || null, body);

    return NextResponse.json({ success: true, submission }, { status: 200 });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}