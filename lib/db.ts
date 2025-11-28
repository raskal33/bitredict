// SECURITY FIX: Placeholder database implementation with warning
// This should NOT be used in production - it's a stub that returns mock data
// If this is accidentally used, it will cause data integrity issues

export const query = async (queryString: string, params: unknown[] = []) => {
  // SECURITY FIX: Log warning if this is used in production
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ SECURITY WARNING: Placeholder database query() called in production!');
    console.error('   This is a stub implementation that returns mock data.');
    console.error('   Query:', queryString.substring(0, 100));
    throw new Error('Placeholder database implementation cannot be used in production');
  }
  
  console.warn("⚠️ Using placeholder database - this returns mock data only!");
  console.log("Executing query:", queryString, params);
  
  if (queryString.includes('SUM(bet_amount) as total')) {
    return [{ total: '0' }];
  }
  if (queryString.includes('COUNT(*) as count')) {
    return [{ count: '0' }];
  }
  if (queryString.includes('AVG(CASE WHEN outcome = predicted_outcome THEN 1 END) * 100.0 / COUNT(*) as rate')) {
    return [{ rate: '0' }];
  }
  if (queryString.includes('COUNT(DISTINCT created_by) as count')) {
    return [{ count: '0' }];
  }
  if (queryString.includes('AVG(challenge_score) as avg_score')) {
    return [{ avg_score: '0' }];
  }
  if (queryString.includes('SELECT badge_id')) {
    return [];
  }
  if (queryString.includes('SELECT activity_type')) {
    return [];
  }

  return [];
}; 