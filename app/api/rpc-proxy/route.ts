import { NextRequest, NextResponse } from 'next/server';

// ✅ Excluded from static export (proxied to backend via vercel.json)
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const runtime = 'nodejs';

// SECURITY FIX: Remove hardcoded API key from RPC URL
const RPC_URLS = [
  'https://dream-rpc.somnia.network/',
  process.env.ANKR_RPC_URL || 'https://rpc.ankr.com/somnia_testnet',
];

// SECURITY FIX: Rate limiting store (in-memory, simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

// SECURITY FIX: Allowed origins for CORS
const getAllowedOrigin = (origin: string | null): string | null => {
  if (!origin) return null;
  
  const allowedOrigins = [
    'https://bitredict.xyz',
    'https://www.bitredict.xyz',
    'https://bitredict.vercel.app',
    'https://bitredict.io',
    ...(process.env.NODE_ENV === 'development' 
      ? ['http://localhost:8080', 'http://localhost:3000'] 
      : [])
  ];
  
  return allowedOrigins.includes(origin) ? origin : null;
};

// SECURITY FIX: Validate JSON-RPC request
function validateRpcRequest(body: string): { valid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(body);
    
    // Must be valid JSON-RPC 2.0 format
    if (!parsed.jsonrpc || parsed.jsonrpc !== '2.0') {
      return { valid: false, error: 'Invalid JSON-RPC version' };
    }
    
    if (!parsed.method || typeof parsed.method !== 'string') {
      return { valid: false, error: 'Missing or invalid method' };
    }
    
    // Block dangerous methods
    const blockedMethods = ['eth_sendTransaction', 'eth_sign', 'personal_sign'];
    if (blockedMethods.includes(parsed.method)) {
      return { valid: false, error: 'Method not allowed' };
    }
    
    // Limit request size (prevent DoS)
    if (body.length > 100000) { // 100KB max
      return { valid: false, error: 'Request too large' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

// SECURITY FIX: Rate limiting check
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'Access-Control-Allow-Origin': getAllowedOrigin(request.headers.get('origin')) || '',
          }
        }
      );
    }
    
    const body = await request.text();
    
    // SECURITY FIX: Validate request
    const validation = validateRpcRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request' },
        { status: 400 }
      );
    }
    
    // Try each RPC URL until one works
    for (const rpcUrl of RPC_URLS) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const data = await response.text();
          const origin = getAllowedOrigin(request.headers.get('origin'));
          
          return new NextResponse(data, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin || '',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          });
        }
      } catch (error) {
        console.warn(`RPC URL ${rpcUrl} failed:`, error);
        continue;
      }
    }

    // If all RPC URLs fail
    return NextResponse.json(
      { error: 'All RPC endpoints failed' },
      { status: 503 }
    );
  } catch (error) {
    console.error('RPC Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal proxy error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = getAllowedOrigin(request.headers.get('origin'));
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}