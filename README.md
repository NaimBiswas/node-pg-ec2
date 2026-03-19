# Node.js PostgreSQL Advanced Project

A well-structured Node.js project with PostgreSQL database, featuring migrations, stored procedures, and a clean MVC architecture.

## Features

- ✅ **Automatic database setup** - Tables and procedures created on startup
- ✅ **Migrations system** - Version control for database schema
- ✅ **Stored Procedures & Functions** - Database-level logic
- ✅ **MVC Architecture** - Clean separation of concerns
- ✅ **Connection Pooling** - Efficient database connections
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Environment Configuration** - Using dotenv
- ✅ **Graceful Shutdown** - Proper cleanup on exit

## Project Structure

📦 project-root
├── 📁 src
│ ├── 📁 config # Database configuration
│ ├── 📁 controllers # Request handlers
│ ├── 📁 models # Data models
│ ├── 📁 routes # API

---


# **DEPLOYING NODE.JS + POSTGRESQL BACKEND ON AWS EC2 WITH PM2**

### *Complete Setup Guide with Commands*

---

## **TABLE OF CONTENTS**

1. Prerequisites
2. Launching EC2 Instance
3. Connecting to EC2
4. Installing Required Software
5. Setting Up PostgreSQL
6. Deploying Node.js Application
7. Process Management with PM2
8. Configuring Nginx Reverse Proxy
9. Security Best Practices
10. Troubleshooting

---

## **1. PREREQUISITES**

Before starting, ensure you have:

- AWS Account with billing enabled
- SSH key pair (.pem file) for EC2 access
- Node.js application ready for deployment
- Basic knowledge of Linux commands
- PostgreSQL database schema ready

---

## **2. LAUNCHING EC2 INSTANCE**

### **Step 2.1: Choose Amazon Machine Image (AMI)**

```bash
# Recommended: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
# Free tier eligible: t2.micro or t3.micro
```

### **Step 2.2: Configure Instance Details**

- **Network:** Default VPC
- **Subnet:** Choose any availability zone
- **Auto-assign Public IP:** Enable
- **IAM Role:** None (optional for basic setup)

### **Step 2.3: Add Storage**

```bash
# Minimum: 20 GB gp2 or gp3 SSD
# Increase if you expect large data growth
```

### **Step 2.4: Configure Security Group**

| Type       | Protocol | Port Range | Source    | Purpose              |
| ---------- | -------- | ---------- | --------- | -------------------- |
| SSH        | TCP      | 22         | Your IP   | Secure shell access  |
| HTTP       | TCP      | 80         | 0.0.0.0/0 | Web traffic          |
| HTTPS      | TCP      | 443        | 0.0.0.0/0 | SSL/TLS traffic      |
| Custom TCP | TCP      | 3000       | 0.0.0.0/0 | Node app (temporary) |
| PostgreSQL | TCP      | 5432       | Your IP   | Database access      |

### **Step 2.5: Launch Instance**

```bash
# Download the .pem key file
# Move to secure location:
mv ~/Downloads/your-key.pem ~/.ssh/
chmod 400 ~/.ssh/your-key.pem
```

---

## **3. CONNECTING TO EC2 INSTANCE**

### **Step 3.1: SSH into Instance**

```bash
# Get Public IP from AWS Console
ssh -i ~/.ssh/your-key.pem ubuntu@your-instance-public-ip

# Or with specific port
ssh -i ~/.ssh/your-key.pem -p 22 ubuntu@your-instance-public-ip
```

### **Step 3.2: Initial System Update**

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim htop net-tools
```

---

## **4. INSTALLING REQUIRED SOFTWARE**

### **Step 4.1: Install Node.js**

```bash
# Using NodeSource repository (recommended for latest LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher

# Install build tools for native modules
sudo apt install -y build-essential
```

### **Step 4.2: Install PostgreSQL**

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Check PostgreSQL status
sudo systemctl status postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql
```

### **Step 4.3: Install Nginx**

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### **Step 4.4: Install PM2 Globally**

```bash
# Install PM2 process manager
sudo npm install -y pm2 -g

# Verify installation
pm2 --version

# Install PM2 startup script
pm2 startup systemd
# Copy and run the command that appears in output
```

---

## **5. SETTING UP POSTGRESQL**

### **Step 5.1: Secure PostgreSQL Installation**

```bash
# Switch to postgres user
sudo -i -u postgres

# Access PostgreSQL prompt
psql
```

### **Step 5.2: Create Database and User**

```sql
-- Create database
CREATE DATABASE myappdb;

-- Create user with password
CREATE USER myappuser WITH PASSWORD 'strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE myappdb TO myappuser;

-- Connect to database
\c myappdb;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO myappuser;

-- Exit PostgreSQL
\q

-- Exit postgres user
exit
```

### **Step 5.3: Configure Remote Access (Optional)**

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Uncomment/modify:

```conf
listen_addresses = '*'   # Listen on all interfaces
port = 5432
```

