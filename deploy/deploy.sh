#!/bin/bash

# Reader Digest Deployment Script for Alibaba Cloud ECS
# This script automates the complete deployment process
#
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/reader-digest/main/deploy/deploy.sh | bash
# Or: ./deploy.sh [OPTIONS]
#
# Options:
#   --domain DOMAIN     Set domain name for SSL setup
#   --email EMAIL       Email for Let's Encrypt SSL certificate
#   --skip-ssl          Skip SSL certificate setup
#   --help              Show this help message

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DOMAIN=""
EMAIL=""
SKIP_SSL=false
APP_DIR="/app"
REPO_URL="https://github.com/your-repo/reader-digest.git"  # Update with your actual repo
APP_USER="reader"
BACKEND_PORT=5001
FRONTEND_PORT=3000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --help)
            grep '^#' "$0" | sed 's/^# //' | head -15
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
}

# Check OS compatibility
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine OS. This script supports Ubuntu 20.04+ and CentOS 8+"
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "centos" ]]; then
        error "Unsupported OS: $ID. This script supports Ubuntu 20.04+ and CentOS 8+"
    fi
    
    log "Detected OS: $PRETTY_NAME"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    if [[ "$ID" == "ubuntu" ]]; then
        sudo apt update
        sudo apt install -y \
            curl wget git \
            nginx certbot python3-certbot-nginx \
            python3 python3-pip python3-venv python3-dev \
            nodejs npm \
            sqlite3 \
            supervisor \
            ufw
        
        # Install Node.js 18+ if needed
        NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
        if [[ $NODE_VERSION -lt 18 ]]; then
            log "Installing Node.js 18..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
    elif [[ "$ID" == "centos" ]]; then
        sudo dnf update -y
        sudo dnf install -y \
            curl wget git \
            nginx certbot python3-certbot-nginx \
            python3 python3-pip python3-devel \
            nodejs npm \
            sqlite \
            supervisor \
            firewalld
            
        # Enable and start firewalld
        sudo systemctl enable firewalld
        sudo systemctl start firewalld
    fi
    
    # Install PM2 globally
    sudo npm install -g pm2
    
    log "System dependencies installed successfully"
}

# Create application user and directories
setup_app_structure() {
    log "Setting up application structure..."
    
    # Create application user
    if ! id "$APP_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d $APP_DIR $APP_USER
        log "Created application user: $APP_USER"
    fi
    
    # Create directories
    sudo mkdir -p $APP_DIR/{data,logs,backups,scripts}
    sudo chown -R $APP_USER:$APP_USER $APP_DIR
    sudo chmod 755 $APP_DIR
    
    # Allow current user to access app directory
    sudo usermod -a -G $APP_USER $USER
    
    log "Application structure created"
}

# Clone and setup repository
setup_repository() {
    log "Cloning repository..."
    
    if [[ -d "$APP_DIR/reader-digest" ]]; then
        warning "Application directory already exists. Backing up..."
        sudo mv $APP_DIR/reader-digest $APP_DIR/reader-digest.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    cd $APP_DIR
    sudo -u $APP_USER git clone $REPO_URL
    sudo chown -R $APP_USER:$APP_USER $APP_DIR/reader-digest
    
    log "Repository cloned successfully"
}

# Setup backend
setup_backend() {
    log "Setting up backend..."
    
    cd $APP_DIR/reader-digest/backend
    
    # Create virtual environment as app user
    sudo -u $APP_USER python3 -m venv venv
    
    # Activate venv and install dependencies
    sudo -u $APP_USER bash -c "
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        pip install gunicorn
    "
    
    # Create environment file
    if [[ ! -f .env ]]; then
        sudo -u $APP_USER bash -c "cat > .env << 'EOF'
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Database Configuration  
DATABASE_URL=sqlite:///$APP_DIR/data/reader_digest.db

# Application Configuration
API_BASE_URL=http://localhost:$BACKEND_PORT
CORS_ORIGINS=http://localhost:$FRONTEND_PORT,https://$DOMAIN

# Logging
LOG_LEVEL=INFO
LOG_FILE=$APP_DIR/logs/backend.log

# Security
BCRYPT_LOG_ROUNDS=12
JWT_ACCESS_TOKEN_EXPIRES=86400
EOF"
        log "Created backend environment configuration"
    fi
    
    # Initialize database
    sudo -u $APP_USER bash -c "
        source venv/bin/activate
        export FLASK_APP=app.py
        python3 -c 'from database import db; db.create_all()'
    "
    
    log "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    log "Setting up frontend..."
    
    cd $APP_DIR/reader-digest/frontend
    
    # Install dependencies as app user
    sudo -u $APP_USER npm install
    
    # Create environment file
    sudo -u $APP_USER bash -c "cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
EOF"
    
    # Build production version
    sudo -u $APP_USER npm run build
    
    log "Frontend setup completed"
}

