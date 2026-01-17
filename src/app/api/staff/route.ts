
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";
// import { authOptions } from "@/lib/auth";
// import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the physician ID. 
        // If the user is a physician, it's their ID.
        // If the user is staff, it's their physicianId.
        const physicianId = session.user.role === "Physician"
            ? session.user.id
            : session.user.physicianId;

        if (!physicianId) {
            return NextResponse.json({ error: "Physician ID not found" }, { status: 400 });
        }

        // Find all users with this physicianId (excluding the physician themselves if desired, but user said "all staff member")
        // We assume staff members have role != 'Physician' or just filter by physicianId
        const staffMembers = await prisma.user.findMany({
            where: {
                physicianId: physicianId,
                // Optionally exclude the physician themselves if they are in this list (though usually physician has physicianId=null or points to themselves?)
                // Based on schema, User has physicianId. A physician might not have physicianId set, or it might be different.
                // Let's assume we want all users linked to this physicianId.
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                image: true,
            },
        });

        return NextResponse.json({ staff: staffMembers });
    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
