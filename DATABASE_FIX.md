# Database Enum Fix Guide

## Problem
The database still has the old enum values (`SELLER`, `BUYER`) but the code expects lowercase values (`seller`, `buyer`).

## Solution

You have two options to fix this:

### Option 1: Run the Fix Script (Recommended)

```bash
# Make sure DATABASE_URL is set in your .env file
./fix-database-enum.sh
```

This script will:
1. Add the new lowercase enum values
2. Update any existing records
3. Guide you through next steps

### Option 2: Manual SQL Fix

Run this SQL directly in your PostgreSQL database:

```sql
-- Add new enum values
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'buyer';

-- Update existing records
UPDATE "User" SET role = 'seller' WHERE role = 'SELLER';
UPDATE "User" SET role = 'buyer' WHERE role = 'BUYER';
```

### Option 3: Complete Database Reset (Development Only)

If you're in development and don't mind losing data:

```bash
# Reset database and apply all migrations
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run seed script (if configured)
```

## After Fixing

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Restart your server:**
   ```bash
   npm run dev
   ```

3. **Test registration:**
   ```json
   POST /api/v1/auth/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "SecurePass123",
     "confirmPassword": "SecurePass123",
     "role": "seller",
     "userType": "INDIVIDUAL",
     "username": "johndoe",
     "termsAccepted": true
   }
   ```

## Important Notes

- PostgreSQL doesn't allow removing enum values directly
- The old `SELLER`/`BUYER` values will remain in the enum but won't be used
- This is safe and won't cause issues
- If you want to completely remove old values, you'd need to recreate the enum type (more complex)

## Verification

After fixing, verify the enum values:

```sql
SELECT unnest(enum_range(NULL::"UserRole"));
```

You should see both old and new values, but only the lowercase ones will be used.