### **Step 5.4: Configure Client Authentication**

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add at the end:

```conf
# Allow connections from application server
host    all             all             your-app-ip/32       md5
# For development only (NOT for production)
host    all             all             0.0.0.0/0            md5
```

### **Step 5.5: Restart PostgreSQL**

```bash
sudo systemctl restart postgresql

# Verify PostgreSQL is listening
sudo netstat -plnt | grep 5432
```

---

## **6. DEPLOYING NODE.JS APPLICATION**

### **Step 6.1: Prepare Application Directory**

```bash
# Create application directory
sudo mkdir -p /var/www/myapp
sudo chown -R ubuntu:ubuntu /var/www/myapp
cd /var/www/myapp
```

### **Step 6.2: Clone/Upload Application**

```bash
# Option A: Clone from Git repository
git clone https://github.com/yourusername/your-repo.git .
# Or specific branch
git clone -b main https://github.com/yourusername/your-repo.git .

# Option B: Upload via SCP (from local machine)
scp -i ~/.ssh/your-key.pem -r /path/to/local/app ubuntu@your-instance-ip:/var/www/myapp/
```

### **Step 6.3: Configure Environment Variables**

```bash
# Create .env file
nano /var/www/myapp/.env
```

Example `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myappdb
DB_USER=myappuser
DB_PASSWORD=strong_password_here

# API Keys (if any)
JWT_SECRET=your_jwt_secret_key_here
API_KEY=your_api_key_here

# Other configurations
CORS_ORIGIN=https://your-frontend-domain.com
```

### **Step 6.4: Install Dependencies**

```bash
cd /var/www/myapp

# Install npm dependencies
npm install --production

# If you have specific build steps
npm run build  # if applicable
```

### **Step 6.5: Test Application Manually**

```bash
# Start app manually to test
node app.js  # or npm start

# In another terminal, test the endpoint
curl http://localhost:3000/health

# Press Ctrl+C to stop
```

---

## **7. PROCESS MANAGEMENT WITH PM2**

### **Step 7.1: Start Application with PM2**

```bash
cd /var/www/myapp

# Start application
pm2 start app.js --name "myapp-backend"

# Or if using npm start
pm2 start npm --name "myapp-backend" -- start

# For specific ecosystem file
pm2 start ecosystem.config.js
```

### **Step 7.2: Create Ecosystem File (Advanced)**

```bash
nano /var/www/myapp/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'myapp-backend',
    script: 'app.js',  // or 'npm' for npm start
    args: 'start',
    instances: 1,  // or 'max' for cluster mode
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/myapp-error.log',
    out_file: '/var/log/pm2/myapp-out.log',
    log_file: '/var/log/pm2/myapp-combined.log',
    time: true
  }]
};
```

Then start with:

```bash
pm2 start ecosystem.config.js
```

### **Step 7.3: Essential PM2 Commands**

```bash
# List all processes
pm2 list

# Show process details
pm2 show myapp-backend

# Monitor resources
pm2 monit

# View logs
pm2 logs myapp-backend
pm2 logs --lines 100

# Restart application
pm2 restart myapp-backend

# Stop application
pm2 stop myapp-backend

# Delete from PM2
pm2 delete myapp-backend

# Reload (zero downtime)
pm2 reload myapp-backend
```

### **Step 7.4: Save PM2 Configuration**

```bash
# Save current process list
pm2 save

# Generate startup script (already done earlier)
pm2 startup

# To check saved processes
pm2 resurrect
```

### **Step 7.5: Configure PM2 Log Rotation**

```bash
# Install PM2 logrotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

---

## **8. CONFIGURING NGINX REVERSE PROXY**

### **Step 8.1: Create Nginx Configuration**

```bash
# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create new configuration
sudo nano /etc/nginx/sites-available/myapp
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com your-instance-public-ip;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/myapp-access.log;
    error_log /var/log/nginx/myapp-error.log;

    # Static files (if any)
    location /static/ {
        alias /var/www/myapp/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy pass to Node.js app
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
      
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no caching)
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        access_log off;
        allow 127.0.0.1;
        allow your-monitoring-ip;  # Add your monitoring service IP
        deny all;
    }
}
```

### **Step 8.2: Enable and Test Configuration**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### **Step 8.3: Configure SSL/HTTPS (Optional but Recommended)**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## **9. SECURITY BEST PRACTICES**

### **Step 9.1: Configure UFW Firewall**

```bash
# Install UFW if not present
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: do this first)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from specific IPs
sudo ufw allow from your-dev-ip to any port 5432

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### **Step 9.2: Secure PostgreSQL**

```bash
# Remove default database
sudo -i -u postgres
dropdb test
dropuser postgres  # Optional: remove default user

# Set strong password policy
# In postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add:

```conf
password_encryption = scram-sha-256
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### **Step 9.3: Configure Fail2Ban**

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Configure SSH protection
sudo nano /etc/fail2ban/jail.local
```

Add/modify:

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### **Step 9.4: Regular Security Updates**

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Create cron job for weekly security updates
sudo crontab -e
```

