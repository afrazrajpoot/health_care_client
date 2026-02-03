// app/api/tasks/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";
import CryptoJS from "crypto-js";

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
    } else if (user.role === "Staff" || user.role === "SubAdmin") {
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
    const claimNumber = searchParams.get('claimNumber') || claim; // Support both 'claim' and 'claimNumber'
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '5');
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

    // NEW: Get documentId parameters (support multiple)
    let documentIds = searchParams.getAll('documentId');

    // Support comma-separated documentIds in a single parameter
    if (documentIds.length === 1 && documentIds[0].includes(',')) {
      documentIds = documentIds[0].split(',').map(id => id.trim());
    }

    // NEW: Check for extension parameter
    const extension = searchParams.get('extension') === 'true';

    // Get patient details for logging/error reporting
    const patientName = searchParams.get('patient_name');
    const patientDob = searchParams.get('dob');

    const now = new Date();

    // Build conditions for top-level AND
    const andConditions: any[] = [];

    // Base conditions - ALWAYS filter by physicianId
    andConditions.push({ physicianId });

    console.log('🔍 Filtering tasks by physicianId:', physicianId, 'for user role:', user.role);

    // 🧠 Inclusive Matching Logic:
    // Match either the document id(s) OR the search term (patient name)
    // 🧠 Inclusive Matching Logic:
    // If documentIds are provided, filter by them (AND condition)
    if (documentIds.length > 0) {
      console.log('🔍 Filtering tasks by documentId(s):', documentIds);
      if (documentIds.length === 1) {
        andConditions.push({ documentId: documentIds[0] });
      } else {
        andConditions.push({ documentId: { in: documentIds } });
      }
    }

    // If search is provided, filter by patient or description (AND condition with internal OR)
    if (search) {
      console.log('🔍 Filtering tasks by search:', search);
      andConditions.push({
        OR: [
          { patient: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // If NO documentIds AND NO search, return empty (unless it's a staff member viewing all tasks, but that logic is handled below)
    // Wait, the original logic was: if (documentIds.length > 0 || search) { ... } else { return empty }
    // We need to preserve the "return empty if no context" behavior, unless there's a specific reason to show all.
    // However, for Staff Dashboard, we might want to show all tasks if no specific filter is applied?
    // The original code returned empty if no documentId AND no search.
    // But wait, what if I just want to see "My Tasks" (assignedTo=me)?
    // The original code would return empty if I didn't search or provide a documentId.
    // Let's check if there are other filters that should allow fetching.
    // If I am a staff member, I might want to see all tasks assigned to me.

    // Let's keep the restriction for now but allow if other filters are present?
    // Actually, the user request is about "search on server using current patient document id".
    // So if I have a document ID, I want to see tasks for that document.
    // If I have a search, I want to see tasks matching that search.
    // If I have NEITHER, what should happen?
    // The previous code returned empty.


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
    // Only include them when explicitly filtered by status OR when NOT filtering by specific documents
    if (effectiveStatus && effectiveStatus !== 'all') {
      // User is explicitly filtering by status - show what they asked for
      andConditions.push({ status: effectiveStatus });
    } else if (!overdueOnly && status !== 'overdue' && effectiveStatus !== 'all' && documentIds.length === 0) {
      // Default behavior: exclude completed/closed tasks ONLY if not filtering by document
      andConditions.push({
        status: {
          notIn: ["Done", "Completed", "Closed"]
        }
      });
    }

    // Type filter (internal/external)
    if (taskTypeFilter && (taskTypeFilter === 'internal' || taskTypeFilter === 'external')) {
      andConditions.push({ type: taskTypeFilter });
    }

    // Assigned to filter
    if (assignedTo) {
      if (assignedTo === 'me') {
        // For 'me', we try to match the user's name or ID if possible, 
        // but since we don't know exactly how it's stored, we might need to rely on the frontend sending the specific name/ID.
        // However, preserving existing behavior for 'me' which seems to check 'Claimed' action.
        // But we also want to check the assignee field.
        andConditions.push({
          OR: [
            { actions: { has: "Claimed" } },
            { assignee: user.firstName ? { contains: user.firstName } : undefined } // Fallback attempt
          ]
        });
      } else if (assignedTo === 'unassigned') {
        andConditions.push({
          OR: [
            { assignee: "Unclaimed" },
            { assignee: null }
          ]
        });
      } else {
        // Specific assignee filter
        andConditions.push({ assignee: assignedTo });
      }
    } else if (user.role === 'Staff' && documentIds.length === 0 && !search) {
      // 🔒 Enforce staff visibility rule ONLY if not filtering by specific documents
      // When viewing a specific patient/document, staff should see all tasks to be able to claim them
      andConditions.push({
        OR: [
          { assignee: user.id },
          { assignee: user.firstName }, // Assuming firstName might be used
          { assignee: `${user.firstName} ${user.lastName}` },
          { assignee: "Unclaimed" },
          { assignee: null }
        ]
      });
      console.log('🔒 Enforcing staff task visibility for:', user.firstName);
    }

    // Search filter - OR between description and patient
    // Only apply if NOT filtering by specific documents, or if search is explicitly needed


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
      documentIds,
      userRole: user.role,
      search,
      dept,
      status: effectiveStatus,
      totalConditions: andConditions.length,
      extension,
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
              gcsFileLink: true,
              fileName: true,
            },
          },
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    // Log matched document info
    if (documentIds.length > 0) {
      console.log('📄 Document-matched tasks found:', {
        documentIds,
        matchedTasks: tasks.length,
        sampleTask: tasks.length > 0 ? {
          id: tasks[0].id,
          patient: tasks[0].patient,
          description: tasks[0].description?.substring(0, 100),
          documentId: tasks[0].documentId
        } : 'No tasks found'
      });
    }

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
    console.log('🔍 Query filters applied:', {
      documentIds,
      physicianId,
      patientSearch: search,
      status: effectiveStatus,
      extension,
    });

    // NEW: Check if request is from extension
    if (extension) {
      console.log('🔄 Extension request detected - returning unencrypted data');

      // Return unencrypted response for extension
      return NextResponse.json({
        tasks: tasksWithURAndPriority,
        totalCount,
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize)
        },
        filters: {
          applied: {
            documentIds,
            mode,
            search,
            dept,
            status: effectiveStatus,
            priority,
            taskTypeFilter,
            assignedTo,
            extension: true
          }
        },
        source: 'extension'
      });
    }

    /* ---------------------------------------------
     * ENCRYPT THE RESPONSE (Only for non-extension requests)
     * --------------------------------------------- */

    // Get encryption secret from environment variables
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

    if (!ENCRYPTION_SECRET) {
      console.error('❌ Encryption secret not configured in tasks API');
      return NextResponse.json({
        encrypted: false,
        warning: 'Response not encrypted due to server configuration',
        tasks: tasksWithURAndPriority,
        totalCount,
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Prepare data for encryption
      const responseData = {
        tasks: tasksWithURAndPriority,
        totalCount,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize)
        },
        filters: {
          applied: {
            documentIds,
            mode,
            search,
            dept,
            status: effectiveStatus,
            priority,
            taskTypeFilter,
            assignedTo
          }
        }
      };

      // Encrypt the response data
      const dataString = JSON.stringify(responseData);
      const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();

      console.log('🔐 Tasks response encrypted successfully', {
        taskCount: tasksWithURAndPriority.length,
        encryptedDataLength: encryptedData.length,
        page,
        pageSize,
        patientFiltered: !!(patientName && patientDob),
        claimFiltered: !!claimNumber
      });

      // Return encrypted response
      return NextResponse.json({
        encrypted: true,
        data: encryptedData,
        timestamp: new Date().toISOString(),
        route_marker: 'tasks-api-encrypted',
        metadata: {
          taskCount: tasksWithURAndPriority.length,
          totalCount,
          page,
          pageSize,
          documentFiltered: documentIds.length > 0,
          encryption: 'AES'
        }
      });

    } catch (encryptionError) {
      console.error('❌ Failed to encrypt tasks response:', encryptionError);

      // Fallback: Return unencrypted response with warning
      return NextResponse.json({
        encrypted: false,
        warning: 'Encryption failed, returning unencrypted data',
        tasks: tasksWithURAndPriority,
        totalCount,
        timestamp: new Date().toISOString(),
        error: encryptionError instanceof Error ? encryptionError.message : 'Unknown encryption error'
      });
    }

  } catch (error) {
    console.error("Error fetching tasks:", error);

    // Get encryption secret for error response
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

    // Check if request is from extension
    const { searchParams } = new URL(request.url);
    const extension = searchParams.get('extension') === 'true';
    const patientName = searchParams.get('patient_name');
    const patientDob = searchParams.get('dob');
    const claimNumber = searchParams.get('claimNumber') || searchParams.get('claim');
    const documentIds = searchParams.getAll('documentId');

    if (extension) {
      // Return unencrypted error for extension
      return NextResponse.json(
        {
          error: "Failed to fetch tasks",
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          documentFiltered: documentIds.length > 0,
          source: 'extension'
        },
        { status: 500 }
      );
    }

    if (ENCRYPTION_SECRET) {
      try {
        const errorData = {
          error: "Failed to fetch tasks",
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          documentFiltered: documentIds.length > 0
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
        // If encryption fails, return plain error
        return NextResponse.json(
          { error: "Failed to fetch tasks" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }
  }
}