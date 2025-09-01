# Vercel Environment Variables Configuration

## Required Environment Variables for Production

Set these environment variables in your Vercel dashboard:

### Backend API Configuration
```bash
NEXT_PUBLIC_API_URL=https://bitredict-backend.fly.dev
NEXT_PUBLIC_API_BASE_URL=https://bitredict-backend.fly.dev
BACKEND_URL=https://bitredict-backend.fly.dev
NEXT_PUBLIC_BACKEND_URL=https://bitredict-backend.fly.dev
```

### Contract Addresses
```bash
NEXT_PUBLIC_ODDYSSEY_ADDRESS=0x31AfDC3978317a1de606e76037429F3e456015C6
NEXT_PUBLIC_BITREDICT_POOL_ADDRESS=0x5F112bD56Eaa805DffF4b2929d9D44B2d364Cd08
```

### RPC Configuration
```bash
NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network/
NEXT_PUBLIC_CHAIN_ID=50312
```

### App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://bitredict.vercel.app
NODE_ENV=production
```

## Important Notes

1. **All localhost references have been removed** from the codebase
2. **Default fallbacks now point to production** (`https://bitredict-backend.fly.dev`)
3. **Environment variables take precedence** over defaults
4. **Frontend will work correctly** even if some env vars are missing (uses production defaults)

## Verification

After setting these variables in Vercel:
1. Redeploy your frontend
2. Check browser network tab to ensure API calls go to `bitredict-backend.fly.dev`
3. Verify Odyssey matches load correctly
4. Test all major features (predictions, slips, results)

## Development vs Production

- **Development**: Uses localhost when running locally
- **Production**: Uses `https://bitredict-backend.fly.dev` as default
- **Environment variables**: Override defaults when set in Vercel
