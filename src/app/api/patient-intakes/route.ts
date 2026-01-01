// app/api/patient-intakes/route.ts
import { prisma, ensurePrismaConnection } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

export async function GET(request: NextRequest) {
  try {
    // Ensure Prisma is connected before use
    await ensurePrismaConnection();
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName");
    const dob = searchParams.get("dob");
    const claimNumber = searchParams.get("claimNumber");

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
      // Handle DOB matching - extract date part only
      const dobDate = dob.split("T")[0];
      whereClause.dob = dobDate;
    }

    if (claimNumber && claimNumber !== "Not specified") {
      whereClause.claimNumber = claimNumber;
    }

    const submissions = await prisma.patientQuiz.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Get encryption secret from environment
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

    if (!ENCRYPTION_SECRET) {
      console.warn('⚠️ Encryption secret not configured - returning unencrypted response');
      return NextResponse.json({
        success: true,
        data: submissions,
        total: submissions.length,
        timestamp: new Date().toISOString(),
        warning: 'Response not encrypted - server configuration issue'
      });
    }

    try {
      // Prepare data for encryption
      const responseData = {
        success: true,
        data: submissions,
        total: submissions.length,
        timestamp: new Date().toISOString(),
        query: {
          patientName,
          dob,
          claimNumber,
          matchCount: submissions.length
        }
      };

      // Encrypt the response
      const dataString = JSON.stringify(responseData);
      const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();

      console.log('🔐 Patient intakes response encrypted', {
        patientName,
        submissionCount: submissions.length,
        encryptedDataLength: encryptedData.length
      });

      // Return encrypted response
      return NextResponse.json({
        encrypted: true,
        data: encryptedData,
        timestamp: new Date().toISOString(),
        route_marker: 'patient-intakes-api-encrypted',
        metadata: {
          submissionCount: submissions.length,
          encryption: 'AES',
          query: { patientName, hasDob: !!dob, hasClaimNumber: !!claimNumber }
        }
      });

    } catch (encryptionError) {
      console.error('❌ Failed to encrypt patient intakes:', encryptionError);
      
      // Fallback to unencrypted response
      return NextResponse.json({
        success: true,
        data: submissions,
        total: submissions.length,
        timestamp: new Date().toISOString(),
        warning: 'Encryption failed - returned unencrypted data',
        error: encryptionError instanceof Error ? encryptionError.message : 'Unknown encryption error'
      });
    }

  } catch (error) {
    console.error("Error fetching patient intakes:", error);
    
    // Get encryption secret for error response
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
    
    if (ENCRYPTION_SECRET) {
      try {
        const errorData = {
          success: false,
          error: "Internal server error",
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
        const dataString = JSON.stringify(errorData);
        const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();
        
        return NextResponse.json({
          encrypted: true,
          data: encryptedData,
          timestamp: new Date().toISOString(),
          isError: true
        }, { status: 500 });
      } catch {
        // If encryption fails for error, return plain error
        return NextResponse.json(
          { success: false, error: "Internal server error" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}