// app/api/patient-intakes/route.ts
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
      lang,
      language,
      bodyAreas,
      newAppointments,
      refill,
      adl,
      therapies,
    } = body;

    const finalLanguage = language || lang || 'en';

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
        language: finalLanguage,
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
    await ensurePrismaConnection();
    const { searchParams } = new URL(request.url);

    const patientName = searchParams.get("patientName") ||
      searchParams.get("patient_name") ||
      searchParams.get("name");

    const dobParam = searchParams.get("dob") ||
      searchParams.get("dateOfBirth") ||
      searchParams.get("date_of_birth");

    const claimNumber = searchParams.get("claimNumber") ||
      searchParams.get("claim_number") ||
      searchParams.get("claim");

    const extension = searchParams.get("extension") === 'true';

    // Log the request for debugging
    console.log('📞 Patient intakes API called with parameters:', {
      patientName,
      dobParam,
      claimNumber,
      extension
    });

    if (!patientName) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient Name is required",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Build the query
    const whereClause: any = {
      patientName: {
        contains: patientName,
        mode: "insensitive"
      }
    };

    // DATE MATCHING - IGNORE FORMAT
    if (dobParam) {
      try {
        const inputDate = new Date(dobParam);

        if (!isNaN(inputDate.getTime())) {
          // Get date components
          const year = inputDate.getFullYear();
          const month = inputDate.getMonth() + 1;
          const day = inputDate.getDate();

          console.log(`📅 Parsed date components: Year=${year}, Month=${month}, Day=${day}`);

          // Get all submissions for this patient first
          const allPatientSubmissions = await prisma.patientQuiz.findMany({
            where: {
              patientName: {
                contains: patientName,
                mode: "insensitive"
              }
            },
            select: {
              id: true,
              patientName: true,
              dob: true,
              createdAt: true
            }
          });

          console.log(`🔍 Found ${allPatientSubmissions.length} submissions for patient:`,
            allPatientSubmissions.map(s => ({ dob: s.dob, match: isSameDate(s.dob, inputDate) })));

          // Find submissions where the date matches (ignoring format)
          const matchingSubmissionIds = allPatientSubmissions
            .filter(submission => {
              if (!submission.dob) return false;
              return isSameDate(submission.dob, inputDate);
            })
            .map(submission => submission.id);

          console.log(`✅ Found ${matchingSubmissionIds.length} submissions with matching date (ignoring format)`);

          // Query by IDs to get full data
          if (matchingSubmissionIds.length > 0) {
            whereClause.id = { in: matchingSubmissionIds };
          } else {
            // No matches found
            return NextResponse.json({
              success: true,
              data: [],
              total: 0,
              timestamp: new Date().toISOString(),
              query: {
                patientName,
                dob: dobParam,
                claimNumber,
                matchCount: 0,
                extension: extension || false,
                message: "No submissions found with matching date (date components matched, format ignored)"
              },
              source: extension ? 'extension' : 'web'
            });
          }
        } else {
          console.warn(`⚠️ Invalid date format: ${dobParam}`);
          // If date is invalid, just search by string
          whereClause.dob = dobParam;
        }
      } catch (dateError) {
        console.warn(`⚠️ Date parsing error for ${dobParam}:`, dateError);
        // If parsing fails, search by exact string
        whereClause.dob = dobParam;
      }
    }

    if (claimNumber) {
      if (claimNumber === "General" || claimNumber === "Not specified" || claimNumber === "N/A") {
        whereClause.claimNumber = {
          in: [null, "", "General", "Not specified", "N/A"]
        };
      } else {
        whereClause.claimNumber = claimNumber;
      }
    }

    console.log('🔍 Final database query:', JSON.stringify(whereClause, null, 2));

    let submissions: any[] = [];

    // If we're filtering by IDs (from date matching), query those specifically
    // Otherwise, use the normal whereClause
    if (whereClause.id && whereClause.id.in) {
      submissions = await prisma.patientQuiz.findMany({
        where: {
          id: { in: whereClause.id.in },
          ...(claimNumber && { claimNumber: whereClause.claimNumber })
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          patientName: true,
          dob: true,
          doi: true,
          lang: true,
          bodyAreas: true,
          newAppointments: true,
          refill: true,
          adl: true,
          therapies: true,
          claimNumber: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } else {
      submissions = await prisma.patientQuiz.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          patientName: true,
          dob: true,
          doi: true,
          lang: true,
          bodyAreas: true,
          newAppointments: true,
          refill: true,
          adl: true,
          therapies: true,
          claimNumber: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    console.log('✅ Found submissions:', submissions.length);

    // Helper function to check if two date strings represent the same calendar date
    function isSameDate(dateString: string, compareDate: Date): boolean {
      try {
        const date1 = new Date(dateString);
        if (isNaN(date1.getTime())) {
          // Try to parse common formats manually
          const formats = [
            /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,  // YYYY-MM-DD or YYYY/MM/DD
            /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,  // MM-DD-YYYY or MM/DD/YYYY
            /(\d{1,2})[-/](\d{1,2})[-/](\d{2})/   // MM-DD-YY or MM/DD/YY
          ];

          for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
              let year, month, day;

              if (match[1].length === 4) {
                // YYYY-MM-DD format
                year = parseInt(match[1]);
                month = parseInt(match[2]);
                day = parseInt(match[3]);
              } else if (match[3].length === 4) {
                // MM-DD-YYYY format
                month = parseInt(match[1]);
                day = parseInt(match[2]);
                year = parseInt(match[3]);
              } else {
                // MM-DD-YY format
                month = parseInt(match[1]);
                day = parseInt(match[2]);
                year = 2000 + parseInt(match[3]); // Assuming 2000s
              }

              return year === compareDate.getFullYear() &&
                month === compareDate.getMonth() + 1 &&
                day === compareDate.getDate();
            }
          }
          return false;
        }

        return date1.getFullYear() === compareDate.getFullYear() &&
          date1.getMonth() === compareDate.getMonth() &&
          date1.getDate() === compareDate.getDate();
      } catch {
        return false;
      }
    }

    // Transform the data
    const transformedData = submissions.map(submission => ({
      ...submission,
      adl: typeof submission.adl === 'string' ? JSON.parse(submission.adl) : submission.adl,
      therapies: typeof submission.therapies === 'string' ? JSON.parse(submission.therapies) : submission.therapies,
      newAppointments: typeof submission.newAppointments === 'string' ? JSON.parse(submission.newAppointments) : submission.newAppointments,
      refill: typeof submission.refill === 'string' ? JSON.parse(submission.refill) : submission.refill
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      timestamp: new Date().toISOString(),
      query: {
        patientName,
        dob: dobParam,
        claimNumber,
        matchCount: transformedData.length,
        extension: extension || false,
        dateMatching: "format-agnostic"
      },
      source: extension ? 'extension' : 'web'
    });

  } catch (error) {
    console.error("❌ Error fetching patient intakes:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: Add a POST method if you need to create patient intakes
export async function POST(request: NextRequest) {
  try {
    // await ensurePrismaConnection();
    const body = await request.json();

    console.log('📝 Creating patient intake:', body);

    const submission = await prisma.patientQuiz.create({
      data: {
        patientName: body.patientName,
        dob: body.dob,
        doi: body.doi,
        lang: body.lang || 'en',
        bodyAreas: body.bodyAreas,
        newAppointments: body.newAppointments,
        refill: body.refill,
        adl: body.adl,
        therapies: body.therapies,
        claimNumber: body.claimNumber
      }
    });

    // Handle AI summary and ADL upsert for consistency
    try {
      const openai = getOpenAIClient();

      const patientDocuments = await prisma.document.findMany({
        where: {
          patientName: body.patientName,
          dob: body.dob,
          claimNumber: body.claimNumber || undefined,
        },
      });

      const latestDocument = patientDocuments
        .filter((doc: any) => doc.reportDate)
        .sort(
          (a: any, b: any) =>
            new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        )[0];

      if (latestDocument) {
        // Prepare data for OpenAI prompt (ADL)
        const painLevel = body.refill
          ? `${body.refill.before || "N/A"} -> ${body.refill.after || "N/A"}`
          : "N/A";
        const symptomTrend = body.adl?.state || "N/A";
        const patientSelectedADLs = body.adl?.list || [];
        const appointmentsAttended = body.newAppointments || [];
        const therapyEffects = body.therapies || [];

        const prompt = `
Based on the patient's intake form responses, determine which ADL activities are affected and what work restrictions apply.

Patient Information:
- Body Areas: ${body.bodyAreas || "N/A"}
- Language: ${body.lang || 'en'}
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

        const completion = await openai.chat.completions.create({
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
        });

        let adlsAffected = "";
        let workRestrictions = "";
        try {
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
        } catch (parseError) {
          console.error("OpenAI response parse error:", parseError);
        }

        if (adlsAffected || workRestrictions) {
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
      }

      // Generate PatientIntakeUpdate content using AI - now independent of document existence
      await upsertPatientIntakeUpdate(prisma, openai, submission, latestDocument || null, body);
    } catch (aiError) {
      console.error("Error in AI processing for patient intake:", aiError);
    }

    return NextResponse.json({
      success: true,
      data: submission,
      message: "Patient intake created successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error creating patient intake:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create patient intake",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}