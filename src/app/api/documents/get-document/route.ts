import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/services/authSErvice';
import CryptoJS from 'crypto-js';
// import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('🚀 API Route HIT: /api/documents/get-document');

  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.fastapi_token) {
      console.log('❌ No session token found');
      return NextResponse.json(
        { error: 'Unauthorized - No valid session token' },
        { status: 401 }
      );
    }

    console.log('✅ Session token found, proceeding with request');

    // Extract query parameters from the request
    const { searchParams } = new URL(request.url);
    const patientName = searchParams.get('patient_name');
    const dob = searchParams.get('dob');
    const doi = searchParams.get('doi');
    const claimNumber = searchParams.get('claim_number');
    const physicianId = searchParams.get('physicianId');
    const mode = searchParams.get('mode');

    // Validate required parameters
    if (!patientName || !physicianId) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: patient_name and physicianId are required'
        },
        { status: 400 }
      );
    }

    // Get encryption secret from environment variables
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
    if (!ENCRYPTION_SECRET) {
      console.error('❌ Encryption secret not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Build the Python API URL with query parameters
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL;
    if (!pythonApiUrl) {
      return NextResponse.json(
        { error: 'Python API URL not configured' },
        { status: 500 }
      );
    }

    // Construct the full URL with parameters
    const params = new URLSearchParams({
      patient_name: patientName,
      physicianId: physicianId,
      ...(dob && { dob: dob }),
    });

    // Add optional parameters if they exist
    if (doi) params.set('doi', doi);
    if (claimNumber) params.set('claim_number', claimNumber);
    if (mode) params.set('mode', mode);

    const fullUrl = `${pythonApiUrl}/api/documents/document?${params.toString()}`;

    console.log('Proxying document request to Python API:', fullUrl);

    // Make the request to the Python API
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user.fastapi_token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle different response statuses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', response.status, errorText);

      return NextResponse.json(
        {
          error: `Failed to fetch document: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();
    console.log('✅ Successfully retrieved document data from Python API');

    // Sort documents to show unverified/unreviewed first
    if (data && typeof data === 'object') {
      // Sort document_summaries if present
      if (Array.isArray(data.document_summaries)) {
        console.log('📋 Before sorting - document_summaries count:', data.document_summaries.length);
        console.log('📋 Sample status:', data.document_summaries.slice(0, 3).map((d: any) => ({
          type: d.type,
          status: d.status
        })));

        data.document_summaries = data.document_summaries.sort((a: any, b: any) => {
          // Check if status is "Reviewed" (case-insensitive)
          const aReviewed = (a.status || '').toLowerCase() === 'reviewed';
          const bReviewed = (b.status || '').toLowerCase() === 'reviewed';
          
          // Unreviewed comes first, reviewed comes later
          if (aReviewed !== bReviewed) {
            return aReviewed ? 1 : -1; // false before true
          }
          
          // If both have same review status, sort by date (newest first)
          const aDate = new Date(a.date || a.created_at || 0).getTime();
          const bDate = new Date(b.date || b.created_at || 0).getTime();
          return bDate - aDate;
        });
        
        console.log('📋 After sorting - first 3 docs:', data.document_summaries.slice(0, 3).map((d: any) => ({
          type: d.type,
          status: d.status,
          date: d.date
        })));
      }

      // Sort documents array if present
      if (Array.isArray(data.documents)) {
        console.log('📄 Before sorting - documents count:', data.documents.length);
        
        data.documents = data.documents.sort((a: any, b: any) => {
          // Check if status is "Reviewed" (case-insensitive)
          const aReviewed = (a.status || '').toLowerCase() === 'reviewed';
          const bReviewed = (b.status || '').toLowerCase() === 'reviewed';
          
          // Unreviewed comes first, reviewed comes later
          if (aReviewed !== bReviewed) {
            return aReviewed ? 1 : -1; // false before true
          }
          
          // If both have same review status, sort by date (newest first)
          const aDate = new Date(a.date || a.created_at || a.createdAt || 0).getTime();
          const bDate = new Date(b.date || b.created_at || b.createdAt || 0).getTime();
          return bDate - aDate;
        });
        
        console.log('📄 After sorting - first 3 docs:', data.documents.slice(0, 3).map((d: any) => ({
          id: d.id,
          status: d.status
        })));
      }
    }

    // Encrypt the data before sending to client
    console.log('🔐 Encrypting response data...');
    const dataString = JSON.stringify(data);
    const encryptedData = CryptoJS.AES.encrypt(dataString, ENCRYPTION_SECRET).toString();
    
    console.log('📦 Response encrypted. Data size:', {
      original: dataString.length,
      encrypted: encryptedData.length,
      encryption_algorithm: 'AES'
    });

    // Return encrypted data
    const responsePayload = {
      encrypted: true,
      data: encryptedData,
      route_marker: 'nextjs-api-route-hit',
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending encrypted response from Next.js API route');
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('❌ Error in document proxy API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}