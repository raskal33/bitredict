import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('address');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/preferences?address=${userAddress}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data, message: 'Preferences fetched successfully' });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    
    // Fallback to mock data
    const mockData = {
      autoEvaluate: false,
      autoClaim: true,
      notifications: true
    };

    return NextResponse.json({ 
      success: true, 
      data: mockData, 
      message: 'Using mock data - backend connection failed' 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { autoEvaluate, autoClaim, notifications } = body;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bitredict-backend.fly.dev';

    const response = await fetch(`${backendUrl}/api/oddyssey/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoEvaluate, autoClaim, notifications }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update preferences' 
    });
  }
} 