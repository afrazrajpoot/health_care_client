// app/api/documents/recent/route.ts (or adjust path as needed for your Next.js app router structure)
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/services/authSErvice';


const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const physicianId = session.user.id; // Assuming physicianId matches session.user.id; adjust if stored differently (e.g., session.user.physicianId)

    const documents = await prisma.document.findMany({
      select: {
        patientName: true,
        dob: true,
        claimNumber: true,
      },
      where: {
        physicianId: physicianId,
      },
      distinct: ['claimNumber'],
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching recent documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent documents' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}