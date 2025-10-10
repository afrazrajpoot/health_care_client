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

    // Deduplicate by composite key: patientName + claimNumber + dob + doi
    // Preserve the first occurrence (newest due to orderBy)
    const uniqueKeyMap = new Map<string, typeof documents[0]>();
    documents.forEach(doc => {
      const key = `${doc.patientName}-${doc.claimNumber || ''}-${doc.dob}-${doc.doi}`;
      if (!uniqueKeyMap.has(key)) {
        uniqueKeyMap.set(key, doc);
      }
    });
    const uniqueDocuments = Array.from(uniqueKeyMap.values());

    return NextResponse.json({
      data: uniqueDocuments,
      total: uniqueDocuments.length,  // Use deduplicated count (note: for multi-page, adjust logic if needed)
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