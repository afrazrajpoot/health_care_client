// app/api/submit-quiz/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patientName');
    const dob = searchParams.get('dob');
    const doi = searchParams.get('doi');

    if (!patientName || !dob || !doi) {
      return NextResponse.json({ error: 'Patient Name, DOB, and DOI are required' }, { status: 400 });
    }

    const submission = await prisma.patientQuiz.findFirst({
      where: { 
        patientName,
        dob,
        doi
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientName,
      dob,
      doi,
      lang,
      newAppt,
      appts,
      pain,
      workDiff,
      trend,
      workAbility,
      barrier,
      adl: inputAdl,
    } = body;

    if (!patientName || !dob || !doi) {
      return NextResponse.json({ error: 'Patient Name, DOB, and DOI are required' }, { status: 400 });
    }

    const submission = await prisma.patientQuiz.create({
      data: {
        patientName,
        dob,
        doi,
        lang,
        newAppt,
        appts,
        pain,
        workDiff,
        trend,
        workAbility,
        barrier,
        adl: inputAdl || [],
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

    if (patientDocuments.length === 0) {
      return NextResponse.json({ success: true, submission }, { status: 201 });
    }

    const latestDocument = patientDocuments
      .filter((doc:any) => doc.reportDate)
      .sort((a:any, b:any) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())[0];

    if (!latestDocument) {
      return NextResponse.json({ success: true, submission }, { status: 201 });
    }

    const prompt = `
Based on the patient's form responses, determine which ADL activities are affected and what work restrictions apply.

Patient Information:
- Pain Level: ${pain || 'N/A'}
- Work Difficulties: ${workDiff || 'N/A'}
- Symptom Trend: ${trend || 'N/A'}
- Work Ability: ${workAbility || 'N/A'}
- Barriers to Recovery: ${barrier || 'N/A'}
- Patient Selected ADLs: ${JSON.stringify(inputAdl || [])}
- Appointments Attended: ${JSON.stringify(appts || [])}

Task: Generate 2 lines based on the data above.

Line 1 Format: List affected daily activities as short phrases (e.g., "dressing, bathing, walking, climbing stairs")
Line 2 Format: List work restrictions as short phrases (e.g., "lifting heavy objects, prolonged standing, driving long distances")

Rules:
- Use ONLY short noun phrases separated by commas
- NO complete sentences, NO words like "may", "patient", "restrictions in", "unable to"
- Just list the activities/restrictions directly
- If pain is high or work difficulties mentioned, include relevant restrictions
- If patient selected specific ADLs, include those

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending

Output your 2 lines now:
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a medical ADL analyzer. Output exactly 2 lines with comma-separated short phrases only. Analyze the patient data provided and list: Line 1 = affected daily activities, Line 2 = work restrictions. Use direct phrases like "lifting heavy objects" not sentences like "patient cannot lift".',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    });

    let adlsAffected = '';
    let workRestrictions = '';
    try {
      const content = completion.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length >= 2) {
        adlsAffected = lines[0];
        workRestrictions = lines[1];
      } else {
        throw new Error('Insufficient lines in response');
      }
    } catch (parseError) {
      console.error('OpenAI response parse error:', parseError, 'Raw content:', completion.choices[0].message.content);
      adlsAffected = '';
      workRestrictions = '';
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

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patientName');
    const dob = searchParams.get('dob');
    const doi = searchParams.get('doi');

    if (!patientName || !dob || !doi) {
      return NextResponse.json({ error: 'Patient Name, DOB, and DOI are required' }, { status: 400 });
    }

    const existing = await prisma.patientQuiz.findFirst({
      where: { 
        patientName,
        dob,
        doi
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      lang,
      newAppt,
      appts,
      pain,
      workDiff,
      trend,
      workAbility,
      barrier,
      adl: inputAdl,
    } = body;

    const submission = await prisma.patientQuiz.update({
      where: { id: existing.id },
      data: {
        lang,
        newAppt,
        appts,
        pain,
        workDiff,
        trend,
        workAbility,
        barrier,
        adl: inputAdl || [],
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

    if (patientDocuments.length === 0) {
      return NextResponse.json({ success: true, submission }, { status: 200 });
    }

    const sortedDocuments = patientDocuments
      .filter((doc:any) => doc.reportDate)
      .sort((a:any, b:any) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());

    if (sortedDocuments.length === 0) {
      return NextResponse.json({ success: true, submission }, { status: 200 });
    }

    const latestDocument = sortedDocuments[0];

    const previousAdl = sortedDocuments.length > 1 ? sortedDocuments[1].adl : null;
    const previousAdlText = previousAdl ? `Previous ADL: adlsAffected="${previousAdl.adlsAffected}", workRestrictions="${previousAdl.workRestrictions}"` : 'No previous ADL available';

    const prompt = `
Based on the patient's current form responses and previous ADL data, determine updated ADL activities and work restrictions.

Current Patient Information:
- Pain Level: ${pain || 'N/A'}
- Work Difficulties: ${workDiff || 'N/A'}
- Symptom Trend: ${trend || 'N/A'}
- Work Ability: ${workAbility || 'N/A'}
- Barriers to Recovery: ${barrier || 'N/A'}
- Patient Selected ADLs: ${JSON.stringify(inputAdl || [])}
- Appointments Attended: ${JSON.stringify(appts || [])}

${previousAdlText}

Task: Compare current data with previous ADL and generate updated 2 lines.

Line 1 Format: List affected daily activities as short phrases (e.g., "dressing, bathing, walking, climbing stairs")
Line 2 Format: List work restrictions as short phrases (e.g., "lifting heavy objects, prolonged standing, driving long distances")

Rules:
- Use ONLY short noun phrases separated by commas
- NO complete sentences, NO words like "may", "patient", "restrictions in", "unable to"
- Just list the activities/restrictions directly
- If trend is "improving", consider reducing restrictions
- If trend is "worsening", consider adding restrictions
- If work difficulties mentioned, reflect those in restrictions

Example Output:
bathing, dressing, prolonged walking
lifting heavy objects, overhead reaching, repetitive bending

Output your 2 lines now:
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You output exactly 2 lines. Each line contains only comma-separated short noun phrases, NO complete sentences, NO verbs like "may", "face", "include". Just the restriction names directly.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    });

    let adlsAffected = '';
    let workRestrictions = '';
    try {
      const content = completion.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length >= 2) {
        adlsAffected = lines[0];
        workRestrictions = lines[1];
      } else {
        throw new Error('Insufficient lines in response');
      }
    } catch (parseError) {
      console.error('OpenAI response parse error:', parseError, 'Raw content:', completion.choices[0].message.content);
      adlsAffected = '';
      workRestrictions = '';
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

    return NextResponse.json({ success: true, submission }, { status: 200 });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}