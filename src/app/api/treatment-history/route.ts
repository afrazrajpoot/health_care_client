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
            physicianId
        });

        if (!physicianId) {
            return NextResponse.json(
                { error: "Missing required parameter: physicianId" },
                { status: 400 }
            );
        }

        const hasPatientName = !!patientName?.trim();
        const hasDob = !!dob?.trim();
        const hasClaimNumber = !!claimNumber?.trim() && claimNumber.trim() !== "Not specified";

        if (!((hasPatientName && hasDob) || hasClaimNumber)) {
            return NextResponse.json(
                {
                    error: "Minimum requirements: either (patient_name + dob) OR claim_number"
                },
                { status: 400 }
            );
        }

        // Build OR conditions for searching
        const orConditions: any[] = [];

        if (hasPatientName && hasDob) {
            orConditions.push({
                patientName: { equals: patientName.trim(), mode: 'insensitive' },
                dob: dob.trim()
            });
        }

        if (hasClaimNumber) {
            orConditions.push({
                claimNumber: { equals: claimNumber.trim(), mode: 'insensitive' }
            });
        }

        console.log("🔍 Searching for treatment histories with conditions:", JSON.stringify(orConditions, null, 2));

        const historyRecords = await prisma.treatmentHistory.findMany({
            where: {
                physicianId,
                OR: orConditions
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!historyRecords || historyRecords.length === 0) {
            console.log("❌ No treatment history found");
            return NextResponse.json({
                success: true,
                data: null,
                message: "No treatment history found"
            });
        }

        console.log(`✅ Found ${historyRecords.length} treatment history records`);

        // Merge historyData from all records
        const mergedHistory: any = {};
        const documentIds = new Set<string>();

        historyRecords.forEach(record => {
            const data = record.historyData as any;
            if (!data || typeof data !== 'object') return;

            Object.keys(data).forEach(system => {
                if (!Array.isArray(data[system])) return;

                if (!mergedHistory[system]) {
                    mergedHistory[system] = [];
                }

                // Add reports from this record
                data[system].forEach((newReport: any) => {
                    // Check if this report already exists in mergedHistory[system]
                    // We check by date and physician to avoid duplicates
                    const isDuplicate = mergedHistory[system].some((existingReport: any) =>
                        existingReport.report_date === newReport.report_date &&
                        existingReport.physician === newReport.physician
                    );

                    if (!isDuplicate) {
                        mergedHistory[system].push(newReport);
                        if (newReport.document_id) {
                            documentIds.add(newReport.document_id);
                        }
                    }
                });
            });
        });

        // Fetch document details (links) for all collected IDs
        if (documentIds.size > 0) {
            const documents = await prisma.document.findMany({
                where: {
                    id: { in: Array.from(documentIds) }
                },
                select: {
                    id: true,
                    gcsFileLink: true,
                    blobPath: true
                }
            });

            const docMap = new Map(documents.map(d => [d.id, d]));

            // Enrich mergedHistory with document links
            Object.keys(mergedHistory).forEach(system => {
                mergedHistory[system].forEach((report: any) => {
                    if (report.document_id && docMap.has(report.document_id)) {
                        const doc = docMap.get(report.document_id);
                        report.gcs_file_link = doc?.gcsFileLink;
                        report.blob_path = doc?.blobPath;
                    }
                });
            });
        }

        // Sort reports within each system by date (newest first)
        Object.keys(mergedHistory).forEach(system => {
            mergedHistory[system].sort((a: any, b: any) => {
                const dateA = new Date(a.report_date).getTime();
                const dateB = new Date(b.report_date).getTime();
                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;
                return dateB - dateA;
            });
        });

        return NextResponse.json({
            success: true,
            data: mergedHistory,
            debug: {
                recordsFound: historyRecords.length,
                mergedSystems: Object.keys(mergedHistory)
            }
        });

    } catch (error) {
        console.error("❌ Error fetching treatment history:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}