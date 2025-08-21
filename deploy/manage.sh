#!/bin/bash

# Reader Digest Application Manager
# This script helps manage the Reader Digest application services

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service names
BACKEND_SERVICE="reader-digest-backend"
FRONTEND_SERVICE="reader-digest-frontend"
NGINX_SERVICE="nginx"

# Application directory
APP_DIR="/opt/reader-digest"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service exists
service_exists() {
    systemctl list-units --full -t service | grep -Fq "$1.service"
}

# Function to get service status
get_service_status() {
    if service_exists "$1"; then
        systemctl is-active "$1" 2>/dev/null || echo "inactive"
    else
        echo "not-found"
    fi
}

# Function to show service status
show_status() {
    print_status "Reader Digest Application Status:"
    echo "=================================="
    
    # Backend status
    backend_status=$(get_service_status "$BACKEND_SERVICE")
    printf "%-25s: " "Backend API"
    case "$backend_status" in
        "active") echo -e "${GREEN}Running${NC}" ;;
        "inactive") echo -e "${RED}Stopped${NC}" ;;
        "failed") echo -e "${RED}Failed${NC}" ;;
        *) echo -e "${YELLOW}$backend_status${NC}" ;;
    esac
    
    # Frontend status
    frontend_status=$(get_service_status "$FRONTEND_SERVICE")
    printf "%-25s: " "Frontend Server"
    case "$frontend_status" in
        "active") echo -e "${GREEN}Running${NC}" ;;
        "inactive") echo -e "${RED}Stopped${NC}" ;;
        "failed") echo -e "${RED}Failed${NC}" ;;
        *) echo -e "${YELLOW}$frontend_status${NC}" ;;
    esac
    
    # Nginx status
    nginx_status=$(get_service_status "$NGINX_SERVICE")
    printf "%-25s: " "Nginx Proxy"
    case "$nginx_status" in
        "active") echo -e "${GREEN}Running${NC}" ;;
        "inactive") echo -e "${RED}Stopped${NC}" ;;
        "failed") echo -e "${RED}Failed${NC}" ;;
        *) echo -e "${YELLOW}$nginx_status${NC}" ;;
    esac
    
    echo ""
    
    # Show URLs if services are running
    if [[ "$nginx_status" == "active" ]]; then
        print_status "Application URLs:"
        echo "  - Frontend: http://localhost (or your domain)"
        echo "  - API: http://localhost/api (or your domain/api)"
        echo "  - Health Check: http://localhost/health"
    fi
}

# Function to start services
start_services() {
    print_status "Starting Reader Digest services..."
    
    # Start backend
    if service_exists "$BACKEND_SERVICE"; then
        sudo systemctl start "$BACKEND_SERVICE"
        print_success "Backend service started"
    else
        print_error "Backend service not found"
        return 1
    fi
    
    # Start frontend
    if service_exists "$FRONTEND_SERVICE"; then
        sudo systemctl start "$FRONTEND_SERVICE"
        print_success "Frontend service started"
    else
        print_error "Frontend service not found"
        return 1
    fi
    
    # Start nginx
    if service_exists "$NGINX_SERVICE"; then
        sudo systemctl start "$NGINX_SERVICE"
        print_success "Nginx service started"
    else
        print_warning "Nginx service not found (might be handled separately)"
    fi
    
    # Wait a moment and check status
    sleep 3
    show_status
}

# Function to stop services
stop_services() {
    print_status "Stopping Reader Digest services..."
    
    # Stop in reverse order
    if service_exists "$NGINX_SERVICE"; then
        sudo systemctl stop "$NGINX_SERVICE"
        print_success "Nginx service stopped"
    fi
    
    if service_exists "$FRONTEND_SERVICE"; then
        sudo systemctl stop "$FRONTEND_SERVICE"
        print_success "Frontend service stopped"
    fi
    
    if service_exists "$BACKEND_SERVICE"; then
        sudo systemctl stop "$BACKEND_SERVICE"
        print_success "Backend service stopped"
    fi
    
    show_status
}

