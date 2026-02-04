import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { Prisma } from "@prisma/client";
import OpenAI, { AzureOpenAI } from "openai";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get("patientName")?.trim() || null;
    const claimNumber = searchParams.get("claimNumber")?.trim() || null;
    const dobParam = searchParams.get("dob")?.trim() || null;
    let physicianId = searchParams.get("physicianId");
    const mode = searchParams.get("mode");

    if (
      physicianId === "null" ||
      physicianId === "undefined" ||
      physicianId === ""
    ) {
      physicianId = null;
    }

    // ✅ Initialize OpenAI/Azure client
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const standardApiKey = process.env.OPENAI_API_KEY;

    let openai: OpenAI | AzureOpenAI | null = null;

    if (azureApiKey && azureEndpoint && azureDeployment) {
      openai = new AzureOpenAI({
        apiKey: azureApiKey,
        endpoint: azureEndpoint,
        deployment: azureDeployment,
        apiVersion: "2024-02-15-preview",
      });
    } else if (standardApiKey) {
      openai = new OpenAI({
        apiKey: standardApiKey,
      });
    }

    // ✅ Build a flexible where clause
    const whereClause: Prisma.DocumentWhereInput = {};
    const andConditions: Prisma.DocumentWhereInput[] = [];

    if (mode) {
      andConditions.push({ mode });
    }

    if (physicianId) {
      andConditions.push({ physicianId });
    }

    // Add conditions dynamically (only if they exist)
    const orConditions: Prisma.DocumentWhereInput[] = [];
    if (patientName) {
      orConditions.push({
        patientName: { contains: patientName, mode: "insensitive" },
      });
    }
    if (claimNumber) {
      orConditions.push({
        claimNumber: { contains: claimNumber, mode: "insensitive" },
      });
    }
    if (dobParam) {
      orConditions.push({
        dob: { equals: dobParam },
      });
    }

    // If any search fields exist, use OR; otherwise, fallback to all docs (limit results)
    if (orConditions.length > 0) {
      andConditions.push({ OR: orConditions });
    } else {
      whereClause.id = { not: null }; // fallback: all docs
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    console.debug("🧠 Flexible whereClause:", JSON.stringify(whereClause));

    const results = await prisma.document.findMany({
      where: whereClause,
      select: {
        patientName: true,
        claimNumber: true,
        dob: true,
        doi: true,
        id: true,
        physicianId: true,
      },
      take: 40, // Increased to allow better AI deduplication
      orderBy: { createdAt: "desc" },
    });

    if (!results.length) {
      return NextResponse.json(
        { message: "No matching patients found" },
        { status: 404 }
      );
    }

    // ✅ Filter for completeness
    const completeResults = results.filter((doc) => {
      return (
        !!doc.patientName &&
        doc.patientName.toLowerCase() !== "not specified" &&
        !!doc.dob
      );
    });

    if (completeResults.length === 0) {
      return NextResponse.json(
        {
          message:
            "No complete patient records found (missing fields in all matches)",
        },
        { status: 404 }
      );
    }

    let uniqueResults: typeof completeResults = [];

    // ✅ Step 1: Algorithmic Deduplication (Fast & Robust)
    const manualDedupeMap = new Map<string, (typeof completeResults)[0]>();
    completeResults.forEach((doc) => {
      // Normalize name by sorting words to handle reordered names (e.g., "John Doe" vs "Doe John")
      const normalizedName = doc.patientName
        ? doc.patientName
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .sort()
          .join(" ")
        : "";
      const claimNormalized = doc.claimNumber?.trim().toLowerCase() || "no-claim";
      const dobNormalized = String(doc.dob).trim();

      // Key based on DOB, Claim Number (if available), and Normalized Name
      const key = `${dobNormalized}|${claimNormalized}|${normalizedName}`;

      if (!manualDedupeMap.has(key)) {
        manualDedupeMap.set(key, doc);
      }
    });
    uniqueResults = Array.from(manualDedupeMap.values());

    // ✅ Step 2: AI Deduplication (If OpenAI is available and multiple potential matches exist)
    if (openai && uniqueResults.length > 1) {
      try {
        const recordsForAI = uniqueResults.map((r) => ({
          id: r.id,
          patientName: r.patientName,
          dob: r.dob,
          claimNumber: r.claimNumber,
        }));

        const prompt = `You are a medical data assistant. Below is a list of patients found in a search.
Some records may belong to the same person despite slight variations in name (e.g., "John Doe" vs "Doe John", or "John A. Doe" vs "John Doe").
Identify unique patients based on their DOB, claimNumber, and name similarity.
For each unique patient, select ONLY ONE representative record (the most complete or standard one).

DATA:
${JSON.stringify(recordsForAI, null, 2)}

Respond ONLY with a JSON object in this format:
{
  "uniqueIds": ["id1", "id2", ...]
}
Return only the IDs of the records that represent unique individuals.`;

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert at deduplicating medical records.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        });

        const content = aiResponse.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const uniqueIds = parsed.uniqueIds || [];
          if (Array.isArray(uniqueIds) && uniqueIds.length > 0) {
            uniqueResults = uniqueResults.filter((r) =>
              uniqueIds.includes(r.id)
            );
          }
        }
      } catch (aiErr) {
        console.error("⚠️ AI Deduplication failed, using manual results:", aiErr);
      }
    }

    // ✅ Final extraction of patientNames
    const patientNames = Array.from(
      new Set(uniqueResults.map((r) => r.patientName).filter(Boolean))
    );

    // ✅ Save Audit Log (non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          email: session.user.email,
          action: `Patient search suggestions: found ${uniqueResults.length} unique patients`,
          path: "/api/dashboard/recommendation",
          method: "GET",
        },
      });
    } catch (auditErr) {
      console.error("⚠️ Audit log failed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        patientNames,
        allMatchingDocuments: uniqueResults,
        totalCount: uniqueResults.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching patient name suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}