#!/bin/bash

# Reader Digest Health Check Script
# This script monitors the health of all Reader Digest services

set -euo pipefail

# Configuration
BACKEND_URL="http://localhost:5001"
FRONTEND_URL="http://localhost:3000"
PROXY_URL="http://localhost"
HEALTH_ENDPOINT="/health"
LOG_FILE="/var/log/reader-digest/health-check.log"
ALERT_EMAIL=""  # Set this if you want email alerts
MAX_RESPONSE_TIME=10  # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
sudo mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# Function to log messages
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | sudo tee -a "$LOG_FILE" >/dev/null 2>&1 || true
}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_message "INFO" "$1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
    log_message "OK" "$1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_message "WARNING" "$1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "ERROR" "$1"
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url="$1"
    local name="$2"
    local expected_status="${3:-200}"
    
    print_status "Checking $name at $url"
    
    # Use curl to check the endpoint
    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" \
                        --connect-timeout 5 --max-time "$MAX_RESPONSE_TIME" \
                        "$url" 2>/dev/null || echo "000,0")
        
        local http_code=$(echo "$response" | cut -d',' -f1)
        local response_time=$(echo "$response" | cut -d',' -f2)
        
        if [[ "$http_code" == "$expected_status" ]]; then
            print_success "$name is healthy (${http_code}, ${response_time}s)"
            return 0
        else
            print_error "$name returned status $http_code"
            return 1
        fi
    else
        print_warning "curl not available, skipping HTTP check for $name"
        return 1
    fi
}

