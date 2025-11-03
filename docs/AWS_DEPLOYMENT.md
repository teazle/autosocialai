# AWS Deployment Guide

Complete guide for deploying AutoSocial AI to AWS.

## Overview

Your application has two main components:
1. **Next.js Frontend** - Can deploy to AWS Amplify (recommended) or Elastic Beanstalk
2. **Node.js Worker** - Can deploy to Elastic Beanstalk, EC2, or ECS

## AWS MCP Tools

**Note:** Currently, there isn't a dedicated AWS MCP (Model Context Protocol) server available. However, you can:
- Use AWS CLI/SDK directly
- Use AWS Console for manual deployment
- Use Infrastructure as Code (CloudFormation, Terraform, CDK)

## Deployment Options

### Option 1: AWS Amplify (Recommended for Frontend)

AWS Amplify provides seamless Next.js deployment with automatic builds, CDN, and SSL.

#### Prerequisites for Amplify
- AWS account
- AWS CLI installed and configured
- GitHub repository (or connect directly)

#### Steps

1. **Initialize Amplify in your project:**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. **Initialize Amplify in your repo:**
```bash
amplify init
```

3. **Add hosting:**
```bash
amplify add hosting
```
Select: Hosting with Amplify Console

4. **Deploy:**
```bash
amplify publish
```

#### Environment Variables

Set these in Amplify Console → App Settings → Environment Variables:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
REPLICATE_API_TOKEN=your-replicate-token
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
TIKTOK_CLIENT_KEY=your-tiktok-key
TIKTOK_CLIENT_SECRET=your-tiktok-secret
ENCRYPTION_KEY=your-32-char-key
NEXT_PUBLIC_APP_URL=https://your-amplify-app.amplifyapp.com
```

#### Next.js 14 Configuration

For Next.js 14+, ensure your `amplify.yml` is configured:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

Create `amplify.yml` in your project root.

---

### Option 2: AWS Elastic Beanstalk (Both Frontend & Worker)

Good option for deploying both your Next.js app and worker on AWS.

#### Prerequisites
- AWS account
- EB CLI installed

#### Install EB CLI

```bash
pip install awsebcli --upgrade
eb --version
```

#### Initialize Elastic Beanstalk

From project root:

```bash
eb init -p node.js -r us-east-1 autosocial-ai-app
```

#### Create .ebextensions/ directory

Create `.ebextensions/nextjs.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm run start"
  aws:elasticbeanstalk:application:environment:
    NPM_USE_PRODUCTION: false
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /static: public
    /_next/static: .next/static
```

#### Create Procfile

Create `Procfile` in root:

```
web: npm run start
```

#### Build and Deploy

```bash
npm run build
eb create autosocial-ai-production
eb deploy
```

#### Environment Variables

Set via EB CLI or console:
```bash
eb setenv SUPABASE_URL=https://xxx.supabase.co \
          SUPABASE_ANON_KEY=your-anon-key \
          SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
          GROQ_API_KEY=your-groq-key \
          REPLICATE_API_TOKEN=your-replicate-token \
          META_APP_ID=your-meta-app-id \
          META_APP_SECRET=your-meta-app-secret \
          TIKTOK_CLIENT_KEY=your-tiktok-key \
          TIKTOK_CLIENT_SECRET=your-tiktok-secret \
          ENCRYPTION_KEY=your-32-char-key \
          NEXT_PUBLIC_APP_URL=https://your-app.elasticbeanstalk.com
```

---

### Option 3: EC2 + PM2 (Worker Only)

If you want to keep frontend on Vercel but move worker to AWS EC2.

#### Create EC2 Instance

1. Launch EC2 instance (Ubuntu 22.04 LTS)
2. Instance type: t3.small or t3.medium
3. Configure security group (SSH on port 22)

#### Setup Server

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt-get update
sudo apt-get install -y git

# Clone repository
git clone <your-repo-url>
cd AutoSocialAi/worker
npm install
```

#### Create .env file

```bash
nano .env
# Add all environment variables
```

#### Start Worker

```bash
# From worker directory
pm2 start ../ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
```

#### Setup Auto-Start

Follow PM2 startup instructions to enable auto-start on reboot.

---

## What Information I Need From You

To help you deploy to AWS, please provide:

### Required Information

1. **AWS Account Details:**
   - AWS Account ID (optional, but helpful)
   - Preferred AWS region (e.g., us-east-1, eu-west-1)

2. **Deployment Preference:**
   - Which option do you prefer? (Amplify, Elastic Beanstalk, EC2)
   - Do you want frontend and worker on same platform or separate?

3. **Domain/DNS:**
   - Do you have a custom domain? (optional)
   - What should the app URL be?

4. **Environment Variables:**
   - Confirm all your environment variables are ready
   - These should match your production values

5. **Git Repository:**
   - Is your code in GitHub/GitLab/Bitbucket?
   - Repository URL (for automatic deployments)

6. **OAuth Callback URLs:**
   - Update Meta/TikTok OAuth apps with new AWS URLs after deployment

### Optional Information

- Budget preferences (affects instance types)
- Scaling requirements (traffic expectations)
- Backup preferences
- Monitoring preferences

---

## Quick Start Commands

### For AWS Amplify:

```bash
# Initialize
npm install -g @aws-amplify/cli
amplify configure
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### For Elastic Beanstalk:

```bash
# Install EB CLI
pip install awsebcli --upgrade

# Initialize
eb init -p node.js -r us-east-1 autosocial-ai-app

# Create environment
npm run build
eb create autosocial-ai-production

# Deploy updates
eb deploy
```

### For EC2 (Worker):

```bash
# SSH into instance
ssh -i key.pem ubuntu@your-ec2-ip

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone <repo-url>
cd AutoSocialAi/worker
npm install

# Configure and start
# (Add .env file)
pm2 start ../ecosystem.config.js
pm2 save
pm2 startup
```

---

## Post-Deployment Checklist

1. ✅ Update OAuth callback URLs (Meta, TikTok)
2. ✅ Test admin dashboard access
3. ✅ Test client onboarding flow
4. ✅ Verify worker is running (check logs)
5. ✅ Test content generation
6. ✅ Monitor AWS costs
7. ✅ Setup CloudWatch alarms (optional)
8. ✅ Enable backups (if using RDS instead of Supabase)

---

## Cost Estimates

### AWS Amplify
- Free tier: 1000 build minutes/month, 15 GB storage
- Pay-as-you-go: ~$0.01 per build minute after free tier
- **Estimated:** $10-50/month for small-medium traffic

### Elastic Beanstalk
- Free tier: 750 hours EC2 t2.micro/month
- **Estimated:** $20-100/month (depending on instance)

### EC2 (Worker Only)
- t3.small: ~$15/month
- t3.medium: ~$30/month
- **Estimated:** $15-50/month for worker only

---

## Troubleshooting

### Amplify Build Fails

```bash
# Check build logs in Amplify Console
# Common issues:
# - Missing environment variables
# - Build command issues
# - Dependency installation failures
```

### Elastic Beanstalk Deploy Fails

```bash
# Check logs
eb logs

# SSH into instance
eb ssh

# Check environment variables
eb printenv
```

### Worker Not Running on EC2

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs autosocial-ai-worker

# Restart
pm2 restart all
```

---

## Next Steps

Once you provide the information above, I can:
1. Create specific deployment configuration files
2. Generate CloudFormation templates (if needed)
3. Help with step-by-step deployment
4. Troubleshoot any issues

**Ready to start?** Share your deployment preference and AWS region, and I'll create the necessary configuration files!

