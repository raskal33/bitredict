-- Add evaluation columns to oddyssey_slips table
-- This migration adds columns needed for detailed slip evaluation data

-- Add evaluation_data column to store detailed evaluation results
ALTER TABLE oracle.oddyssey_slips 
ADD COLUMN IF NOT EXISTS evaluation_data JSONB DEFAULT '{}';

-- Add correct_count column to store number of correct predictions
ALTER TABLE oracle.oddyssey_slips 
ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0;

-- Add final_score column to store total score
ALTER TABLE oracle.oddyssey_slips 
ADD COLUMN IF NOT EXISTS final_score DECIMAL(10,2) DEFAULT 0;

-- Add leaderboard_rank column for ranking
ALTER TABLE oracle.oddyssey_slips 
ADD COLUMN IF NOT EXISTS leaderboard_rank INTEGER;

-- Create index on evaluation_data for better query performance
CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_evaluation_data 
ON oracle.oddyssey_slips USING GIN (evaluation_data);

-- Create index on correct_count for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_correct_count 
ON oracle.oddyssey_slips (correct_count DESC);

-- Create index on final_score for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_final_score 
ON oracle.oddyssey_slips (final_score DESC);

-- Create index on leaderboard_rank for sorting
CREATE INDEX IF NOT EXISTS idx_oddyssey_slips_leaderboard_rank 
ON oracle.oddyssey_slips (leaderboard_rank ASC);

-- Add slip_evaluation_jobs table for tracking evaluation progress
CREATE TABLE IF NOT EXISTS oracle.slip_evaluation_jobs (
  id SERIAL PRIMARY KEY,
  cycle_id INTEGER NOT NULL REFERENCES oracle.oddyssey_cycles(cycle_id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  total_slips INTEGER NOT NULL DEFAULT 0,
  processed_slips INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on slip_evaluation_jobs
CREATE INDEX IF NOT EXISTS idx_slip_evaluation_jobs_cycle_id 
ON oracle.slip_evaluation_jobs (cycle_id);

CREATE INDEX IF NOT EXISTS idx_slip_evaluation_jobs_status 
ON oracle.slip_evaluation_jobs (status);

-- Add comments for documentation
COMMENT ON COLUMN oracle.oddyssey_slips.evaluation_data IS 'Detailed evaluation data for each prediction in the slip';
COMMENT ON COLUMN oracle.oddyssey_slips.correct_count IS 'Number of correct predictions in this slip';
COMMENT ON COLUMN oracle.oddyssey_slips.final_score IS 'Total score for this slip based on correct predictions';
COMMENT ON COLUMN oracle.oddyssey_slips.leaderboard_rank IS 'Rank of this slip in the cycle leaderboard';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'oracle' 
  AND table_name = 'oddyssey_slips' 
  AND column_name IN ('evaluation_data', 'correct_count', 'final_score', 'leaderboard_rank')
ORDER BY column_name;
