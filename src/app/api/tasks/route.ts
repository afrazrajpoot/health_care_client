// app/api/tasks/route.ts
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

    // 🧠 Determine physicianId based on role
    if (user.role === "Physician") {
      physicianId = user.id;
    } else if (user.role === "Staff") {
      physicianId = user.physicianId;
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'wc';
    const claim = searchParams.get('claim');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const dept = searchParams.get('dept') || '';
    const status = searchParams.get('status') || '';
    const overdueOnly = searchParams.get('overdueOnly') === 'true';
    const priority = searchParams.get('priority') || '';
    const dueDateFilter = searchParams.get('dueDate') || '';
    const taskType = searchParams.get('taskType') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const now = new Date();

    // Build conditions for top-level AND
    const andConditions: any[] = [];

    // Base conditions
    andConditions.push({ physicianId });

    // Document filters
    const documentWhere: any = {};
    if (claim) {
      documentWhere.claimNumber = claim;
    }
    if (mode) {
      documentWhere.mode = mode;
    }
    if (Object.keys(documentWhere).length > 0) {
      andConditions.push({ document: documentWhere });
    }

    // Department filter - remove "Department" from the search term
    if (dept) {
      // Remove "Department" from the search term for better matching
      const cleanDept = dept.replace(/Department/gi, '').trim();
      
      andConditions.push({ 
        department: { 
          contains: cleanDept, 
          mode: 'insensitive' 
        } 
      });
      
      console.log('Original dept:', dept, 'Cleaned dept:', cleanDept);
    }

    // Status mapping: frontend sends lowercase, DB likely title case
    const statusMap: { [key: string]: string } = {
      pending: "Pending",
      done: "Done",
    };
    let effectiveStatus = status;
    if (status && statusMap[status]) {
      effectiveStatus = statusMap[status];
    }

    // Handle overdue as a computed filter
    if (overdueOnly || status === 'overdue') {
      andConditions.push(
        { dueDate: { lt: now } },
        { status: { not: "Done" } }
      );
      effectiveStatus = '';
    }

    if (effectiveStatus) {
      andConditions.push({ status: effectiveStatus });
    }

    // Ignore taskType as it doesn't exist in schema

    // Assigned to filter using actions array
    if (assignedTo === 'me') {
      andConditions.push({ actions: { has: "Claimed" } });
    } else if (assignedTo === 'unassigned') {
      andConditions.push({ actions: { not: { has: "Claimed" } } });
    }

    // Search filter - OR between description and patient
    if (search) {
      andConditions.push({
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { patient: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Due date conditions for dueDateFilter and priority
    let dueDateCondition: any = null;

    // dueDateFilter inner condition
    let dueDateFilterInner: any = {};
    if (dueDateFilter) {
      if (dueDateFilter === 'today') {
        const startToday = new Date(now);
        startToday.setHours(0, 0, 0, 0);
        const endToday = new Date(startToday.getTime() + 24 * 60 * 60 * 1000 - 1);
        dueDateFilterInner = { gte: startToday, lte: endToday };
      } else if (dueDateFilter === 'week') {
        const startWeek = new Date(now);
        startWeek.setDate(now.getDate() - now.getDay());
        startWeek.setHours(0, 0, 0, 0);
        const endWeek = new Date(startWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        dueDateFilterInner = { gte: startWeek, lte: endWeek };
      } else if (dueDateFilter === 'month') {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startMonth.setHours(0, 0, 0, 0);
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endMonth.setHours(23, 59, 59, 999);
        dueDateFilterInner = { gte: startMonth, lte: endMonth };
      }
    }

    // Priority-based condition
    let priorityCond: any = null;
    if (priority) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (priority === 'high') {
        // dueDate null OR dueDate < tomorrow
        priorityCond = {
          OR: [
            { dueDate: null },
            { dueDate: { lt: tomorrow } }
          ]
        };
      } else if (priority === 'medium') {
        priorityCond = { dueDate: { gte: tomorrow, lt: weekLater } };
      } else if (priority === 'low') {
        priorityCond = { dueDate: { gte: weekLater } };
      }
    }

    // Combine dueDateFilter and priority
    let dueDateFilterCond: any = null;
    if (Object.keys(dueDateFilterInner).length > 0) {
      dueDateFilterCond = { dueDate: dueDateFilterInner };
    }

    if (dueDateFilterCond) {
      if (priorityCond) {
        // AND between dueDateFilter and priority
        dueDateCondition = {
          AND: [
            dueDateFilterCond,
            priorityCond
          ]
        };
      } else {
        dueDateCondition = dueDateFilterCond;
      }
    } else if (priorityCond) {
      dueDateCondition = priorityCond;
    }

    // 🆕 DEFAULT FILTER: Show urgent and due tasks by default
    // Only apply default filter if no specific dueDateFilter or priority is provided
    if (!dueDateFilter && !priority && !status && !overdueOnly) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Show tasks that are either:
      // 1. Overdue (dueDate < now AND status not Done)
      // 2. Due today or tomorrow (high priority)
      // 3. Due within the next 7 days (medium priority)
      andConditions.push({
        OR: [
          // Overdue tasks
          {
            AND: [
              { dueDate: { lt: now } },
              { status: { not: "Done" } }
            ]
          },
          // High priority: due today or tomorrow (or null due date)
          {
            OR: [
              { dueDate: null },
              { dueDate: { lt: tomorrow } }
            ]
          },
          // Medium priority: due within next 7 days
          {
            dueDate: {
              gte: tomorrow,
              lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      });
      
      console.log('Applied default filter: showing urgent and due tasks');
    }

    // Add dueDate condition to andConditions (if specific filters were provided)
    if (dueDateCondition) {
      andConditions.push(dueDateCondition);
    }

    // Final where clause
    const whereClause: any = {};
    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // Sorting - validate fields from schema
    const validSortFields = ['dueDate', 'createdAt', 'description', 'department', 'updatedAt'];
    let effectiveSortBy = validSortFields.includes(sortBy) ? sortBy : 'dueDate';
    if (sortBy === 'priority') {
      effectiveSortBy = 'dueDate'; // Approximate sort by earliest due date for high priority first
    }
    const orderBy: any = { [effectiveSortBy]: sortOrder === 'desc' ? 'desc' : 'asc' };

    // Pagination
    const skip = (page - 1) * pageSize;

    // Log whereClause for debugging (remove in production)
    console.log('Query Where Clause:', JSON.stringify(whereClause, null, 2));

    // Fetch tasks and total count
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: pageSize,
        include: {
          document: {
            select: {
              id: true,
              claimNumber: true,
              status: true,
              ur_denial_reason: true,
              // Removed patientName as it's on task.patient
            },
          },
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    // 🧠 Attach `ur_denial_reason` directly to each task for easy frontend access
    // and compute priority
    const tasksWithURAndPriority = tasks.map((task: any) => {
      let computedPriority = 'low';
      const due = task.dueDate ? new Date(task.dueDate) : null;
      if (!due || due < now) {
        computedPriority = 'high'; // overdue or no due date
      } else {
        const diffMs = due.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 1) {
          computedPriority = 'high';
        } else if (diffDays <= 7) {
          computedPriority = 'medium';
        } else {
          computedPriority = 'low';
        }
      }

      return {
        ...task,
        ur_denial_reason: task.document?.ur_denial_reason || task.reason || null,
        priority: computedPriority, // Add computed priority
      };
    });

    // Log results for debugging
    console.log('Fetched tasks count:', tasksWithURAndPriority.length, 'Total:', totalCount);

    return NextResponse.json({ tasks: tasksWithURAndPriority, totalCount });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}