# Function to restart services
restart_services() {
    print_status "Restarting Reader Digest services..."
    stop_services
    sleep 2
    start_services
}

# Function to reload services (for configuration changes)
reload_services() {
    print_status "Reloading Reader Digest services..."
    
    # Reload systemd daemon first
    sudo systemctl daemon-reload
    
    # Restart services
    if service_exists "$BACKEND_SERVICE"; then
        sudo systemctl restart "$BACKEND_SERVICE"
        print_success "Backend service reloaded"
    fi
    
    if service_exists "$FRONTEND_SERVICE"; then
        sudo systemctl restart "$FRONTEND_SERVICE"
        print_success "Frontend service reloaded"
    fi
    
    if service_exists "$NGINX_SERVICE"; then
        sudo systemctl reload "$NGINX_SERVICE"
        print_success "Nginx configuration reloaded"
    fi
    
    sleep 3
    show_status
}

# Function to show logs
show_logs() {
    local service="$1"
    local lines="${2:-50}"
    
    case "$service" in
        "backend"|"api")
            print_status "Showing last $lines lines of backend logs:"
            sudo journalctl -u "$BACKEND_SERVICE" -n "$lines" --no-pager
            ;;
        "frontend"|"web")
            print_status "Showing last $lines lines of frontend logs:"
            sudo journalctl -u "$FRONTEND_SERVICE" -n "$lines" --no-pager
            ;;
        "nginx"|"proxy")
            print_status "Showing Nginx access logs:"
            sudo tail -n "$lines" /var/log/nginx/access.log
            ;;
        "nginx-error")
            print_status "Showing Nginx error logs:"
            sudo tail -n "$lines" /var/log/nginx/error.log
            ;;
        "all")
            print_status "Showing logs from all services:"
            echo "=== Backend Logs ==="
            sudo journalctl -u "$BACKEND_SERVICE" -n 20 --no-pager
            echo -e "\n=== Frontend Logs ==="
            sudo journalctl -u "$FRONTEND_SERVICE" -n 20 --no-pager
            echo -e "\n=== Nginx Access Logs ==="
            sudo tail -n 10 /var/log/nginx/access.log 2>/dev/null || echo "No access logs found"
            ;;
        *)
            print_error "Unknown service: $service"
            echo "Available services: backend, frontend, nginx, nginx-error, all"
            return 1
            ;;
    esac
}

# Function to follow logs in real time
follow_logs() {
    local service="$1"
    
    case "$service" in
        "backend"|"api")
            print_status "Following backend logs (Ctrl+C to stop):"
            sudo journalctl -u "$BACKEND_SERVICE" -f
            ;;
        "frontend"|"web")
            print_status "Following frontend logs (Ctrl+C to stop):"
            sudo journalctl -u "$FRONTEND_SERVICE" -f
            ;;
        "nginx"|"proxy")
            print_status "Following Nginx access logs (Ctrl+C to stop):"
            sudo tail -f /var/log/nginx/access.log
            ;;
        "all")
            print_status "Following all service logs (Ctrl+C to stop):"
            sudo journalctl -u "$BACKEND_SERVICE" -u "$FRONTEND_SERVICE" -f
            ;;
        *)
            print_error "Unknown service: $service"
            echo "Available services: backend, frontend, nginx, all"
            return 1
            ;;
    esac
}

# Function to enable/disable services
enable_services() {
    print_status "Enabling Reader Digest services to start on boot..."
    
    if service_exists "$BACKEND_SERVICE"; then
        sudo systemctl enable "$BACKEND_SERVICE"
        print_success "Backend service enabled"
    fi
    
    if service_exists "$FRONTEND_SERVICE"; then
        sudo systemctl enable "$FRONTEND_SERVICE"
        print_success "Frontend service enabled"
    fi
    
    if service_exists "$NGINX_SERVICE"; then
        sudo systemctl enable "$NGINX_SERVICE"
        print_success "Nginx service enabled"
    fi
}

