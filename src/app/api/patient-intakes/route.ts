// // app/api/patient-intakes/route.ts
// import { prisma, ensurePrismaConnection } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import CryptoJS from "crypto-js";

// export async function GET(request: NextRequest) {
//   try {
//     // Ensure Prisma is connected before use
//     await ensurePrismaConnection();
//     const { searchParams } = new URL(request.url);
//     const patientName = searchParams.get("patientName") || searchParams.get("patient_name");
//     const dob = searchParams.get("dob");
//     const claimNumber = searchParams.get("claimNumber") || searchParams.get("claim_number");
    
//     // NEW: Check for extension parameter
//     const extension = searchParams.get("extension") === 'true';

//     if (!patientName) {
//       // Check if request is from extension and return appropriate error
//       if (extension) {
//         return NextResponse.json(
//           { error: "Patient Name is required", source: 'extension' },
//           { status: 400 }
//         );
//       } else {
//         return NextResponse.json(
//           { error: "Patient Name is required" },
//           { status: 400 }
//         );
//       }
//     }

//     const whereClause: any = {
//       patientName: {
//         equals: patientName,
//         mode: "insensitive",
//       },
//     };

//     if (dob) {
//       // Handle DOB matching - extract date part only
//       const dobDate = dob.split("T")[0];
//       whereClause.dob = dobDate;
//     }

//     if (claimNumber && claimNumber !== "Not specified") {
//       whereClause.claimNumber = claimNumber;
//     }

//     const submissions = await prisma.patientQuiz.findMany({
//       where: whereClause,
//       orderBy: { createdAt: "desc" },
//     });

//     // NEW: Check if request is from extension
//     if (extension) {
//       console.log('🔄 Extension request detected - returning unencrypted data for patient intakes');
      
//       // Return unencrypted response for extension
//       return NextResponse.json({
//         success: true,
//         data: submissions,
//         total: submissions.length,
//         timestamp: new Date().toISOString(),
//         query: {
//           patientName,
//           dob,
//           claimNumber,
//           matchCount: submissions.length,
//           extension: true
//         },
//         source: 'extension'
//       });
//     }

//     // Get encryption secret from environment (for non-extension requests)
//     const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

//     if (!ENCRYPTION_SECRET) {
//       console.warn('⚠️ Encryption secret not configured - returning unencrypted response');
//       return NextResponse.json({
//         success: true,
//         data: submissions,
//         total: submissions.length,
//         timestamp: new Date().toISOString(),
//         warning: 'Response not encrypted - server configuration issue'
//       });
//     }

//     try {
//       // Prepare data for encryption
//       const responseData = {
//         success: true,
//         data: submissions,
//         total: submissions.length,
//         timestamp: new Date().toISOString(),
//         query: {
//           patientName,
//           dob,
//           claimNumber,
//           matchCount: submissions.length
//         }
//       };

//       // Encrypt the response
//       const dataString = JSON.stringify(responseData);
//       const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();

//       console.log('🔐 Patient intakes response encrypted', {
//         patientName,
//         submissionCount: submissions.length,
//         encryptedDataLength: encryptedData.length
//       });

//       // Return encrypted response
//       return NextResponse.json({
//         encrypted: true,
//         data: encryptedData,
//         timestamp: new Date().toISOString(),
//         route_marker: 'patient-intakes-api-encrypted',
//         metadata: {
//           submissionCount: submissions.length,
//           encryption: 'AES',
//           query: { patientName, hasDob: !!dob, hasClaimNumber: !!claimNumber }
//         }
//       });

//     } catch (encryptionError) {
//       console.error('❌ Failed to encrypt patient intakes:', encryptionError);
      
//       // Fallback to unencrypted response
//       return NextResponse.json({
//         success: true,
//         data: submissions,
//         total: submissions.length,
//         timestamp: new Date().toISOString(),
//         warning: 'Encryption failed - returned unencrypted data',
//         error: encryptionError instanceof Error ? encryptionError.message : 'Unknown encryption error'
//       });
//     }

//   } catch (error) {
//     console.error("Error fetching patient intakes:", error);
    
//     // Get encryption secret for error response
//     const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
    
//     // Check if request is from extension
//     const { searchParams } = new URL(request.url);
//     const extension = searchParams.get("extension") === 'true';
    
//     if (extension) {
//       // Return unencrypted error for extension
//       return NextResponse.json(
//         { 
//           success: false,
//           error: "Internal server error",
//           details: error instanceof Error ? error.message : 'Unknown error',
//           timestamp: new Date().toISOString(),
//           source: 'extension'
//         },
//         { status: 500 }
//       );
//     }
    
//     if (ENCRYPTION_SECRET) {
//       try {
//         const errorData = {
//           success: false,
//           error: "Internal server error",
//           details: error instanceof Error ? error.message : 'Unknown error',
//           timestamp: new Date().toISOString()
//         };
//         const dataString = JSON.stringify(errorData);
//         const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();
        
//         return NextResponse.json({
//           encrypted: true,
//           data: encryptedData,
//           timestamp: new Date().toISOString(),
//           isError: true
//         }, { status: 500 });
//       } catch {
//         // If encryption fails for error, return plain error
//         return NextResponse.json(
//           { success: false, error: "Internal server error" },
//           { status: 500 }
//         );
//       }
//     } else {
//       return NextResponse.json(
//         { success: false, error: "Internal server error" },
//         { status: 500 }
//       );
//     }
//   }
// }




// app/api/patient-intakes/route.ts
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    await ensurePrismaConnection();
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
    const allPatients = await prisma.patientQuiz.findMany({
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

    console.log('🔍 Similar patients in database:', allPatients);

    // Now execute the actual query
    const submissions = await prisma.patientQuiz.findMany({
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
    await ensurePrismaConnection();
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