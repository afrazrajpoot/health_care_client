import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth"; // adjust path to your NextAuth options
import { prisma } from "@/lib/prisma"; // your Prisma client instance
import { authOptions } from "@/services/authSErvice";

export async function GET() {
  try {
    // ✅ Get session
    const session = await getServerSession(authOptions);

    if (!session || !session?.user?.physicianId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // ✅ Fetch last 10 documents for logged-in user
    const documents = await prisma.document.findMany({
      where: { physicianId: session?.user?.physicianId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        patientName: true,
        claimNumber: true,
        status: true,
        createdAt: true,
        gcsFileLink: true,
        fileName: true,
        briefSummary: true,
        documentSummary: true,
        blobPath: true,
        
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
