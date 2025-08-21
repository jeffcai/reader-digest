# Reader Digest - Quick Deployment Guide

This is a summary of the deployment process. For detailed instructions, see `DEPLOYMENT_GUIDE.md`.

## Quick Start (5-minute setup)

### Option 1: Automated Deployment
```bash
# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/your-repo/reader-digest/main/deploy/quick-deploy.sh | bash

# Or if you have the repository:
cd reader-digest
./deploy/quick-deploy.sh
```

### Option 2: Manual Deployment
```bash
# Clone the repository
git clone <your-repo-url> reader-digest
cd reader-digest

# Run deployment with your domain
sudo ./deploy/deploy.sh --domain yourdomain.com --email your@email.com

# Or for HTTP-only deployment (no SSL)
sudo ./deploy/deploy.sh --http-only
```

## Post-Deployment Management

### Check Status
```bash
# Check all services
sudo /opt/reader-digest/manage.sh status

# Run health check
sudo /opt/reader-digest/health-check.sh
```

### Service Management
```bash
# Start/stop/restart services
sudo /opt/reader-digest/manage.sh start
sudo /opt/reader-digest/manage.sh stop
sudo /opt/reader-digest/manage.sh restart

# View logs
sudo /opt/reader-digest/manage.sh logs all
sudo /opt/reader-digest/manage.sh follow backend
```

### Application URLs
- Frontend: `http://your-domain.com` (or `https://` with SSL)
- API: `http://your-domain.com/api`
- Health Check: `http://your-domain.com/health`

## Requirements
- Alibaba Cloud ECS instance (Ubuntu 20.04+ or CentOS 7+)
- 2GB+ RAM, 20GB+ disk space
- Root or sudo access
- Domain name (optional, for SSL)

## Support
- Logs: `/var/log/reader-digest/`
- Config: `/opt/reader-digest/`
- Database: `/opt/reader-digest/backend/tour_guides.db`

For detailed configuration and troubleshooting, see the full deployment guide.
