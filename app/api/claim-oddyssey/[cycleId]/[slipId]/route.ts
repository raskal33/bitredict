import { NextRequest, NextResponse } from 'next/server';
import { OddysseyContractService } from '@/services/oddysseyContractService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string; slipId: string }> }
) {
  try {
    const { cycleId, slipId } = await params;
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json({
        success: false,
        error: 'User address is required'
      }, { status: 400 });
    }

    console.log('🏆 Claiming Oddyssey prize:', { cycleId, slipId, userAddress });

    // Validate parameters
    const cycleIdNum = parseInt(cycleId);
    const slipIdNum = parseInt(slipId);

    if (isNaN(cycleIdNum) || isNaN(slipIdNum)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid cycle ID or slip ID'
      }, { status: 400 });
    }

    // Call the contract service to claim prize
    const result = await OddysseyContractService.claimPrize(cycleIdNum, slipIdNum);

    if (result.success) {
      console.log('✅ Oddyssey prize claimed successfully:', result.transactionHash);
      
      return NextResponse.json({
        success: true,
        transactionHash: result.transactionHash,
        claimedAmount: result.prizeAmount,
        message: 'Prize claimed successfully'
      });
    } else {
      console.error('❌ Oddyssey prize claim failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to claim prize'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in Oddyssey prize claim API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
