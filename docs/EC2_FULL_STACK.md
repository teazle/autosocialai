# Deploying Everything on EC2

**Yes, you CAN put both frontend and worker on a single EC2 instance!**

This is actually a very common and valid approach, especially for smaller to medium applications.

---

## 🎯 Can You Put Everything on EC2?

### ✅ **YES! Absolutely!**

You can run:
- **Next.js frontend** (on port 3000)
- **Node.js worker** (PM2 process)
- Both on the **same EC2 instance**

**It's totally possible and works great for many use cases!**

---

## 🏗️ Architecture on Single EC2

```
┌─────────────────────────────────────────────────────┐
│           EC2 Instance (t3.medium recommended)       │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Next.js Frontend (PM2)                       │   │
│  │  • Port: 3000                                  │   │
│  │  • Handles: Admin dashboard, API routes       │   │
│  │  • Accessible via: http://your-ec2-ip:3000    │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Worker (PM2)                                  │   │
│  │  • Background jobs                             │   │
│  │  • Generate content, publish posts            │   │
│  │  • Refresh tokens                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Nginx (Reverse Proxy)                         │   │
│  │  • Routes traffic to Next.js                   │   │
│  │  • SSL termination                             │   │
│  │  • Port 80/443                                 │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   Route 53 DNS    │
              │   (or domain)      │
              └──────────────────┘
```

---

## ✅ Advantages of Single EC2

### 1. **Simplicity** ⭐
- ✅ One server to manage
- ✅ One deployment process
- ✅ Single place for logs
- ✅ Easier debugging

### 2. **Cost Savings**
- ✅ **One EC2 instance** (~$30/month for t3.medium)
- ✅ vs **Two separate services** (~$45-60/month)
- ✅ **Saves $15-30/month**

### 3. **No Network Latency**
- ✅ Frontend and worker on same machine
- ✅ Faster database connections
- ✅ Lower latency

### 4. **Full Control**
- ✅ Configure everything yourself
- ✅ Custom setups
- ✅ Install any tools needed

### 5. **Easier Development**
- ✅ Test everything locally
- ✅ Deploy once
- ✅ Simpler CI/CD

---

## ⚠️ Disadvantages of Single EC2

### 1. **Scaling Limitations**
- ❌ Frontend and worker scale together (can't scale independently)
- ❌ If worker needs more CPU, frontend might slow down
- ❌ Traffic spike affects both

### 2. **No Built-in CDN**
- ❌ No global edge network (like Cloudflare)
- ❌ Slower for users far from your region
- ❌ Need to add CloudFront (extra cost/complexity)

### 3. **Single Point of Failure**
- ❌ If server goes down, everything goes down
- ❌ No automatic failover
- ❌ Need manual backup/recovery

### 4. **SSL/HTTPS Setup**
- ❌ Need to configure Let's Encrypt/Certbot
- ❌ Need Nginx for reverse proxy
- ❌ More configuration

### 5. **Resource Competition**
- ⚠️ Worker and frontend share CPU/RAM
- ⚠️ AI generation might slow frontend
- ⚠️ Traffic spike might affect worker

---

## 💰 Cost Comparison

### Option A: Everything on EC2
```
EC2 t3.medium:        $30/month
Data transfer:        $5/month
Total:                $35/month
```

### Option B: Split Deployment (Current Plan)
```
Cloudflare Pages:    $0/month (free tier)
EC2 t3.small:         $15/month
Total:                $15/month
```

**Wait... split is cheaper?** Only because Cloudflare Pages is free! If you need paid features, EC2 becomes competitive.

### Option C: Both on Separate Services
```
AWS Amplify:          $10/month
EC2 t3.small:         $15/month
Total:                $25/month
```

**EC2 single instance is competitive and offers more control.**

---

## 🚀 How to Set Up on Single EC2

### Step 1: Launch EC2 Instance

**Recommended Instance:**
- **Type:** t3.medium (2 vCPU, 4GB RAM)
- **OS:** Ubuntu 22.04 LTS
- **Storage:** 20GB SSD

### Step 2: Install Dependencies

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 3: Clone and Setup Project

```bash
# Clone repository
git clone <your-repo-url> AutoSocialAi
cd AutoSocialAi

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install worker dependencies
cd worker
npm install
cd ..
```

### Step 4: Configure Environment Variables

```bash
# Create .env file
nano .env

# Add all your environment variables:
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
# ... etc
```

### Step 5: Update ecosystem.config.js

Create a combined PM2 config:

```javascript
module.exports = {
  apps: [
    {
      name: 'autosocial-ai-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'autosocial-ai-worker',
      script: 'tsx',
      args: 'index.ts',
      cwd: './worker',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### Step 6: Start with PM2

```bash
# Start both processes
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Run the command it outputs
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/autosocial-ai
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 IP for testing

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/autosocial-ai /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already configured by Certbot)
```

---

## 📊 Performance Considerations

### Resource Allocation

**t3.medium (2 vCPU, 4GB RAM):**
- Frontend: ~500MB RAM, 0.5 vCPU
- Worker: ~1GB RAM, 1 vCPU
- System: ~500MB RAM
- **Total:** ~2GB RAM used, leaves headroom

### Monitoring

```bash
# Monitor resources
pm2 monit