# Function to check service status
check_service() {
    local service_name="$1"
    local display_name="$2"
    
    print_status "Checking $display_name service"
    
    if systemctl is-active --quiet "$service_name" 2>/dev/null; then
        print_success "$display_name service is running"
        return 0
    else
        local status=$(systemctl is-active "$service_name" 2>/dev/null || echo "unknown")
        print_error "$display_name service is $status"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space"
    
    local usage=$(df /opt/reader-digest 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
    
    if [[ "$usage" -gt 90 ]]; then
        print_error "Disk usage is ${usage}% - critically high!"
        return 1
    elif [[ "$usage" -gt 80 ]]; then
        print_warning "Disk usage is ${usage}% - getting high"
        return 1
    else
        print_success "Disk usage is ${usage}% - healthy"
        return 0
    fi
}

# Function to check memory usage
check_memory() {
    print_status "Checking memory usage"
    
    if command -v free >/dev/null 2>&1; then
        local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        
        if [[ "$mem_usage" -gt 90 ]]; then
            print_error "Memory usage is ${mem_usage}% - critically high!"
            return 1
        elif [[ "$mem_usage" -gt 80 ]]; then
            print_warning "Memory usage is ${mem_usage}% - getting high"
            return 1
        else
            print_success "Memory usage is ${mem_usage}% - healthy"
            return 0
        fi
    else
        print_warning "free command not available, skipping memory check"
        return 1
    fi
}

# Function to check database
check_database() {
    local db_file="/opt/reader-digest/backend/tour_guides.db"
    
    print_status "Checking database"
    
    if [[ -f "$db_file" ]]; then
        if [[ -r "$db_file" && -w "$db_file" ]]; then
            local db_size=$(du -h "$db_file" | cut -f1)
            print_success "Database is accessible (size: $db_size)"
            return 0
        else
            print_error "Database file has incorrect permissions"
            return 1
        fi
    else
        print_error "Database file not found at $db_file"
        return 1
    fi
}

# Function to check log files
check_logs() {
    print_status "Checking log file status"
    
    local log_dir="/var/log/reader-digest"
    local error_count=0
    
    if [[ -d "$log_dir" ]]; then
        # Check if log directory is writable
        if [[ -w "$log_dir" ]]; then
            print_success "Log directory is writable"
        else
            print_error "Log directory is not writable"
            ((error_count++))
        fi
        
        # Check recent errors in logs
        local recent_errors=$(find "$log_dir" -name "*.log" -mtime -1 -exec grep -c "ERROR" {} + 2>/dev/null | \
                             awk '{sum+=$1} END {print sum+0}')
        
        if [[ "$recent_errors" -gt 10 ]]; then
            print_warning "Found $recent_errors errors in logs from last 24h"
            ((error_count++))
        else
            print_success "Log error count is acceptable ($recent_errors in 24h)"
        fi
    else
        print_warning "Log directory not found at $log_dir"
        ((error_count++))
    fi
    
    return $error_count
}

# Function to send alert email
send_alert() {
    local subject="$1"
    local body="$2"
    
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
        log_message "INFO" "Alert email sent to $ALERT_EMAIL"
    fi
}

# Function to perform comprehensive health check
comprehensive_check() {
    local start_time=$(date +%s)
    local total_checks=0
    local failed_checks=0
    local warnings=0
    
    print_status "Starting Reader Digest Health Check - $(date)"
    echo "=============================================="
    
    # Check services
    ((total_checks++))
    if ! check_service "reader-digest-backend" "Backend API"; then
        ((failed_checks++))
    fi
    
    ((total_checks++))
    if ! check_service "reader-digest-frontend" "Frontend"; then
        ((failed_checks++))
    fi
    
    ((total_checks++))
    if ! check_service "nginx" "Nginx"; then
        ((failed_checks++))
    fi
    
    echo ""
    
    # Check HTTP endpoints
    ((total_checks++))
    if ! check_http_endpoint "$BACKEND_URL$HEALTH_ENDPOINT" "Backend Health"; then
        ((failed_checks++))
    fi
    
    ((total_checks++))
    if ! check_http_endpoint "$FRONTEND_URL" "Frontend" "200|404"; then
        ((failed_checks++))
    fi
    
    ((total_checks++))
    if ! check_http_endpoint "$PROXY_URL$HEALTH_ENDPOINT" "Proxy Health"; then
        ((failed_checks++))
    fi
    
    echo ""
    
    # Check system resources
    ((total_checks++))
    if ! check_disk_space; then
        if [[ $? -eq 1 ]]; then
            ((warnings++))
        else
            ((failed_checks++))
        fi
    fi
    
    ((total_checks++))
    if ! check_memory; then
        if [[ $? -eq 1 ]]; then
            ((warnings++))
        else
            ((failed_checks++))
        fi
    fi
    
    echo ""
    
    # Check database
    ((total_checks++))
    if ! check_database; then
        ((failed_checks++))
    fi
    
    # Check logs
    ((total_checks++))
    check_logs
    local log_issues=$?
    if [[ $log_issues -gt 0 ]]; then
        ((warnings+=log_issues))
    fi
    
    echo ""
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "=============================================="
    print_status "Health Check Summary - Duration: ${duration}s"
    echo "  Total Checks: $total_checks"
    echo "  Passed: $((total_checks - failed_checks - warnings))"
    echo "  Warnings: $warnings"
    echo "  Failed: $failed_checks"
    
    # Determine overall status
    if [[ $failed_checks -eq 0 && $warnings -eq 0 ]]; then
        print_success "All systems healthy!"
        return 0
    elif [[ $failed_checks -eq 0 ]]; then
        print_warning "Systems operational with warnings"
        return 1
    else
        print_error "Critical issues detected!"
        
        # Send alert if configured
        local alert_body="Reader Digest health check failed!
        
Failed checks: $failed_checks
Warnings: $warnings
Total checks: $total_checks
Duration: ${duration}s
Timestamp: $(date)

Please check the system immediately."
        
        send_alert "Reader Digest Health Check Failed" "$alert_body"
        return 2
    fi
}

# Function to run quick check
quick_check() {
    print_status "Quick health check..."
    
    local issues=0
    
    # Check if services are running
    if ! systemctl is-active --quiet reader-digest-backend 2>/dev/null; then
        print_error "Backend service is not running"
        ((issues++))
    fi
    
    if ! systemctl is-active --quiet reader-digest-frontend 2>/dev/null; then
        print_error "Frontend service is not running"
        ((issues++))
    fi
    
    if ! systemctl is-active --quiet nginx 2>/dev/null; then
        print_error "Nginx service is not running"
        ((issues++))
    fi
    
    # Quick HTTP check
    if ! curl -s --connect-timeout 3 --max-time 5 "$PROXY_URL$HEALTH_ENDPOINT" >/dev/null; then
        print_error "Health endpoint not responding"
        ((issues++))
    fi
    
    if [[ $issues -eq 0 ]]; then
        print_success "Quick check passed - all services responsive"
        return 0
    else
        print_error "Quick check failed - $issues issues detected"
        return 1
    fi
}

# Function to show monitoring dashboard
show_dashboard() {
    clear
    echo "Reader Digest Monitoring Dashboard"
    echo "=================================="
    echo "Last updated: $(date)"
    echo ""
    
    # Service status
    echo "Service Status:"
    printf "  Backend:  "
    if systemctl is-active --quiet reader-digest-backend 2>/dev/null; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${RED}Stopped${NC}"
    fi
    
    printf "  Frontend: "
    if systemctl is-active --quiet reader-digest-frontend 2>/dev/null; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${RED}Stopped${NC}"
    fi
    
    printf "  Nginx:    "
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${RED}Stopped${NC}"
    fi
    
    echo ""
    
    # System resources
    echo "System Resources:"
    if command -v free >/dev/null 2>&1; then
        local mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
        printf "  Memory:   ${mem_usage}%%"
        if (( $(echo "$mem_usage > 80" | bc -l) )); then
            echo -e " ${YELLOW}(High)${NC}"
        else
            echo -e " ${GREEN}(OK)${NC}"
        fi
    fi
    
    local disk_usage=$(df /opt/reader-digest 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
    printf "  Disk:     ${disk_usage}%%"
    if [[ "$disk_usage" -gt 80 ]]; then
        echo -e " ${YELLOW}(High)${NC}"
    else
        echo -e " ${GREEN}(OK)${NC}"
    fi
    
    echo ""
    
    # Recent activity
    echo "Recent Activity:"
    if [[ -f "$LOG_FILE" ]]; then
        echo "  Last health check: $(tail -1 "$LOG_FILE" 2>/dev/null | cut -d']' -f1 | tr -d '[' || echo "Never")"
    fi
    
    # HTTP response check
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 3 --max-time 5 "$PROXY_URL$HEALTH_ENDPOINT" 2>/dev/null || echo "N/A")
    if [[ "$response_time" != "N/A" ]]; then
        printf "  Response time: ${response_time}s"
        if (( $(echo "$response_time > 2" | bc -l) 2>/dev/null )); then
            echo -e " ${YELLOW}(Slow)${NC}"
        else
            echo -e " ${GREEN}(Good)${NC}"
        fi
    else
        echo "  Response time: N/A (Service unreachable)"
    fi
}

# Function to run continuous monitoring
continuous_monitor() {
    local interval="${1:-30}"
    
    print_status "Starting continuous monitoring (interval: ${interval}s)"
    print_status "Press Ctrl+C to stop"
    
    while true; do
        show_dashboard
        echo ""
        echo "Next update in ${interval} seconds..."
        sleep "$interval"
    done
}

# Function to show usage
show_usage() {
    echo "Reader Digest Health Check Tool"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  full                 Run comprehensive health check (default)"
    echo "  quick               Run quick health check"
    echo "  dashboard           Show monitoring dashboard"
    echo "  monitor [interval]  Continuous monitoring (default: 30s)"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run full health check"
    echo "  $0 quick           # Quick check"
    echo "  $0 monitor 60      # Monitor every 60 seconds"
    echo "  $0 dashboard       # Show current status"
    echo ""
    echo "Configuration:"
    echo "  Edit this script to set ALERT_EMAIL for notifications"
    echo "  Logs are written to: $LOG_FILE"
}

# Main script logic
case "${1:-full}" in
    "full"|"comprehensive"|"check")
        comprehensive_check
        exit $?
        ;;
    "quick"|"fast"|"q")
        quick_check
        exit $?
        ;;
    "dashboard"|"status"|"show")
        show_dashboard
        ;;
    "monitor"|"watch"|"continuous")
        continuous_monitor "${2:-30}"
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
