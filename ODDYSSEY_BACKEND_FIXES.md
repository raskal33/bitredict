# 🎯 Odyssey Backend Fixes

## Problem 1: Cycle Synchronization Issue

### Current Problem
- Backend creates cycles in database but if contract transaction fails, it still increments cycle ID
- This creates inconsistency between DB and contract cycle IDs
- Multiple cycles can be created in DB without corresponding contract cycles

### Solution: Transaction-First Cycle Creation

#### 1. Update Cycle Creation Logic (`backend/services/oddyssey-manager.js`)

```javascript
// BEFORE (problematic approach):
async createNewCycle() {
  // 1. Create cycle in DB first
  const dbCycle = await this.createCycleInDatabase();
  
  // 2. Try to create on contract
  try {
    await this.createCycleOnContract(dbCycle.id);
  } catch (error) {
    // DB cycle already created, but contract failed!
    console.error('Contract creation failed, but DB cycle exists:', dbCycle.id);
  }
}

// AFTER (transaction-first approach):
async createNewCycle() {
  console.log('🔄 Starting cycle creation with transaction-first approach...');
  
  // 1. Check if we need a new cycle
  const currentContractCycle = await this.getCurrentContractCycle();
  const currentDbCycle = await this.getCurrentDbCycle();
  
  // If contract cycle exists but DB doesn't, sync DB to contract
  if (currentContractCycle && !currentDbCycle) {
    console.log('📊 Syncing DB to existing contract cycle:', currentContractCycle.id);
    await this.syncDbToContractCycle(currentContractCycle);
    return;
  }
  
  // If both exist and are synced, no action needed
  if (currentContractCycle && currentDbCycle && currentContractCycle.id === currentDbCycle.cycle_id) {
    console.log('✅ Cycles already synced, no action needed');
    return;
  }
  
  // 2. Create cycle on contract FIRST
  let contractCycleId;
  let txHash;
  
  try {
    console.log('📝 Creating cycle on contract...');
    const contractResult = await this.createCycleOnContract();
    contractCycleId = contractResult.cycleId;
    txHash = contractResult.txHash;
    console.log('✅ Contract cycle created:', contractCycleId);
  } catch (error) {
    console.error('❌ Contract cycle creation failed:', error);
    // CRITICAL: Don't create DB cycle if contract fails
    throw new Error(`Contract cycle creation failed: ${error.message}`);
  }
  
  // 3. Only create DB cycle after successful contract creation
  try {
    console.log('💾 Creating cycle in database...');
    const dbCycle = await this.createCycleInDatabase(contractCycleId, txHash);
    console.log('✅ Database cycle created:', dbCycle.cycle_id);
  } catch (error) {
    console.error('❌ Database cycle creation failed:', error);
    // This is bad but less critical - contract cycle exists
    throw new Error(`Database cycle creation failed: ${error.message}`);
  }
  
  console.log('🎉 Cycle creation completed successfully');
}

async createCycleOnContract() {
  // Implementation that creates cycle on contract
  // Returns { cycleId, txHash }
  const matches = await this.getSelectedMatches();
  
  const tx = await this.oddysseyContract.createCycle(matches, {
    gasLimit: 5000000,
    gasPrice: await this.getGasPrice()
  });
  
  const receipt = await tx.wait();
  
  // Get the created cycle ID from events
  const cycleCreatedEvent = receipt.events?.find(e => e.event === 'CycleCreated');
  const cycleId = cycleCreatedEvent?.args?.cycleId;
  
  return {
    cycleId: cycleId.toNumber(),
    txHash: receipt.transactionHash
  };
}

async syncDbToContractCycle(contractCycle) {
  // Sync database to match existing contract cycle
  const matches = await this.getContractCycleMatches(contractCycle.id);
  
  await this.db.query(`
    INSERT INTO oracle.oddyssey_cycles (
      cycle_id, created_at, updated_at, matches_count, 
      matches_data, cycle_start_time, cycle_end_time, 
      is_resolved, tx_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (cycle_id) DO NOTHING
  `, [
    contractCycle.id,
    new Date(),
    new Date(),
    matches.length,
    JSON.stringify(matches),
    contractCycle.startTime,
    contractCycle.endTime,
    false,
    contractCycle.txHash
  ]);
}
```

#### 2. Add Cycle Sync Status Endpoint (`backend/routes/oddyssey.js`)

```javascript
// GET /api/oddyssey/cycle-sync-status
router.get('/cycle-sync-status', async (req, res) => {
  try {
    const dbCycle = await getCurrentDbCycle();
    const contractCycle = await getCurrentContractCycle();
    
    const isSynced = dbCycle && contractCycle && dbCycle.cycle_id === contractCycle.id;
    
    res.json({
      success: true,
      data: {
        dbCycleId: dbCycle?.cycle_id || 0,
        contractCycleId: contractCycle?.id || 0,
        isSynced,
        dbCycleExists: !!dbCycle,
        contractCycleExists: !!contractCycle,
        lastSyncCheck: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking cycle sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check cycle sync status'
    });
  }
});

// POST /api/oddyssey/admin/force-cycle-sync
router.post('/admin/force-cycle-sync', async (req, res) => {
  try {
    const result = await oddysseyManager.forceCycleSync();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error forcing cycle sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force cycle sync'
    });
  }
});
```

#### 3. Add Retry Logic with Rollback

```javascript
async createNewCycleWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Cycle creation attempt ${attempt}/${maxRetries}`);
      await this.createNewCycle();
      return; // Success
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Final attempt failed - send alert
        await this.sendCycleCreationAlert(error);
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    }
  }
}
```

## Problem 2: Slip Results Display Issue

### Current Problem
- Slips show wrong match results (10 matches, 6 correct, 4 wrong but all shown as wrong)
- Not displaying real evaluated data from contract
- Frontend not getting actual match results

### Solution: Real Evaluation Data Integration

#### 1. Update Slip Evaluation Logic (`backend/services/oddyssey-evaluator.js`)

```javascript
async evaluateSlipWithRealData(slipId) {
  console.log(`🔍 Evaluating slip ${slipId} with real data...`);
  
  // Get slip from database
  const slip = await this.getSlip(slipId);
  if (!slip) {
    throw new Error(`Slip ${slipId} not found`);
  }
  
  // Get cycle matches with real results
  const cycleMatches = await this.getCycleMatchesWithResults(slip.cycle_id);
  
  // Evaluate each prediction against real results
  const evaluatedPredictions = slip.predictions.map(prediction => {
    const match = cycleMatches.find(m => m.fixture_id === prediction.matchId);
    
    if (!match) {
      return {
        ...prediction,
        isCorrect: null,
        actualResult: null,
        matchResult: null
      };
    }
    
    const isCorrect = this.evaluatePrediction(prediction, match);
    const actualResult = this.getActualResult(match, prediction.betType);
    
    return {
      ...prediction,
      isCorrect,
      actualResult,
      matchResult: {
        homeScore: match.home_score,
        awayScore: match.away_score,
        result: actualResult,
        status: match.status
      }
    };
  });
  
  // Calculate final score
  const correctCount = evaluatedPredictions.filter(p => p.isCorrect === true).length;
  const finalScore = this.calculateFinalScore(evaluatedPredictions);
  
  // Update slip with evaluation results
  await this.updateSlipEvaluation(slipId, {
    predictions: evaluatedPredictions,
    correctCount,
    finalScore,
    isEvaluated: true
  });
  
  console.log(`✅ Slip ${slipId} evaluated: ${correctCount}/10 correct`);
  
  return {
    slipId,
    correctCount,
    finalScore,
    predictions: evaluatedPredictions
  };
}

