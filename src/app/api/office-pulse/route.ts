// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust the import path to your Prisma client

export async function GET() {
  try {
    const now = new Date(); // Use dynamic current date

    // Fetch all tasks with optional document relation
    const tasks = await prisma.task.findMany({
      include: {
        document: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Aggregate statistics by department
    const deptStats: { [key: string]: { open: number; overdue: number; unclaim: number } } = {};
    
    tasks.forEach((task: any) => {
      const dept = task.department;
      if (!deptStats[dept]) {
        deptStats[dept] = { open: 0, overdue: 0, unclaim: 0 };
      }

      const isOpen = task.status !== 'Done';
      if (isOpen) {
        deptStats[dept].open += 1;
        if (task.dueDate && new Date(task.dueDate) < now) {
          deptStats[dept].overdue += 1;
        }
      }

      if (!task.actions.includes('Claimed')) {
        deptStats[dept].unclaim += 1;
      }
    });

    // Compute overall totals for KPI
    const totalOpen = Object.values(deptStats).reduce((sum, stats) => sum + stats.open, 0);
    const totalOverdue = Object.values(deptStats).reduce((sum, stats) => sum + stats.overdue, 0);
    const totalUnclaim = Object.values(deptStats).reduce((sum, stats) => sum + stats.unclaim, 0);

    // Format for pulse (matching the frontend structure)
    const pulse = {
      depts: Object.entries(deptStats).map(([department, stats]) => ({
        department,
        open: stats.open,
        overdue: stats.overdue,
        unclaimed: stats.unclaim,
      })),
      labels: ['Total Open', 'Total Overdue', 'Total Unclaimed'],
      vals: [totalOpen, totalOverdue, totalUnclaim],
    };

    return NextResponse.json({ tasks, pulse });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}