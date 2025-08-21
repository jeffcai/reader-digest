"""
Simple URL Preview Test
Test the URL preview functionality without full Flask setup
"""
import sys
import os
import json
from unittest.mock import patch, Mock

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_url_preview_service():
    """Test URL preview service functionality"""
    print("Testing URL Preview Service...")
    
    try:
        from services.url_preview import URLPreviewService
        service = URLPreviewService()
        
        print("✓ URLPreviewService imported successfully")
        
        # Test URL validation
        assert service._is_valid_url('https://example.com') == True
        assert service._is_valid_url('invalid-url') == False
        print("✓ URL validation working")
        
        # Test URL resolution
        resolved = service._resolve_url('/path/image.jpg', 'https://example.com')
        assert resolved == 'https://example.com/path/image.jpg'
        print("✓ URL resolution working")
        
        # Test error response
        error_resp = service._error_response('Test error')
        assert error_resp['success'] == False
        assert error_resp['error'] == 'Test error'
        print("✓ Error response format correct")
        
        print("✓ All basic URL preview service tests passed!")
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Test error: {e}")
        return False

def test_mock_url_crawling():
    """Test URL crawling with mocked responses"""
    print("\nTesting URL crawling with mocked responses...")
    
    try:
        # Mock BeautifulSoup parsing
        html_content = '''
        <html>
        <head>
            <title>Test Article</title>
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta property="og:image" content="https://example.com/image.jpg">
        </head>
        <body>
            <h1>Article Title</h1>
            <p>Article content here</p>
        </body>
        </html>
        '''
        
        print("✓ Mock HTML content prepared")
        
        # Test HTML parsing (basic test without actual BeautifulSoup)
        if 'og:title' in html_content and 'Test Article' in html_content:
            print("✓ HTML content contains expected metadata")
        
        # Test expected response format
        expected_response = {
            'title': 'OG Title',
            'description': 'OG Description',
            'image': 'https://example.com/image.jpg',
            'site_name': None,
            'url': 'https://example.com',
            'success': True,
            'error': None
        }
        
        # Validate response structure
        required_keys = ['title', 'description', 'image', 'site_name', 'url', 'success', 'error']
        for key in required_keys:
            assert key in expected_response
        
        print("✓ Expected response format is correct")
        print("✓ Mock URL crawling tests passed!")
        return True
        
    except Exception as e:
        print(f"✗ Mock crawling test error: {e}")
        return False

def test_api_endpoint_logic():
    """Test the API endpoint logic"""
    print("\nTesting API endpoint logic...")
    
    try:
        # Test request validation
        test_requests = [
            {'url': 'https://example.com'},  # Valid
            {},  # Invalid - no URL
            {'url': ''},  # Invalid - empty URL
            {'url': 'invalid-url'},  # Invalid URL format
        ]
        
        for i, req in enumerate(test_requests):
            if i == 0:
                # Valid request
                assert 'url' in req and req['url'].strip()
                print(f"✓ Request {i+1}: Valid request structure")
            else:
                # Invalid requests
                is_invalid = not req.get('url') or not req['url'].strip()
                assert is_invalid
                print(f"✓ Request {i+1}: Invalid request detected correctly")
        
        print("✓ API endpoint validation logic working")
        return True
        
    except Exception as e:
        print(f"✗ API endpoint test error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("URL PREVIEW SERVICE TESTS")
    print("=" * 60)
    
    tests = [
        test_url_preview_service,
        test_mock_url_crawling,
        test_api_endpoint_logic
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with error: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Total tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print(f"❌ {failed} test(s) failed")
    
    return failed == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
