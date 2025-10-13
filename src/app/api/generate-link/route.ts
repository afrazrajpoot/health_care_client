import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-for-development-only';

interface TokenPayload {
  patient: string;
  dob: string;
  visit: string;
  lang: string;
  mode: string;
  body: string;
  exp: number;
  auth: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      patient,
      dob,
      visit = 'Follow-up',
      lang = 'en',
      mode = 'tele',
      body: bodyParts = '',
      exp = '7',
      auth = 'yes'
    } = body;

    // Validate required fields
    if (!patient?.trim() || !dob?.trim()) {
      return NextResponse.json(
        { error: 'Patient name and date of birth are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for date of birth' },
        { status: 400 }
      );
    }

    // Calculate expiration timestamp (in seconds)
    const expiresInDays = parseInt(exp) || 7;
    const expirationTime = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);

    const payload: TokenPayload = {
      patient: patient.trim(),
      dob,
      visit,
      lang,
      mode,
      body: bodyParts,
      exp: expirationTime,
      auth,
      createdAt: new Date().toISOString()
    };

    // Generate token
    const token = jwt.sign(payload, JWT_SECRET);

    // Check if patient with same name and DOB already exists
    const existingPatient = await prisma.intakeLink.findFirst({
      where: {
        patientName: patient.trim(),
        dateOfBirth: dobDate,
      },
    });

    let databaseResult;
    
    if (existingPatient) {
      // UPDATE existing record
      databaseResult = await prisma.intakeLink.update({
        where: {
          id: existingPatient.id,
        },
        data: {
          token,
          visitType: visit,
          language: lang,
          mode: mode,
          bodyParts: bodyParts,
          expiresInDays: expiresInDays,
          requireAuth: auth === 'yes',
          expiresAt: new Date(expirationTime * 1000),
          updatedAt: new Date(),
        },
      });
      console.log(`Updated existing intake link for patient: ${patient.trim()}`);
    } else {
      // CREATE new record
      databaseResult = await prisma.intakeLink.create({
        data: {
          token,
          patientName: patient.trim(),
          dateOfBirth: dobDate,
          visitType: visit,
          language: lang,
          mode: mode,
          bodyParts: bodyParts,
          expiresInDays: expiresInDays,
          requireAuth: auth === 'yes',
          expiresAt: new Date(expirationTime * 1000),
        },
      });
      console.log(`Created new intake link for patient: ${patient.trim()}`);
    }

    return NextResponse.json({ 
      token,
      expiresIn: `${expiresInDays} days`,
      action: existingPatient ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}