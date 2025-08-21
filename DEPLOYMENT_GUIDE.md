# Reader Digest Deployment Guide for Alibaba Cloud ECS

This guide provides step-by-step instructions for deploying the Reader Digest application on Alibaba Cloud ECS (Elastic Compute Service).

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Alibaba Cloud ECS Instance                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────┐                   │
│  │   Frontend      │    │    Backend       │                   │
│  │   Next.js       │    │    Flask API     │                   │
│  │   Port: 3000    │    │    Port: 5001    │                   │
│  └─────────────────┘    └──────────────────┘                   │
│          │                        │                            │
│          └────────────────────────┼─────────────────────────┐  │
│                                   │                         │  │
│  ┌─────────────────────────────────┼─────────────────────┐   │  │
│  │              Nginx Reverse Proxy                    │   │  │
│  │              Port: 80, 443                          │   │  │
│  └─────────────────────────────────┼─────────────────────┘   │  │
│                                   │                         │  │
│  ┌─────────────────────────────────┼─────────────────────────┼──┤
│  │                SQLite Database                            │  │
│  │                /app/data/reader_digest.db                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            Internet/Users
```

## 📋 Prerequisites

### 1. Alibaba Cloud ECS Requirements

- **Instance Type**: ecs.t6-c1m1.large or higher (2 vCPU, 2GB RAM minimum)
- **Operating System**: Ubuntu 22.04 LTS or CentOS 8
- **Storage**: 40GB+ system disk
- **Security Group**: Allow inbound ports 80, 443, 22 (SSH)

### 2. Domain & SSL (Optional but Recommended)

- Domain name pointing to your ECS public IP
- SSL certificate (can use Let's Encrypt for free)

## 🚀 Quick Deployment Script

Run this single command on your ECS instance:

```bash
curl -sSL https://raw.githubusercontent.com/your-repo/reader-digest/main/deploy/quick-deploy.sh | bash
```

## 📝 Manual Deployment Steps

### Step 1: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y git curl wget nginx certbot python3-certbot-nginx
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y nodejs npm

# Install Node.js 18+ (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /app
sudo chown $USER:$USER /app
cd /app

# Clone repository
git clone https://github.com/your-repo/reader-digest.git
cd reader-digest

# Set up directory structure
sudo mkdir -p /app/data
sudo mkdir -p /app/logs
sudo chown -R $USER:$USER /app
```

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd /app/reader-digest/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
nano .env  # Configure your environment variables

# Initialize database
python3 database.py
```

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory
cd /app/reader-digest/frontend

# Install Node.js dependencies
npm install

# Build production version
npm run build

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 5: Configure Services

Create systemd services for auto-restart and management.

### Step 6: Nginx Configuration

Set up Nginx as reverse proxy with SSL support.

### Step 7: SSL Certificate (Let's Encrypt)

Configure free SSL certificate for HTTPS.

## 🔧 Detailed Configuration Files

See the individual configuration files below for complete setup details.

## 🔄 Maintenance & Updates

- **Application Updates**: Use the update script
- **Database Backups**: Automated daily backups
- **Log Management**: Rotating logs with logrotate
- **Health Monitoring**: Built-in health checks

## 🐛 Troubleshooting

Common issues and solutions are documented in the troubleshooting section.

## 📊 Monitoring & Logs

- **Application Logs**: `/app/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `journalctl -u reader-digest-*`

---

**Next**: Follow the detailed deployment scripts below to complete your setup.
