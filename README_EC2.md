# Quick Reference: EC2 Deployment

**For full guide, see [docs/EC2_DEPLOYMENT_QUICKSTART.md](docs/EC2_DEPLOYMENT_QUICKSTART.md)**

## Quick Start Commands

### On Your Local Machine

```bash
# 1. Ensure your code is pushed to Git
git push

# 2. Note your EC2 details:
#    - EC2 IP: xx.xx.xx.xx
#    - Key file: your-key.pem
```

### On EC2 Instance (SSH into it first)

```bash
# 1. Install dependencies (one-time setup)
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2

# 2. Clone repository
cd ~
git clone <your-repo-url> AutoSocialAi
cd AutoSocialAi

# 3. Setup environment
cp .env.example .env
nano .env  # Fill in your values

# 4. Deploy (or use the script)
# Option A: Use deployment script
bash deploy-ec2.sh

# Option B: Manual steps
npm install
npm run build
cd worker && npm install && cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it outputs

# 5. Configure Nginx
sudo cp nginx/autosocial-ai.conf /etc/nginx/sites-available/autosocial-ai
sudo nano /etc/nginx/sites-available/autosocial-ai  # Update server_name
sudo ln -s /etc/nginx/sites-available/autosocial-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 6. Setup SSL (if you have a domain)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Useful Commands

```bash
# View logs
pm2 logs

# Restart apps
pm2 restart all

# Check status
pm2 status

# Monitor
pm2 monit

# Update app
git pull
npm install
npm run build
pm2 restart all
```

---

**See [docs/EC2_DEPLOYMENT_QUICKSTART.md](docs/EC2_DEPLOYMENT_QUICKSTART.md) for complete guide!**

