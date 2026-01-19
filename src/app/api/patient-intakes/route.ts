// app/api/patient-intakes/route.ts
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    // await ensurePrismaConnection();
    const { searchParams } = new URL(request.url);

    // Get all possible parameter names for flexibility
    const patientName = searchParams.get("patientName") ||
      searchParams.get("patient_name") ||
      searchParams.get("name");

    const dob = searchParams.get("dob") ||
      searchParams.get("dateOfBirth") ||
      searchParams.get("date_of_birth");

    const claimNumber = searchParams.get("claimNumber") ||
      searchParams.get("claim_number") ||
      searchParams.get("claim");

    // Check for extension parameter
    const extension = searchParams.get("extension") === 'true';

    // Log the request for debugging
    console.log('📞 Patient intakes API called with parameters:', {
      patientName,
      dob,
      claimNumber,
      extension,
      allParams: Object.fromEntries(searchParams.entries())
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

    // Build a more flexible search query
    const whereClause: any = {};

    // Patient name search - make it more flexible
    if (patientName) {
      // Try exact match first, then partial match
      whereClause.OR = [
        { patientName: { equals: patientName, mode: "insensitive" } },
        { patientName: { contains: patientName, mode: "insensitive" } }
      ];
    }

    // DOB matching - be flexible with date formats
    if (dob) {
      try {
        // Try to parse the date in different formats
        const dobDate = new Date(dob);
        if (!isNaN(dobDate.getTime())) {
          // Format as YYYY-MM-DD for database comparison
          const formattedDob = dobDate.toISOString().split('T')[0];
          whereClause.dob = formattedDob;
        } else {
          // If parsing fails, try to extract date part
          const dobMatch = dob.match(/(\d{4}-\d{2}-\d{2})/);
          if (dobMatch) {
            whereClause.dob = dobMatch[1];
          } else {
            whereClause.dob = dob; // Use as-is
          }
        }
      } catch (dateError) {
        console.warn('⚠️ Could not parse DOB:', dob, dateError);
        whereClause.dob = dob; // Use as-is
      }
    }

    // Claim number - handle various cases
    if (claimNumber) {
      if (claimNumber === "General" || claimNumber === "Not specified" || claimNumber === "N/A") {
        // For general/unspecified claims, search for null, empty, or these values
        whereClause.OR = [
          ...(whereClause.OR || []),
          { claimNumber: null },
          { claimNumber: "" },
          { claimNumber: "General" },
          { claimNumber: "Not specified" },
          { claimNumber: "N/A" }
        ];
      } else {
        // For specific claim numbers
        whereClause.claimNumber = claimNumber;
      }
    }

    console.log('🔍 Final database query:', JSON.stringify(whereClause, null, 2));

    // First, let's check what exists in the database for debugging
    // First, let's check what exists in the database for debugging
    let allPatients;
    let debugRetries = 3;
    while (debugRetries > 0) {
      try {
        allPatients = await prisma.patientQuiz.findMany({
          where: {
            patientName: {
              contains: patientName.split(' ')[0], // Search by first name
              mode: "insensitive"
            }
          },
          select: {
            patientName: true,
            dob: true,
            claimNumber: true,
            createdAt: true
          },
          take: 10 // Limit to 10 for debugging
        });
        break; // Success
      } catch (dbError: any) {
        debugRetries--;
        const isConnectionError =
          dbError?.message?.includes("Engine is not yet connected") ||
          dbError?.message?.includes("Client is not connected") ||
          dbError?.message?.includes("Can't reach database server");

        if (isConnectionError && debugRetries > 0) {
          console.warn(`⚠️ Prisma connection error (Debug Query). Retrying... (${debugRetries} attempts left)`);
          // await new Promise(resolve => setTimeout(resolve, 500));
          // try {
          //   await prisma.$disconnect();
          //   await prisma.$connect();
          // } catch (e) { console.error(e); }
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // For debug query, we can just ignore errors and continue if it fails
          console.warn("⚠️ Initial DB check failed, continuing...", dbError.message);
          allPatients = []; // Fallback to empty array
          break;
        }
      }
    }

    console.log('🔍 Similar patients in database:', allPatients);

    // Now execute the actual query
    let submissions;
    let retries = 3;
    while (retries > 0) {
      try {
        submissions = await prisma.patientQuiz.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          // Include all fields for the response
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
        break; // Success
      } catch (dbError: any) {
        retries--;
        const isConnectionError =
          dbError?.message?.includes("Engine is not yet connected") ||
          dbError?.message?.includes("Client is not connected") ||
          dbError?.message?.includes("Can't reach database server");

        if (isConnectionError && retries > 0) {
          console.warn(`⚠️ Prisma connection error (Main Query). Retrying... (${retries} attempts left)`);

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          throw dbError;
        }
      }
    }

    console.log('✅ Found submissions:', submissions.length);
    if (submissions.length > 0) {
      console.log('📋 Sample submission:', JSON.stringify(submissions[0], null, 2));
    }

    // Transform the data for better frontend consumption
    const transformedData = submissions.map(submission => ({
      ...submission,
      // Ensure JSON fields are properly parsed if they're stored as strings
      adl: typeof submission.adl === 'string' ? JSON.parse(submission.adl) : submission.adl,
      therapies: typeof submission.therapies === 'string' ? JSON.parse(submission.therapies) : submission.therapies,
      newAppointments: typeof submission.newAppointments === 'string' ? JSON.parse(submission.newAppointments) : submission.newAppointments,
      refill: typeof submission.refill === 'string' ? JSON.parse(submission.refill) : submission.refill
    }));

    // Always return raw/unencrypted data
    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      timestamp: new Date().toISOString(),
      query: {
        patientName,
        dob,
        claimNumber,
        matchCount: transformedData.length,
        extension: extension || false,
        searchStrategy: "flexible-match"
      },
      source: extension ? 'extension' : 'web',
      debug: {
        similarPatientsFound: allPatients.length,
        similarPatients: allPatients
      }
    });

  } catch (error) {
    console.error("❌ Error fetching patient intakes:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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