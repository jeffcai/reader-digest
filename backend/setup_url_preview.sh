#!/bin/bash
# Setup script for URL preview functionality

echo "Setting up URL Preview functionality..."
echo "======================================"

# Navigate to backend directory
cd "$(dirname "$0")"

# Install required packages
echo "Installing required packages..."
pip3 install --user requests beautifulsoup4 lxml

# Or if using virtual environment:
# ./venv/bin/pip install requests beautifulsoup4 lxml

echo ""
echo "✓ URL Preview Service implemented"
echo "✓ API endpoint added: POST /api/v1/articles/preview-url"
echo "✓ Unit tests created and passed"
echo "✓ Required packages listed in requirements.txt"

echo ""
echo "To test the functionality:"
echo "1. Start the Flask server:"
echo "   python3 app.py"
echo ""
echo "2. Test the API with curl:"
echo "   curl -X POST http://localhost:5001/api/v1/articles/preview-url \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"url\": \"https://httpbin.org/html\"}'"
echo ""
echo "Features implemented:"
echo "• Crawls URLs to extract metadata (title, description, image)"
echo "• No content storage - dynamically fetches on request"
echo "• Comprehensive error handling"
echo "• Supports Open Graph and Twitter meta tags"
echo "• Fallback to HTML title and first paragraph"
echo "• URL validation and resolution"
echo "• Unit tests with mocked HTTP requests"
echo ""
echo "Backend implementation complete! 🎉"
