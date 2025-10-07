// app/api/documents/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const physicianId = searchParams.get('physicianId');

  if (!physicianId) {
    return NextResponse.json(
      { error: 'Physician ID is required' },
      { status: 400 }
    );
  }

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';

  let baseWhere: any = {
    physicianId,
  };

  if (statusFilter !== 'all') {
    baseWhere.status = statusFilter;
  }

  if (search) {
    baseWhere.patientName = {
      contains: search,
      mode: 'insensitive',
    };
  }

  const whereClause = baseWhere;

  try {
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          summarySnapshot: true,
          adl: true,
          documentSummary: true,
        },
      }),
      prisma.document.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: documents,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}