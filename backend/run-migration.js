const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migration...');
    
    // Add evaluation columns
    await client.query(`
      ALTER TABLE oracle.oddyssey_slips 
      ADD COLUMN IF NOT EXISTS evaluation_data JSONB DEFAULT '{}'
    `);
    console.log('✅ Added evaluation_data column');
    
    await client.query(`
      ALTER TABLE oracle.oddyssey_slips 
      ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0
    `);
    console.log('✅ Added correct_count column');
    
    await client.query(`
      ALTER TABLE oracle.oddyssey_slips 
      ADD COLUMN IF NOT EXISTS final_score DECIMAL(10,2) DEFAULT 0
    `);
    console.log('✅ Added final_score column');
    
    await client.query(`
      ALTER TABLE oracle.oddyssey_slips 
      ADD COLUMN IF NOT EXISTS leaderboard_rank INTEGER
    `);
    console.log('✅ Added leaderboard_rank column');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_evaluation_data 
      ON oracle.oddyssey_slips USING GIN (evaluation_data)
    `);
    console.log('✅ Created evaluation_data index');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_correct_count 
      ON oracle.oddyssey_slips (correct_count DESC)
    `);
    console.log('✅ Created correct_count index');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_final_score 
      ON oracle.oddyssey_slips (final_score DESC)
    `);
    console.log('✅ Created final_score index');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_leaderboard_rank 
      ON oracle.oddyssey_slips (leaderboard_rank ASC)
    `);
    console.log('✅ Created leaderboard_rank index');
    
    // Create slip_evaluation_jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS oracle.slip_evaluation_jobs (
        id SERIAL PRIMARY KEY,
        cycle_id INTEGER NOT NULL REFERENCES oracle.oddyssey_cycles(cycle_id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_slips INTEGER NOT NULL DEFAULT 0,
        processed_slips INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created slip_evaluation_jobs table');
    
    // Create indexes for slip_evaluation_jobs
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_slip_evaluation_jobs_cycle_id 
      ON oracle.slip_evaluation_jobs (cycle_id)
    `);
    console.log('✅ Created slip_evaluation_jobs cycle_id index');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_slip_evaluation_jobs_status 
      ON oracle.slip_evaluation_jobs (status)
    `);
    console.log('✅ Created slip_evaluation_jobs status index');
    
    // Verify the changes
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'oracle' 
        AND table_name = 'oddyssey_slips' 
        AND column_name IN ('evaluation_data', 'correct_count', 'final_score', 'leaderboard_rank')
      ORDER BY column_name
    `);
    
    console.log('📊 Migration verification:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