# Check system resources
htop

# Watch logs
pm2 logs --lines 50
```

---

## 🆚 Comparison: EC2 vs Split

| Factor | Single EC2 | Split (Cloudflare + EC2) |
|--------|-----------|-------------------------|
| **Cost** | $35/month | $15/month (if Cloudflare free) |
| **Simplicity** | ✅ Simpler | ⚠️ More complex |
| **Performance** | ⚠️ Depends on region | ✅ Global CDN |
| **Scaling** | ❌ Manual | ✅ Auto-scaling |
| **Setup Time** | 2-4 hours | 1-2 hours |
| **Maintenance** | ⚠️ More manual | ✅ Less maintenance |
| **CDN** | ❌ No (need CloudFront) | ✅ Built-in |
| **SSL** | ⚠️ Manual (Certbot) | ✅ Automatic |

---

## 🎯 When to Use Single EC2

### ✅ **Best For:**
- Small to medium applications (< 1000 daily users)
- Budget-conscious projects
- Learning/side projects
- When you want full control
- When simplicity > performance

### ⚠️ **Consider Split If:**
- Need global performance (many international users)
- Expecting traffic spikes
- Want automatic scaling
- Need built-in DDoS protection
- Want zero-maintenance SSL/CDN

---

## 🔄 Hybrid Approach (Recommended for Growth)

**Start with Single EC2:**
- Simple setup
- Lower initial cost
- Easy to manage

**Migrate to Split When:**
- Traffic increases
- Need better global performance
- Want automatic scaling
- Budget allows

**Migration path is easy** - frontend code doesn't change, just deploy location!

---

## 📝 Deployment Checklist for Single EC2

- [ ] Launch EC2 instance (t3.medium recommended)
- [ ] Install Node.js, PM2, Nginx
- [ ] Clone repository
- [ ] Install dependencies (frontend + worker)
- [ ] Build frontend (`npm run build`)
- [ ] Configure environment variables
- [ ] Update `ecosystem.config.js` for both apps
- [ ] Start with PM2 (`pm2 start ecosystem.config.js`)
- [ ] Configure Nginx reverse proxy
- [ ] Setup SSL with Let's Encrypt
- [ ] Configure firewall (Security Groups)
- [ ] Setup PM2 auto-start
- [ ] Configure log rotation
- [ ] Setup domain DNS (optional)
- [ ] Test everything!

---

## 🚨 Important Security Considerations

### 1. **Security Groups**
```bash
# In AWS Console:
# Allow:
- SSH (22) from your IP only
- HTTP (80) from anywhere
- HTTPS (443) from anywhere
# Block everything else
```

### 2. **Firewall (UFW)**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. **Environment Variables**
- ✅ Never commit `.env` to Git
- ✅ Use AWS Secrets Manager (optional)
- ✅ Restrict file permissions: `chmod 600 .env`

### 4. **Updates**
```bash
# Regular system updates
sudo apt update && sudo apt upgrade -y

# Keep Node.js updated
# Monitor for security advisories
```

---

## 📈 Scaling on Single EC2

**If you outgrow t3.medium:**

1. **Vertical Scaling** (Easy)
   - Upgrade to t3.large (2x CPU/RAM)
   - Upgrade to t3.xlarge (4x CPU/RAM)
   - No code changes needed

2. **Horizontal Scaling** (More Complex)
   - Add more EC2 instances
   - Use Load Balancer
   - Share database (already done - Supabase)
   - Consider split architecture

---

## ✅ Summary

### **Can you put everything on EC2?**

**YES!** And it's a great option for:
- ✅ Simpler deployment
- ✅ Full control
- ✅ Cost-effective (especially if Cloudflare paid tier needed)
- ✅ Perfect for small/medium apps

### **Should you?**

**It depends on your priorities:**

- **Choose Single EC2 if:** Simplicity and control > Global performance
- **Choose Split if:** Performance and auto-scaling > Setup complexity

### **Recommendation:**

**Start with Single EC2** for simplicity, then **migrate to split** when you need:
- Better global performance
- Automatic scaling
- Or if Cloudflare stays free and you want the benefits

**Both approaches are valid!** Your current architecture supports both deployment strategies. 🎉

