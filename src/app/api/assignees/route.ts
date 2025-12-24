// app/api/assignees/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    let physicianId: string | null = null;

    // Determine physicianId based on role
    if (user.role === "Physician") {
      physicianId = user.id || null;
    } else if (user.role === "Staff") {
      physicianId = user.physicianId || null;
    } else {
      return NextResponse.json(
        { error: "Access denied: Invalid role" },
        { status: 403 }
      );
    }

    if (!physicianId) {
      return NextResponse.json(
        { error: "Physician ID not found for this user" },
        { status: 400 }
      );
    }

    // Fetch all staff members assigned to this physician
    const staffMembers = await prisma.user.findMany({
      where: {
        physicianId: physicianId,
        role: "Staff",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Format assignees list
    const assignees = [
      { value: "Unclaimed", label: "Unclaimed", type: "default" },
      { value: "Physician", label: "Physician", type: "physician" },
      ...staffMembers.map((staff) => ({
        value: `Assigned: ${staff.firstName || "Staff"} ${staff.lastName || ""}`.trim(),
        label: `${staff.firstName || ""} ${staff.lastName || ""}`.trim() || staff.email || "Staff",
        type: "staff",
        staffId: staff.id,
      })),
    ];

    // Also add common role-based assignees
    const commonAssignees = [
      { value: "Assigned: MA", label: "Medical Assistant", type: "role" },
      { value: "Assigned: Admin", label: "Administrator", type: "role" },
      { value: "Assigned: Scheduler", label: "Scheduler", type: "role" },
    ];

    // Merge and deduplicate
    const allAssignees = [
      ...assignees,
      ...commonAssignees.filter(
        (ca) => !assignees.some((a) => a.value === ca.value)
      ),
    ];

    return NextResponse.json({
      assignees: allAssignees,
      count: allAssignees.length,
    });
  } catch (error) {
    console.error("Error fetching assignees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