# Configure systemd services
setup_services() {
    log "Configuring systemd services..."
    
    # Backend service
    sudo tee /etc/systemd/system/reader-digest-backend.service > /dev/null << EOF
[Unit]
Description=Reader Digest Backend API
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/reader-digest/backend
Environment=PATH=$APP_DIR/reader-digest/backend/venv/bin
ExecStart=$APP_DIR/reader-digest/backend/venv/bin/gunicorn --bind 127.0.0.1:$BACKEND_PORT --workers 3 --timeout 120 app:app
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=reader-digest-backend

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service  
    sudo tee /etc/systemd/system/reader-digest-frontend.service > /dev/null << EOF
[Unit]
Description=Reader Digest Frontend
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/reader-digest/frontend
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=reader-digest-frontend

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable reader-digest-backend reader-digest-frontend
    
    log "Systemd services configured"
}

# Configure Nginx
setup_nginx() {
    log "Configuring Nginx..."
    
    # Remove default configuration
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Create reader-digest configuration
    sudo tee /etc/nginx/sites-available/reader-digest << EOF
# Reader Digest Nginx Configuration

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;

# Upstream servers
upstream backend {
    server 127.0.0.1:$BACKEND_PORT fail_timeout=5s max_fails=3;
}

upstream frontend {
    server 127.0.0.1:$FRONTEND_PORT fail_timeout=5s max_fails=3;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN:-_};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN:-_};
    
    # SSL Configuration (will be updated by certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
    
    # Frontend routes
    location / {
        limit_req zone=general burst=50 nodelay;
        
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Next.js static files caching
        location /_next/static/ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/reader-digest /etc/nginx/sites-enabled/
    
    # Test configuration
    sudo nginx -t || error "Nginx configuration test failed"
    
    log "Nginx configured successfully"
}

# Setup SSL certificate
setup_ssl() {
    if [[ "$SKIP_SSL" == "true" || -z "$DOMAIN" ]]; then
        warning "Skipping SSL setup"
        return
    fi
    
    if [[ -z "$EMAIL" ]]; then
        error "Email is required for SSL certificate setup. Use --email option."
    fi
    
    log "Setting up SSL certificate for $DOMAIN..."
    
    # Ensure nginx is running
    sudo systemctl start nginx
    
    # Obtain certificate
    sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log "SSL certificate setup completed"
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    if [[ "$ID" == "ubuntu" ]]; then
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 'Nginx Full'
        sudo ufw reload
    elif [[ "$ID" == "centos" ]]; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
    fi
    
    log "Firewall configured"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start application services
    sudo systemctl start reader-digest-backend
    sudo systemctl start reader-digest-frontend
    
    # Restart nginx
    sudo systemctl restart nginx
    
    # Check service status
    sleep 5
    
    if systemctl is-active --quiet reader-digest-backend; then
        log "Backend service is running"
    else
        error "Backend service failed to start"
    fi
    
    if systemctl is-active --quiet reader-digest-frontend; then
        log "Frontend service is running"
    else
        error "Frontend service failed to start"
    fi
    
    if systemctl is-active --quiet nginx; then
        log "Nginx service is running"
    else
        error "Nginx service failed to start"
    fi
    
    log "All services started successfully"
}

