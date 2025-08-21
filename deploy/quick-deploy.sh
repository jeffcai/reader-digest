#!/bin/bash

# Reader Digest Quick Deployment Script
# This script provides a simplified deployment process for Alibaba Cloud ECS
#
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/reader-digest/main/deploy/quick-deploy.sh | bash
# Or: ./quick-deploy.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if we're on a supported system
check_system() {
    if ! command -v apt >/dev/null 2>&1 && ! command -v dnf >/dev/null 2>&1; then
        error "This script requires Ubuntu/Debian or CentOS/RHEL"
    fi
}

# Install basic dependencies
install_deps() {
    log "Installing dependencies..."
    
    if command -v apt >/dev/null 2>&1; then
        sudo apt update
        sudo apt install -y curl wget git
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf update -y
        sudo dnf install -y curl wget git
    fi
}

# Interactive setup
interactive_setup() {
    echo ""
    echo "🚀 Reader Digest Quick Deployment"
    echo "================================="
    echo ""
    
    read -p "Enter your domain name (optional, press enter to skip): " DOMAIN
    
    if [[ -n "$DOMAIN" ]]; then
        read -p "Enter email for SSL certificate: " EMAIL
        
        if [[ -z "$EMAIL" ]]; then
            warning "No email provided, SSL setup will be skipped"
            DOMAIN=""
        fi
    fi
    
    echo ""
    log "Starting deployment with the following settings:"
    echo "  Domain: ${DOMAIN:-'None (HTTP only)'}"
    echo "  SSL Email: ${EMAIL:-'None'}"
    echo ""
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
}

# Download and run main deployment script
run_deployment() {
    log "Downloading main deployment script..."
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Download deployment script
    if ! wget -q https://raw.githubusercontent.com/your-repo/reader-digest/main/deploy/deploy.sh; then
        error "Failed to download deployment script. Please check your internet connection and repository access."
    fi
    
    chmod +x deploy.sh
    
    # Build arguments
    ARGS=""
    if [[ -n "$DOMAIN" ]]; then
        ARGS="--domain $DOMAIN"
        if [[ -n "$EMAIL" ]]; then
            ARGS="$ARGS --email $EMAIL"
        fi
    fi
    
    log "Running deployment script..."
    ./deploy.sh $ARGS
    
    # Cleanup
    cd /
    rm -rf "$TEMP_DIR"
}

# Main function
main() {
    check_system
    install_deps
    interactive_setup
    run_deployment
    
    echo ""
    log "🎉 Quick deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Check service status: sudo systemctl status reader-digest-backend reader-digest-frontend"
    echo "2. View logs: journalctl -u reader-digest-backend -f"
    if [[ -n "$DOMAIN" ]]; then
        echo "3. Access your application: https://$DOMAIN"
    else
        echo "3. Access your application: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
    fi
    echo ""
}

main "$@"