evaluatePrediction(prediction, match) {
  const { betType, selection } = prediction;
  
  if (betType === 'MONEYLINE') {
    const actualResult = this.getMoneylineResult(match);
    return selection === actualResult;
  } else if (betType === 'OVER_UNDER') {
    const actualResult = this.getOverUnderResult(match);
    return selection === actualResult;
  }
  
  return false;
}

getMoneylineResult(match) {
  if (match.home_score === null || match.away_score === null) {
    return null;
  }
  
  if (match.home_score > match.away_score) return '1';
  if (match.home_score < match.away_score) return '2';
  return 'X';
}

getOverUnderResult(match) {
  if (match.home_score === null || match.away_score === null) {
    return null;
  }
  
  const totalGoals = match.home_score + match.away_score;
  return totalGoals > 2.5 ? 'Over' : 'Under';
}

getActualResult(match, betType) {
  if (betType === 'MONEYLINE') {
    return this.getMoneylineResult(match);
  } else if (betType === 'OVER_UNDER') {
    return this.getOverUnderResult(match);
  }
  return null;
}
```

#### 2. Add Evaluated Slip Endpoints (`backend/routes/oddyssey.js`)

```javascript
// GET /api/oddyssey/slips/:slipId/evaluated
router.get('/slips/:slipId/evaluated', async (req, res) => {
  try {
    const slipId = parseInt(req.params.slipId);
    const slip = await getEvaluatedSlip(slipId);
    
    if (!slip) {
      return res.status(404).json({
        success: false,
        message: 'Slip not found'
      });
    }
    
    res.json({
      success: true,
      data: slip
    });
  } catch (error) {
    console.error('Error getting evaluated slip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get evaluated slip'
    });
  }
});