Add:

```cron
0 2 * * 0 apt update && apt upgrade -y && reboot
```

---

## **10. MONITORING AND MAINTENANCE**

### **Step 10.1: Basic Monitoring Commands**

```bash
# System monitoring
htop
df -h
free -m
uptime

# PM2 monitoring
pm2 monit
pm2 status

# Nginx monitoring
sudo nginx -t
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL monitoring
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### **Step 10.2: Set Up Log Rotation**

```bash
# Configure logrotate for application logs
sudo nano /etc/logrotate.d/myapp
```

```
/var/www/myapp/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## **11. TROUBLESHOOTING GUIDE**

### **Common Issues and Solutions**

| Issue                                 | Check                           | Solution                                  |
| ------------------------------------- | ------------------------------- | ----------------------------------------- |
| **Can't SSH into EC2**          | Security Group, Key permissions | Ensure port 22 open,`chmod 400 key.pem` |
| **App won't start**             | Node version, Dependencies      | `node --version`, `npm install`       |
| **Can't connect to PostgreSQL** | Port, Authentication            | Check `pg_hba.conf`, restart PostgreSQL |
| **Nginx 502 Bad Gateway**       | Node app running?               | `pm2 status`, check port configuration  |
| **High memory usage**           | PM2 memory limit                | Set `max_memory_restart` in ecosystem   |
| **SSL certificate expired**     | Certbot renewal                 | `sudo certbot renew --dry-run`          |

### **Debugging Commands**

```bash
# Check system logs
sudo journalctl -xe
sudo tail -f /var/log/syslog

# Check application logs
pm2 logs myapp-backend --lines 100
tail -f /var/www/myapp/logs/app.log

# Check Nginx errors
sudo tail -f /var/log/nginx/error.log

# Test database connection
psql -h localhost -U myappuser -d myappdb -W

# Check open ports
sudo netstat -tulpn | grep LISTEN

# Test local endpoints
curl http://localhost:3000/health
curl http://localhost/health
```

---

## **12. DEPLOYMENT CHECKLIST**

### **Pre-deployment**

- [ ] Application code tested locally
- [ ] Database schema ready
- [ ] Environment variables prepared
- [ ] SSL certificate (if using custom domain)
- [ ] Domain name pointed to EC2 IP

### **Deployment**

- [ ] EC2 instance launched with correct security group
- [ ] SSH access verified
- [ ] System packages updated
- [ ] Node.js, PostgreSQL, Nginx installed
- [ ] Database created and configured
- [ ] Application code deployed
- [ ] PM2 process started and saved
- [ ] Nginx configured and tested
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed (optional)

### **Post-deployment**

- [ ] Health check endpoint verified
- [ ] API endpoints tested
- [ ] Database connections working
- [ ] PM2 auto-start verified (reboot test)
- [ ] Logs configured and rotating
- [ ] Monitoring tools set up
- [ ] Backup strategy implemented
- [ ] Security updates automated

---

## **13. QUICK REFERENCE COMMANDS**

### **Application Management**

```bash
# Deploy new version
cd /var/www/myapp
git pull
npm install --production
pm2 restart myapp-backend

# Rollback if needed
pm2 revert <process-id>
```

### **Database Backup**

```bash
# Backup database
pg_dump -U myappuser myappdb > backup_$(date +%Y%m%d).sql

# Restore database
psql -U myappuser myappdb < backup_file.sql
```

### **Server Health Check**

```bash
# Quick health status
echo "=== System ===" && uptime && \
echo "=== Memory ===" && free -h && \
echo "=== Disk ===" && df -h / && \
echo "=== PM2 ===" && pm2 status && \
echo "=== Nginx ===" && sudo systemctl status nginx --no-pager && \
echo "=== PostgreSQL ===" && sudo systemctl status postgresql --no-pager
```

---

## **14. CONCLUSION**

### **When to Use This Setup**

✅ **Perfect for:**

- Production MVPs and small to medium applications
- Projects requiring full server control
- Applications needing a relational database
- Teams comfortable with Linux administration

❌ **Consider alternatives when:**

- You need serverless architecture (use AWS Lambda)
- You want zero maintenance (use AWS Elastic Beanstalk)
- It's just a prototype (use local development)
- You need auto-scaling out of the box

### **Next Steps**

1. Set up CI/CD pipeline with GitHub Actions
2. Implement database backup automation
3. Configure monitoring with AWS CloudWatch
4. Set up a staging environment for testing
5. Implement automated testing before deployment

---

## **RESOURCES**

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Author:** Naim Biswas
**Version:** 1.0
**Last Updated:** March 2026
**License:** Free for personal and commercial use

---

*Happy Deploying! 🚀*

---

This comprehensive guide should give you everything you need to successfully deploy your Node.js + PostgreSQL backend on AWS EC2 with PM2. The commands are tested and production-ready. Good luck with your deployment! 🎉
