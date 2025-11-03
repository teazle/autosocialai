#!/bin/bash

# AutoSocial AI - EC2 Deployment Script
# Run this script on your EC2 instance after initial setup

set -e

echo "🚀 AutoSocial AI - EC2 Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root. Run as ubuntu user.${NC}"
   exit 1
fi

# Check Node.js
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing Node.js 18+...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
fi

# Check PM2
echo "📦 Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing PM2...${NC}"
    sudo npm install -g pm2
else
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2 installed: $PM2_VERSION${NC}"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env and fill in your values before continuing!${NC}"
        echo "Press Enter after you've configured .env..."
        read
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo ""
echo "🔨 Building Next.js application..."
npm run build

# Install worker dependencies
echo ""
echo "📦 Installing worker dependencies..."
cd worker
npm install
cd ..

# Create logs directory
echo ""
echo "📁 Creating logs directory..."
mkdir -p logs
mkdir -p worker/logs

# Stop existing PM2 processes
echo ""
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Start applications
echo ""
echo "🚀 Starting applications with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup (if not already done)
echo ""
echo "⚙️  Setting up PM2 startup..."
STARTUP_CMD=$(pm2 startup systemd | grep -E 'sudo' | head -1)
if [ ! -z "$STARTUP_CMD" ]; then
    echo -e "${YELLOW}⚠️  Run this command to enable auto-start:${NC}"
    echo "$STARTUP_CMD"
    echo ""
    echo "Do you want to run this command now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        eval $STARTUP_CMD
        echo -e "${GREEN}✅ PM2 startup configured${NC}"
    fi
fi

# Show status
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Configure Nginx reverse proxy (see docs/EC2_FULL_STACK.md)"
echo "  2. Setup SSL with Let's Encrypt (see docs/EC2_FULL_STACK.md)"
echo "  3. Update NEXT_PUBLIC_APP_URL in .env to your domain/IP"
echo "  4. View logs: pm2 logs"
echo "  5. Monitor: pm2 monit"
echo ""