# Create management scripts
create_scripts() {
    log "Creating management scripts..."
    
    # Update script
    sudo -u $APP_USER tee $APP_DIR/scripts/update.sh > /dev/null << 'EOF'
#!/bin/bash
set -e

APP_DIR="/app"
cd $APP_DIR/reader-digest

echo "Pulling latest changes..."
git pull origin main

echo "Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt

echo "Updating frontend..."
cd ../frontend
npm install
npm run build

echo "Restarting services..."
sudo systemctl restart reader-digest-backend
sudo systemctl restart reader-digest-frontend

echo "Update completed successfully!"
EOF

    # Backup script
    sudo -u $APP_USER tee $APP_DIR/scripts/backup.sh > /dev/null << 'EOF'
#!/bin/bash
set -e

APP_DIR="/app"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Creating backup..."
mkdir -p $BACKUP_DIR

# Database backup
cp $APP_DIR/data/reader_digest.db $BACKUP_DIR/reader_digest_$DATE.db

# Compress old backups
find $BACKUP_DIR -name "*.db" -mtime +7 -exec gzip {} \;

# Remove very old backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: reader_digest_$DATE.db"
EOF

    # Status script
    sudo -u $APP_USER tee $APP_DIR/scripts/status.sh > /dev/null << 'EOF'
#!/bin/bash

echo "=== Reader Digest Application Status ==="
echo ""

echo "Services Status:"
systemctl is-active reader-digest-backend && echo "✓ Backend: Running" || echo "✗ Backend: Stopped"
systemctl is-active reader-digest-frontend && echo "✓ Frontend: Running" || echo "✗ Frontend: Stopped"
systemctl is-active nginx && echo "✓ Nginx: Running" || echo "✗ Nginx: Stopped"
echo ""

echo "Disk Usage:"
df -h /app
echo ""

echo "Memory Usage:"
free -h
echo ""

echo "Recent Backend Logs:"
journalctl -u reader-digest-backend --no-pager -n 5
echo ""

echo "Recent Frontend Logs:"
journalctl -u reader-digest-frontend --no-pager -n 5
EOF

    # Make scripts executable
    chmod +x $APP_DIR/scripts/*.sh
    
    log "Management scripts created"
}

# Setup log rotation
setup_logrotate() {
    log "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/reader-digest > /dev/null << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        systemctl reload reader-digest-backend reader-digest-frontend 2>/dev/null || true
    endscript
}
EOF
    
    log "Log rotation configured"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check backend health
    if curl -sf http://localhost:$BACKEND_PORT/health > /dev/null; then
        log "✓ Backend health check passed"
    else
        error "✗ Backend health check failed"
    fi
    
    # Check frontend
    if curl -sf http://localhost:$FRONTEND_PORT > /dev/null; then
        log "✓ Frontend health check passed"
    else
        error "✗ Frontend health check failed"
    fi
    
    # Check external access
    if [[ -n "$DOMAIN" ]]; then
        if curl -sf https://$DOMAIN > /dev/null; then
            log "✓ External access check passed"
        else
            warning "External access check failed - may take a few minutes for DNS to propagate"
        fi
    fi
    
    log "Health check completed"
}

# Main deployment function
main() {
    log "Starting Reader Digest deployment on Alibaba Cloud ECS..."
    
    check_root
    check_os
    install_dependencies
    setup_app_structure
    setup_repository
    setup_backend
    setup_frontend
    setup_services
    setup_nginx
    setup_ssl
    setup_firewall
    start_services
    create_scripts
    setup_logrotate
    health_check
    
    log "🎉 Deployment completed successfully!"
    echo ""
    info "=== Deployment Summary ==="
    info "Application directory: $APP_DIR/reader-digest"
    info "Backend service: reader-digest-backend"
    info "Frontend service: reader-digest-frontend"
    info "Logs directory: $APP_DIR/logs"
    info "Management scripts: $APP_DIR/scripts/"
    echo ""
    if [[ -n "$DOMAIN" ]]; then
        info "🌐 Your application is available at: https://$DOMAIN"
    else
        info "🌐 Your application is available at: http://$(curl -s ifconfig.me)"
    fi
    echo ""
    info "📋 Useful commands:"
    info "  sudo systemctl status reader-digest-backend"
    info "  sudo systemctl status reader-digest-frontend" 
    info "  $APP_DIR/scripts/status.sh"
    info "  $APP_DIR/scripts/update.sh"
    info "  $APP_DIR/scripts/backup.sh"
    echo ""
    info "📖 For more information, see: $APP_DIR/reader-digest/DEPLOYMENT_GUIDE.md"
}

# Run main function
main "$@"
