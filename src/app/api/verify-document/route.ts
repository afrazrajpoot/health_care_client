import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const document_id = searchParams.get("document_id");
    if (!document_id) {
      return NextResponse.json(
        { error: "Missing required parameter: document_id" },
        { status: 400 }
      );
    }

    // ✅ Update the specific document by document_id
    const result = await prisma.document.updateMany({
      where: {
        id: document_id,
      },
      data: {
        status: "verified",
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "No document found for the provided document_id" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} document verified successfully.`,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}