disable_services() {
    print_status "Disabling Reader Digest services from starting on boot..."
    
    if service_exists "$BACKEND_SERVICE"; then
        sudo systemctl disable "$BACKEND_SERVICE"
        print_success "Backend service disabled"
    fi
    
    if service_exists "$FRONTEND_SERVICE"; then
        sudo systemctl disable "$FRONTEND_SERVICE"
        print_success "Frontend service disabled"
    fi
}

# Function to update application
update_app() {
    print_status "Updating Reader Digest application..."
    
    # Check if git is available and we're in a git repo
    if [[ -d "$APP_DIR/.git" ]] && command -v git >/dev/null 2>&1; then
        cd "$APP_DIR"
        print_status "Pulling latest changes from git..."
        sudo -u reader-digest git pull
        
        # Update backend dependencies
        print_status "Updating backend dependencies..."
        cd "$APP_DIR/backend"
        sudo -u reader-digest ./venv/bin/pip install -r requirements.txt
        
        # Update frontend dependencies
        print_status "Updating frontend dependencies..."
        cd "$APP_DIR/frontend"
        sudo -u reader-digest npm install
        sudo -u reader-digest npm run build
        
        # Restart services
        restart_services
        
        print_success "Application updated successfully!"
    else
        print_error "Git not available or not in a git repository"
        print_status "To update manually:"
        echo "1. Upload new code to $APP_DIR"
        echo "2. Run: $0 reload"
    fi
}

# Function to backup database
backup_database() {
    local backup_dir="/opt/reader-digest/backups"
    local backup_file="database-backup-$(date +%Y%m%d-%H%M%S).sqlite"
    local db_file="$APP_DIR/backend/tour_guides.db"
    
    print_status "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$backup_dir"
    sudo chown reader-digest:reader-digest "$backup_dir"
    
    if [[ -f "$db_file" ]]; then
        sudo -u reader-digest cp "$db_file" "$backup_dir/$backup_file"
        print_success "Database backed up to: $backup_dir/$backup_file"
        
        # Keep only last 10 backups
        cd "$backup_dir"
        sudo -u reader-digest ls -t database-backup-*.sqlite | tail -n +11 | xargs -r rm
        print_status "Old backups cleaned up (kept latest 10)"
    else
        print_error "Database file not found at: $db_file"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Reader Digest Application Manager"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  status              Show application status"
    echo "  start               Start all services"
    echo "  stop                Stop all services"
    echo "  restart             Restart all services"
    echo "  reload              Reload services (for config changes)"
    echo "  enable              Enable services to start on boot"
    echo "  disable             Disable services from starting on boot"
    echo "  logs <service>      Show logs for a service"
    echo "  follow <service>    Follow logs in real time"
    echo "  update              Update application from git"
    echo "  backup              Backup database"
    echo "  help                Show this help message"
    echo ""
    echo "Services for logs:"
    echo "  backend, api        Backend API service"
    echo "  frontend, web       Frontend web service"
    echo "  nginx, proxy        Nginx proxy service"
    echo "  nginx-error         Nginx error logs"
    echo "  all                 All services"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 logs backend"
    echo "  $0 logs all 100"
    echo "  $0 follow frontend"
    echo "  $0 restart"
}

# Main script logic
case "${1:-status}" in
    "status"|"stat"|"st")
        show_status
        ;;
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart"|"reboot")
        restart_services
        ;;
    "reload"|"refresh")
        reload_services
        ;;
    "enable")
        enable_services
        ;;
    "disable")
        disable_services
        ;;
    "logs"|"log")
        if [[ $# -lt 2 ]]; then
            print_error "Service name required"
            echo "Usage: $0 logs <service> [lines]"
            exit 1
        fi
        show_logs "$2" "${3:-50}"
        ;;
    "follow"|"tail"|"watch")
        if [[ $# -lt 2 ]]; then
            print_error "Service name required"
            echo "Usage: $0 follow <service>"
            exit 1
        fi
        follow_logs "$2"
        ;;
    "update"|"upgrade")
        update_app
        ;;
    "backup"|"backup-db")
        backup_database
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
