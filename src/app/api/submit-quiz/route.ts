// app/api/submit-quiz/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
      adl,
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
        adl: adl || [],
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
      adl,
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
        adl: adl || [],
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 200 });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}