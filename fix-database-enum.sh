#!/bin/bash

# Script to fix UserRole enum in PostgreSQL database
# This script helps migrate from SELLER/BUYER to seller/buyer

echo "🔧 Fixing UserRole enum in database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

echo "📝 Step 1: Adding new enum values..."
psql "$DATABASE_URL" -c "ALTER TYPE \"UserRole\" ADD VALUE IF NOT EXISTS 'seller';" 2>/dev/null || echo "⚠️  seller value may already exist"
psql "$DATABASE_URL" -c "ALTER TYPE \"UserRole\" ADD VALUE IF NOT EXISTS 'buyer';" 2>/dev/null || echo "⚠️  buyer value may already exist"

echo "📝 Step 2: Updating existing records..."
psql "$DATABASE_URL" -c "UPDATE \"User\" SET role = 'seller' WHERE role = 'SELLER';" || echo "⚠️  No SELLER records to update"
psql "$DATABASE_URL" -c "UPDATE \"User\" SET role = 'buyer' WHERE role = 'BUYER';" || echo "⚠️  No BUYER records to update"

echo "✅ Database enum fix completed!"
echo ""
echo "⚠️  Note: PostgreSQL doesn't allow removing enum values directly."
echo "   The old SELLER/BUYER values will remain in the enum but won't be used."
echo ""
echo "📋 Next steps:"
echo "   1. Run: npx prisma generate"
echo "   2. Restart your server"
echo "   3. Test registration with lowercase role values"

