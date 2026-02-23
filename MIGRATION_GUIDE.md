# Migration Guide - EcoLoop Backend Updates

## Overview
This guide covers the updates made to integrate AI service, fix CORS, add marketplace endpoint, and update user roles.

## Database Migration Required

**IMPORTANT**: You must run Prisma migrations after these changes:

```bash
# Generate Prisma Client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_ai_fields_and_lowercase_roles
```

## Changes Summary

### 1. User Roles (Lowercase)
- Changed `UserRole` enum from `SELLER/BUYER` to `seller/buyer` (lowercase)
- Updated default role to `seller`
- Registration now validates role as lowercase "seller" | "buyer"
- All role checks now use lowercase comparison

### 2. Listing Model Updates
Added new fields to `Listing` model:
- `createType`: "ai" | "manual" (default: "manual")
- `detectedItems`: string[] (array of detected items from AI)
- `totalWeight`: Float? (weight from AI analysis)
- `carbonFootprint`: Float? (carbon footprint from AI)
- `state`: String? (for marketplace filtering)

### 3. AI Integration
- New endpoint: `POST /api/v1/listings` with `createType` field
- When `createType === "ai"`:
  - Requires image upload
  - Calls AI service at `{AI_SERVICE_URL}/analyze`
  - Stores: `total_weight`, `total_carbon_footprint`, `detected_items`
- When `createType === "manual"`:
  - Requires `weight` and `material` fields
  - Stores directly without AI analysis

### 4. Marketplace Endpoint
- New route: `GET /api/v1/marketplace`
- Query parameter: `state` (optional)
- Filters by state (case-insensitive)
- Sorted by `createdAt` descending (newest first)
- Removed lat/long filtering

### 5. CORS Configuration
- Uses `FRONTEND_URL` environment variable
- Falls back to `CORS_ORIGIN` if `FRONTEND_URL` not set
- Explicitly allows: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Handles preflight requests properly

### 6. Error Handling
- AI service failures return 502 Bad Gateway
- Proper try/catch in all async controllers
- Fallback route: `app.use('*', ...)` returns 404 for unmatched routes

### 7. Environment Variables
Added/Updated:
```env
AI_SERVICE_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000
```

## API Changes

### Register Endpoint
**Before:**
```json
{
  "role": "SELLER"  // or "BUYER"
}
```

**After:**
```json
{
  "role": "seller"  // or "buyer" (lowercase required)
}
```

### Create Listing Endpoint
**New Required Field:**
```json
{
  "createType": "ai" | "manual",
  // ... other fields
}
```

**For AI creation:**
```json
{
  "createType": "ai",
  "title": "Waste Material",
  "price": 1000,
  // image file in multipart/form-data
}
```

**For Manual creation:**
```json
{
  "createType": "manual",
  "title": "Waste Material",
  "weight": 50,
  "material": "Plastic",
  "materialType": "PLASTIC",
  "price": 1000
}
```

### New Marketplace Endpoint
```
GET /api/v1/marketplace?state=lagos
```

## Testing Checklist

- [ ] Run Prisma migrations
- [ ] Test user registration with lowercase roles
- [ ] Test AI listing creation with image upload
- [ ] Test manual listing creation
- [ ] Test marketplace endpoint with state filter
- [ ] Test CORS from frontend
- [ ] Test AI service failure handling (502 response)
- [ ] Verify all routes are accessible

## Breaking Changes

1. **User Role Values**: Must use lowercase "seller" | "buyer"
2. **Listing Creation**: Now requires `createType` field
3. **Database Schema**: Requires migration before deployment

## Rollback Plan

If issues occur:
1. Revert Prisma schema changes
2. Run: `npx prisma migrate reset`
3. Restore previous migration
4. Update code to handle both old and new role formats temporarily

