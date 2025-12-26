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
    const taskTypeFilter = searchParams.get('type') || ''; // Filter by internal/external
    const assignedTo = searchParams.get('assignedTo') || '';
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const now = new Date();

    // Build conditions for top-level AND
    const andConditions: any[] = [];

    // Base conditions - ALWAYS filter by physicianId
    // For Physician: match task.physicianId = user.id
    // For Staff: match task.physicianId = user.physicianId
    andConditions.push({ physicianId });
    
    console.log('🔍 Filtering tasks by physicianId:', physicianId, 'for user role:', user.role);

    // Document filters - REMOVED: Claim filter is now optional
    // Only filter by physicianId - claim is ignored to show all tasks for the physician
    // If you need claim filtering, it should be done on the frontend or as a separate optional filter
    if (claim) {
      console.log('ℹ️ Claim parameter provided but not used as filter:', claim);
      console.log('   Showing all tasks for physicianId (claim filtering disabled)');
      // Claim filter removed - only matching by physicianId
    }
    // Note: mode filter removed from document - tasks can exist without documents
    // If you need to filter by mode, you'd need to add it to the task model or handle differently

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
      completed: "Completed", 
      closed: "Closed",
    };
    let effectiveStatus = status;
    if (status && statusMap[status]) {
      effectiveStatus = statusMap[status];
    }

    // Handle overdue as a computed filter
    if (overdueOnly || status === 'overdue') {
      andConditions.push(
        { dueDate: { lt: now } },
        { 
          status: { 
            notIn: ["Done", "Completed", "Closed"] 
          } 
        }
      );
      effectiveStatus = '';
    }

    // 🆕 EXCLUDE COMPLETED/CLOSED TASKS BY DEFAULT
    // Only include them when explicitly filtered by status
    if (effectiveStatus) {
      // User is explicitly filtering by status - show what they asked for
      andConditions.push({ status: effectiveStatus });
    } else if (!overdueOnly && status !== 'overdue') {
      // Default behavior: exclude completed/closed tasks
      andConditions.push({ 
        status: { 
          notIn: ["Done", "Completed", "Closed"] 
        } 
      });
    }

    // Ignore taskType as it doesn't exist in schema

    // Type filter (internal/external)
    if (taskTypeFilter && (taskTypeFilter === 'internal' || taskTypeFilter === 'external')) {
      andConditions.push({ type: taskTypeFilter });
    }

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

    // Note: Removed default date filter - now only filtering by physicianId + explicit user filters
    // This ensures all tasks matching physicianId are shown unless user explicitly filters them
    const hasExplicitStatusFilter = effectiveStatus && ["Done", "Completed", "Closed"].includes(effectiveStatus);
    const hasExplicitFilter = search || claim || dept || dueDateFilter || priority || assignedTo;
    
    console.log('Filter status:', { 
      hasExplicitFilter, 
      hasExplicitStatusFilter, 
      search, 
      claim, 
      dept,
      status: effectiveStatus,
      'Note': 'Only filtering by physicianId + explicit user filters'
    });

    // Add dueDate condition to andConditions (if specific filters were provided)
    if (dueDateCondition) {
      andConditions.push(dueDateCondition);
    }

    // Final where clause
    const whereClause: any = {};
    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // Debug logging
    console.log('📋 Task query filters:', {
      physicianId,
      userRole: user.role,
      claim,
      mode,
      search,
      dept,
      status: effectiveStatus,
      totalConditions: andConditions.length,
      whereClause: JSON.stringify(whereClause, null, 2)
    });

    // Sorting - validate fields from schema
    const validSortFields = ['dueDate', 'createdAt', 'description', 'department', 'updatedAt'];
    let effectiveSortBy = validSortFields.includes(sortBy) ? sortBy : 'dueDate';
    if (sortBy === 'priority') {
      effectiveSortBy = 'dueDate'; // Approximate sort by earliest due date for high priority first
    }
    const orderBy: any = { [effectiveSortBy]: sortOrder === 'desc' ? 'desc' : 'asc' };

    // Pagination
    const skip = (page - 1) * pageSize;



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
              blobPath: true,
              patientName: true,
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
    console.log('✅ Fetched tasks count:', tasksWithURAndPriority.length, 'Total:', totalCount);
    if (tasksWithURAndPriority.length === 0 && totalCount === 0) {
      console.log('⚠️ No tasks found with current filters. Checking if tasks exist for this physician...');
      // Quick check to see if any tasks exist for this physician at all
      const totalTasksForPhysician = await prisma.task.count({
        where: { physicianId }
      });
      console.log(`📊 Total tasks in DB for physicianId ${physicianId}:`, totalTasksForPhysician);
      
      // Also check tasks with null physicianId
      const tasksWithNullPhysicianId = await prisma.task.count({
        where: { physicianId: null }
      });
      console.log(`📊 Tasks with null physicianId:`, tasksWithNullPhysicianId);
      
      // Check all tasks count
      const allTasksCount = await prisma.task.count();
      console.log(`📊 Total tasks in database:`, allTasksCount);
      
      // Get the actual task that should match
      const matchingTask = await prisma.task.findFirst({
        where: { physicianId },
        include: {
          document: {
            select: {
              id: true,
              claimNumber: true,
              patientName: true
            }
          }
        }
      });
      
      if (matchingTask) {
        console.log('🔍 Found matching task by physicianId:', {
          id: matchingTask.id,
          physicianId: matchingTask.physicianId,
          patient: matchingTask.patient,
          claimNumber: matchingTask.claimNumber,
          documentId: matchingTask.documentId,
          document: matchingTask.document ? {
            id: matchingTask.document.id,
            claimNumber: matchingTask.document.claimNumber,
            patientName: matchingTask.document.patientName
          } : null,
          status: matchingTask.status,
          description: matchingTask.description
        });
        
        // Test the claim filter separately
        if (claim) {
          const taskClaimMatches = matchingTask.claimNumber === claim;
          const docClaimMatches = matchingTask.document?.claimNumber === claim;
          const claimMatches = taskClaimMatches || docClaimMatches;
          
          console.log(`🔍 Claim filter test for "${claim}":`, {
            taskClaimNumber: matchingTask.claimNumber || '(null)',
            documentClaimNumber: matchingTask.document?.claimNumber || '(null or no document)',
            taskClaimMatches,
            docClaimMatches,
            overallMatches: claimMatches,
            '⚠️': claimMatches ? '✅ Task SHOULD match' : '❌ Task will be EXCLUDED by claim filter'
          });
          
          // If task doesn't match claim, suggest why
          if (!claimMatches) {
            console.log('💡 Suggestion: Task might not have claimNumber set. Consider:');
            console.log('   1. Setting task.claimNumber =', claim);
            console.log('   2. Or linking task to a document with claimNumber =', claim);
            console.log('   3. Or removing claim filter to show all tasks for this physician');
          }
        }
      }
      
      // Sample a few tasks to see their physicianId values
      const sampleTasks = await prisma.task.findMany({
        take: 5,
        where: { physicianId },
        select: {
          id: true,
          physicianId: true,
          patient: true,
          description: true,
          status: true,
          claimNumber: true,
          documentId: true
        }
      });
      console.log('📋 Sample tasks from DB:', JSON.stringify(sampleTasks, null, 2));
    }

    return NextResponse.json({ tasks: tasksWithURAndPriority, totalCount });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}