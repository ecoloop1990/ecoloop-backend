#!/bin/bash

echo "🚀 Setting up EcoLoop Backend..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js v20 or higher is required. Current version: $(node -v)"
  exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from env.example..."
  cp env.example .env
  echo "⚠️  Please update .env with your configuration values"
else
  echo "✅ .env file already exists"
fi

# Check if database is configured
echo ""
echo "📊 Database Setup:"
echo "   Make sure PostgreSQL is running and DATABASE_URL is set in .env"
echo ""
echo "   To run migrations:"
echo "   npx prisma migrate dev"
echo ""
echo "   To seed the database:"
echo "   npm run prisma:seed"
echo ""

echo "✨ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""