// GET /api/oddyssey/user-slips/:address/evaluated
router.get('/user-slips/:address/evaluated', async (req, res) => {
  try {
    const address = req.params.address;
    const slips = await getUserSlipsWithEvaluation(address);
    
    res.json({
      success: true,
      data: slips
    });
  } catch (error) {
    console.error('Error getting user slips with evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user slips'
    });
  }
});
```

#### 3. Update Database Schema

```sql
-- Add evaluation fields to oddyssey_slips table
ALTER TABLE oracle.oddyssey_slips 
ADD COLUMN IF NOT EXISTS evaluated_predictions JSONB,
ADD COLUMN IF NOT EXISTS evaluation_timestamp TIMESTAMP;

-- Create index for faster evaluation queries
CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_evaluated 
ON oracle.oddyssey_slips(is_evaluated, evaluation_timestamp);

-- Function to update slip evaluation
CREATE OR REPLACE FUNCTION oracle.update_slip_evaluation(
  p_slip_id INTEGER,
  p_evaluated_predictions JSONB,
  p_correct_count INTEGER,
  p_final_score NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE oracle.oddyssey_slips 
  SET 
    evaluated_predictions = p_evaluated_predictions,
    correct_count = p_correct_count,
    final_score = p_final_score,
    is_evaluated = TRUE,
    evaluation_timestamp = NOW()
  WHERE slip_id = p_slip_id;
END;
$$ LANGUAGE plpgsql;
```

#### 4. Add Real-Time Match Result Updates

```javascript
// Update match results in real-time
async updateMatchResults(cycleId) {
  console.log(`🔄 Updating match results for cycle ${cycleId}...`);
  
  const matches = await this.getCycleMatches(cycleId);
  
  for (const match of matches) {
    try {
      // Get live result from SportMonks API
      const liveResult = await this.getLiveMatchResult(match.fixture_id);
      
      if (liveResult && liveResult.status === 'FT') {
        // Update match result in database
        await this.updateMatchResult(match.fixture_id, liveResult);
        
        // Re-evaluate all slips for this cycle
        await this.reevaluateCycleSlips(cycleId);
      }
    } catch (error) {
      console.error(`Error updating match ${match.fixture_id}:`, error);
    }
  }
}

async reevaluateCycleSlips(cycleId) {
  const slips = await this.getCycleSlips(cycleId);
  
  for (const slip of slips) {
    try {
      await this.evaluateSlipWithRealData(slip.slip_id);
    } catch (error) {
      console.error(`Error re-evaluating slip ${slip.slip_id}:`, error);
    }
  }
}
```

## Implementation Priority

### Phase 1: Cycle Synchronization (Critical)
1. Update cycle creation logic to be transaction-first
2. Add cycle sync status endpoints
3. Implement retry logic with rollback
4. Add monitoring and alerts

### Phase 2: Slip Evaluation (High Priority)
1. Update slip evaluation logic with real data
2. Add evaluated slip endpoints
3. Update database schema
4. Implement real-time result updates

### Phase 3: Frontend Integration
1. Update frontend to use new evaluated slip endpoints
2. Display real match results and correct/incorrect predictions
3. Add cycle sync status monitoring
4. Implement real-time updates

## Testing Checklist

### Cycle Synchronization
- [ ] Test cycle creation with successful contract transaction
- [ ] Test cycle creation with failed contract transaction (should not create DB cycle)
- [ ] Test cycle sync when DB is behind contract
- [ ] Test retry logic with multiple failures
- [ ] Test admin force sync functionality

### Slip Evaluation
- [ ] Test slip evaluation with real match results
- [ ] Test evaluation with missing match results
- [ ] Test real-time result updates
- [ ] Test slip re-evaluation when results change
- [ ] Test frontend display of correct/incorrect predictions

## Monitoring and Alerts

```javascript
// Add monitoring for cycle sync issues
async monitorCycleSync() {
  const syncStatus = await this.checkCycleSync();
  
  if (!syncStatus.isSynced) {
    await this.sendAlert({
      type: 'CYCLE_SYNC_ISSUE',
      message: `Cycle sync issue detected: DB=${syncStatus.dbCycleId}, Contract=${syncStatus.contractCycleId}`,
      severity: 'HIGH'
    });
  }
}

// Add monitoring for evaluation issues
async monitorSlipEvaluation() {
  const unevaluatedSlips = await this.getUnevaluatedSlips();
  
  if (unevaluatedSlips.length > 0) {
    await this.sendAlert({
      type: 'SLIP_EVALUATION_BACKLOG',
      message: `${unevaluatedSlips.length} slips pending evaluation`,
      severity: 'MEDIUM'
    });
  }
}
```

This comprehensive solution addresses both the cycle synchronization issue and the slip evaluation display problem, ensuring data consistency and accurate result display.
