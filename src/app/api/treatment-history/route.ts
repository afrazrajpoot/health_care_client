import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    console.log("🚀 Treatment History API called");

    try {
        const { searchParams } = new URL(request.url);
        const patientName = searchParams.get("patient_name");
        const dob = searchParams.get("dob");
        const claimNumber = searchParams.get("claim_number");
        const physicianId = searchParams.get("physicianId");

        console.log("📋 Query Parameters:", {
            patientName,
            dob,
            claimNumber,
            physicianId,
            url: request.url
        });

        if (!physicianId) {
            console.log("❌ Missing physicianId");
            return NextResponse.json(
                { error: "Missing required parameter: physicianId" },
                { status: 400 }
            );
        }

        // Validate input combinations
        const hasPatientName = !!patientName?.trim();
        const hasDob = !!dob?.trim();
        const hasClaimNumber = !!claimNumber?.trim();

        console.log("✅ Parameter validation:", {
            hasPatientName,
            hasDob,
            hasClaimNumber
        });

        // Check minimum requirements: either (patientName + dob) OR claimNumber
        if (!((hasPatientName && hasDob) || hasClaimNumber)) {
            console.log("❌ Insufficient parameters");
            return NextResponse.json(
                {
                    error: "Minimum two fields required: either (patient_name + dob) OR claim_number"
                },
                { status: 400 }
            );
        }

        let history = null;

        // First, let's check what's actually in the database for debugging
        console.log("🔍 Checking database for treatment histories...");

        const allHistories = await prisma.treatmentHistory.findMany({
            where: {
                physicianId,
            },
            take: 5, // Just get a few for debugging
            select: {
                patientName: true,
                dob: true,
                claimNumber: true,
                physicianId: true,
                createdAt: true,
                historyData: false // Don't include the large JSON field
            }
        });

        console.log("📊 First 5 treatment histories in DB:", allHistories);

        // Build search conditions
        if (hasPatientName && hasDob) {
            console.log("🔍 Searching by patient name + dob");

            // Build exact conditions to try
            const conditions: any[] = [];

            // Condition 1: All fields match (if claimNumber provided)
            if (hasClaimNumber) {
                conditions.push({
                    patientName: patientName.trim(),
                    dob: dob.trim(),
                    claimNumber: claimNumber.trim(),
                    physicianId,
                });
                console.log("➕ Condition 1: All fields match");
            }

            // Condition 2: Patient name + dob with null claimNumber
            conditions.push({
                patientName: patientName.trim(),
                dob: dob.trim(),
                OR: [
                    { claimNumber: null },
                    { claimNumber: "" }
                ],
                physicianId,
            });
            console.log("➕ Condition 2: Patient name + dob with null/empty claimNumber");

            // Condition 3: Try case-insensitive search for patient name
            conditions.push({
                patientName: {
                    equals: patientName.trim(),
                    mode: 'insensitive', // Case-insensitive search
                },
                dob: dob.trim(),
                physicianId,
            });
            console.log("➕ Condition 3: Case-insensitive patient name");

            console.log("🎯 Search conditions:", JSON.stringify(conditions, null, 2));

            // Try each condition one by one for better debugging
            for (let i = 0; i < conditions.length; i++) {
                console.log(`\n🔍 Trying condition ${i + 1}...`);
                const result = await prisma.treatmentHistory.findFirst({
                    where: conditions[i],
                });

                if (result) {
                    console.log(`✅ Found match with condition ${i + 1}`);
                    history = result;
                    break;
                } else {
                    console.log(`❌ No match with condition ${i + 1}`);
                }
            }

            // Also try a more flexible search
            if (!history) {
                console.log("\n🔍 Trying flexible search...");
                history = await prisma.treatmentHistory.findFirst({
                    where: {
                        AND: [
                            { physicianId },
                            {
                                OR: [
                                    {
                                        AND: [
                                            { patientName: { contains: patientName.trim(), mode: 'insensitive' } },
                                            { dob: { contains: dob.trim() } },
                                        ]
                                    },
                                    {
                                        AND: [
                                            { patientName: patientName.trim() },
                                            { dob: { contains: dob.trim() } },
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                });

                if (history) {
                    console.log("✅ Found match with flexible search");
                } else {
                    console.log("❌ No match with flexible search");
                }
            }

        }
        // Case 2: Search by claimNumber only
        else if (hasClaimNumber) {
            console.log("🔍 Searching by claimNumber only");

            // First try exact match
            history = await prisma.treatmentHistory.findFirst({
                where: {
                    claimNumber: claimNumber.trim(),
                    physicianId,
                },
            });

            if (!history) {
                console.log("🔍 Trying case-insensitive claimNumber search...");
                // Try case-insensitive if exact match fails
                history = await prisma.treatmentHistory.findFirst({
                    where: {
                        claimNumber: {
                            equals: claimNumber.trim(),
                            mode: 'insensitive',
                        },
                        physicianId,
                    },
                });
            }

            if (!history) {
                console.log("🔍 Trying partial claimNumber match...");
                // Try partial match
                history = await prisma.treatmentHistory.findFirst({
                    where: {
                        claimNumber: {
                            contains: claimNumber.trim(),
                        },
                        physicianId,
                    },
                });
            }
        }

        if (!history) {
            console.log("❌ No treatment history found after all attempts");

            // Let's do one final check - see if there are ANY records for this physician
            const totalCount = await prisma.treatmentHistory.count({
                where: { physicianId }
            });
            console.log(`📊 Total treatment histories for physician ${physicianId}: ${totalCount}`);

            return NextResponse.json({
                success: true,
                data: null,
                message: "No treatment history found",
                debug: {
                    totalRecordsForPhysician: totalCount,
                    searchParameters: { patientName, dob, claimNumber, physicianId }
                }
            });
        }

        console.log("✅ Found treatment history:", {
            id: history.id,
            patientName: history.patientName,
            dob: history.dob,
            claimNumber: history.claimNumber,
            createdAt: history.createdAt
        });

        return NextResponse.json({
            success: true,
            data: history.historyData,
            debug: {
                patientName: history.patientName,
                dob: history.dob,
                claimNumber: history.claimNumber,
                foundBy: "direct match"
            }
        });
    } catch (error) {
        console.error("❌ Error fetching treatment history:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}