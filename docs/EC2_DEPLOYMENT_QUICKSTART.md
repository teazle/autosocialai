# EC2 Deployment Quick Start Guide

**Complete guide for deploying AutoSocial AI on a single EC2 instance.**

---

## 🎯 Overview

This guide will help you deploy both the Next.js frontend and Node.js worker on a single AWS EC2 instance.

**Estimated time:** 30-60 minutes  
**Cost:** ~$30-35/month (t3.medium instance)

---

## 📋 Prerequisites

- AWS account
- Domain name (optional, can use EC2 IP)
- All API keys ready (Supabase, Groq, Replicate, Meta, TikTok)
- SSH key pair

---

## Step 1: Launch EC2 Instance

### 1.1 Go to EC2 Console

1. Log into [AWS Console](https://console.aws.amazon.com)
2. Navigate to **EC2** → **Instances**
3. Click **Launch Instance**

### 1.2 Configure Instance

**Name:** `autosocial-ai-production`

**AMI (Operating System):**
- **Ubuntu Server 22.04 LTS** (recommended)
- Or **Amazon Linux 2023**

**Instance Type:**
- **t3.medium** (2 vCPU, 4GB RAM) - Recommended
- **t3.small** (2 vCPU, 2GB RAM) - Minimum (may be slow)
- **t3.large** (2 vCPU, 8GB RAM) - For higher traffic

**Key Pair:**
- Create new key pair or select existing
- **Download the `.pem` file** - you'll need it!

**Network Settings:**
- **Security Group:** Create new or use existing
- **Allow SSH (port 22)** from your IP
- **Allow HTTP (port 80)** from anywhere (0.0.0.0/0)
- **Allow HTTPS (port 443)** from anywhere (0.0.0.0/0)

**Storage:**
- **20GB** minimum (gp3 SSD)

### 1.3 Launch Instance

Click **Launch Instance** and wait for it to start.

### 1.4 Note Your Details

- **Public IP:** `xx.xx.xx.xx` (or Elastic IP)
- **Key pair name:** `your-key.pem`

---

## Step 2: Initial Server Setup

### 2.1 SSH into Instance

**Windows (PowerShell):**
```powershell
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**Mac/Linux:**
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version
```

### 2.4 Install PM2

```bash
sudo npm install -g pm2

# Verify
pm2 --version
```

### 2.5 Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Check status
sudo systemctl status nginx
```

### 2.6 Install Git

```bash
sudo apt install -y git
```

---

## Step 3: Clone and Setup Project

### 3.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone <your-repo-url> AutoSocialAi

# Or if private repo, use SSH:
# git clone git@github.com:yourusername/AutoSocialAi.git

cd AutoSocialAi
```

### 3.2 Create Environment File

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
GROQ_API_KEY=your-groq-api-key
REPLICATE_API_TOKEN=your-replicate-token

# Meta (Facebook & Instagram)
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# TikTok
TIKTOK_CLIENT_KEY=your-tiktok-key
TIKTOK_CLIENT_SECRET=your-tiktok-secret

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Application URL (update with your domain or EC2 IP)
NEXT_PUBLIC_APP_URL=http://your-domain.com
# Or: NEXT_PUBLIC_APP_URL=http://your-ec2-ip
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 4: Deploy Application

### 4.1 Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install worker dependencies
cd worker
npm install
cd ..
```

### 4.2 Build Frontend

```bash
npm run build
```

This may take 2-5 minutes. Wait for it to complete.

### 4.3 Create Logs Directories

```bash
mkdir -p logs
mkdir -p worker/logs
```

### 4.4 Start with PM2

```bash
# Start both frontend and worker
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs
```

**You should see:**
- ✅ `autosocial-ai-frontend` - online
- ✅ `autosocial-ai-worker` - online

### 4.5 Setup Auto-Start

```bash
# Save current PM2 configuration
pm2 save

# Generate startup script
pm2 startup

# Run the command it outputs (looks like: sudo env PATH=...)
# Example:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/autosocial-ai
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 IP

    client_max_body_size 10M;

    access_log /var/log/nginx/autosocial-ai-access.log;
    error_log /var/log/nginx/autosocial-ai-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

**Important:** Replace `your-domain.com` with:
- Your actual domain (if you have one)
- OR your EC2 public IP (e.g., `ec2-xx-xx-xx-xx.compute-1.amazonaws.com`)

### 5.2 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/autosocial-ai /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

**Should output:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### 5.3 Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 6: Test Application

### 6.1 Test Frontend

Open your browser and visit:
- `http://your-ec2-ip` (if using IP)
- `http://your-domain.com` (if using domain)

**You should see your admin dashboard!**

### 6.2 Test Worker

```bash
# Check worker logs
pm2 logs autosocial-ai-worker --lines 20

# You should see:
# 🚀 AutoSocial AI Worker Started
# Running initial tasks...
```

### 6.3 Check Status

```bash
pm2 status
```

Both apps should show `online`.

---

## Step 7: Setup SSL (HTTPS)

### 7.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Get SSL Certificate

**If you have a domain:**

```bash
sudo certbot --nginx -d your-domain.com

# Follow prompts:
# - Enter email (for renewal notifications)
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

**If using EC2 IP only:**

You can't use Let's Encrypt with IP addresses. Options:
1. Use a domain name (recommended)
2. Use AWS Certificate Manager with CloudFront
3. Use self-signed certificate (not recommended for production)

### 7.3 Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Step 8: Configure Domain (Optional)

### 8.1 Point Domain to EC2

**If using Route 53:**
1. Go to Route 53 → Hosted Zones
2. Create A record:
   - **Name:** `@` (or `www`)
   - **Type:** A
   - **Value:** Your EC2 IP
   - **TTL:** 300

**If using other DNS:**
- Create A record pointing to your EC2 IP
- Wait for DNS propagation (5-60 minutes)

### 8.2 Update Environment Variable

```bash
# Edit .env
nano .env

# Update:
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Restart frontend
pm2 restart autosocial-ai-frontend
```

---

## Step 9: Update OAuth Callback URLs

### 9.1 Meta (Facebook/Instagram)

1. Go to [Meta Developers](https://developers.facebook.com)
2. Select your app
3. Settings → Basic
4. Add to **Authorized Redirect URIs:**
   - `https://your-domain.com/api/auth/meta/callback`
   - `http://your-ec2-ip/api/auth/meta/callback` (if using IP)

### 9.2 TikTok

1. Go to [TikTok Developers](https://developers.tiktok.com)
2. Select your app
3. Manage → Redirect URI
4. Add:
   - `https://your-domain.com/api/auth/tiktok/callback`
   - `http://your-ec2-ip/api/auth/tiktok/callback` (if using IP)

---

## ✅ Deployment Complete!

Your application should now be running at:
- **Frontend:** `http://your-domain.com` or `http://your-ec2-ip`
- **Worker:** Running in background (check with `pm2 logs`)

---

## 📊 Monitoring and Maintenance

### View Logs

```bash
# All logs
pm2 logs

# Frontend only
pm2 logs autosocial-ai-frontend

# Worker only
pm2 logs autosocial-ai-worker

# Last 50 lines
pm2 logs --lines 50
```

### Monitor Resources

```bash
# Real-time monitoring
pm2 monit

# System resources
htop

# Disk space
df -h
```

### Restart Applications

```bash
# Restart all
pm2 restart all

# Restart specific app
pm2 restart autosocial-ai-frontend
pm2 restart autosocial-ai-worker

# Reload (zero downtime)
pm2 reload all
```

### Update Application

```bash
# Pull latest code
git pull

# Reinstall dependencies (if needed)
npm install
cd worker && npm install && cd ..

# Rebuild frontend
npm run build

# Restart
pm2 restart all
```

---

## 🔒 Security Checklist

- [ ] Firewall configured (Security Groups)
- [ ] Only SSH from your IP
- [ ] SSL certificate installed
- [ ] Environment variables secure
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Regular system updates: `sudo apt update && sudo apt upgrade`
- [ ] PM2 auto-start configured
- [ ] Logs being monitored

---

## 🆘 Troubleshooting

### Frontend Not Accessible

```bash
# Check if frontend is running
pm2 status

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status

# Check EC2 Security Groups (in AWS Console)
```

### Worker Not Running

```bash
# Check logs
pm2 logs autosocial-ai-worker --lines 50

# Check if worker directory exists
ls -la worker/

# Verify environment variables
cat .env | grep SUPABASE_URL
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

### Out of Memory

```bash
# Check memory usage
free -h

# If low, consider upgrading to t3.large
```

---

## 📝 Next Steps

1. ✅ Test admin dashboard
2. ✅ Create a test client
3. ✅ Test OAuth connections
4. ✅ Verify worker generates content
5. ✅ Monitor logs for errors
6. ✅ Setup backups (optional)
7. ✅ Configure monitoring alerts (optional)

---

## 💰 Cost Optimization

**Current setup:** ~$30-35/month (t3.medium)

**To reduce costs:**
- Use t3.small ($15/month) - may be slower
- Use Reserved Instances (save 30-40%)
- Stop instance when not in use (dev/staging)

**To improve performance:**
- Upgrade to t3.large ($60/month)
- Add CloudFront CDN
- Use Elastic IP (free)

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**You're all set! 🎉**

If you encounter any issues, check the logs with `pm2 logs` or refer to the troubleshooting section above.

