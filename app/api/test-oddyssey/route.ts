import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Test API: Starting test...');
    
    const backendUrl = 'https://bitredict-backend.fly.dev';
    
    // Test health endpoint
    console.log('🧪 Test API: Testing health endpoint...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health response:', healthData);
    
    // Test matches endpoint
    console.log('🧪 Test API: Testing matches endpoint...');
    const matchesResponse = await fetch(`${backendUrl}/api/oddyssey/matches`);
    const matchesData = await matchesResponse.json();
    console.log('✅ Matches response:', matchesData);
    
    // Test stats endpoint
    console.log('🧪 Test API: Testing stats endpoint...');
    const statsResponse = await fetch(`${backendUrl}/api/oddyssey/stats?type=global`);
    const statsData = await statsResponse.json();
    console.log('✅ Stats response:', statsData);
    
    return NextResponse.json({
      success: true,
      health: healthData,
      matches: matchesData,
      stats: statsData,
      message: 'All backend endpoints tested successfully'
    });
    
  } catch (error) {
    console.error('❌ Test API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Backend test failed'
    }, { status: 500 });
  }
} 