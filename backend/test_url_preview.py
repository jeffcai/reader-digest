"""
Unit tests for URL Preview Service
Tests the URL crawling functionality without storing content
"""
import unittest
from unittest.mock import patch, Mock, MagicMock
import sys
import os
import json

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.url_preview import URLPreviewService, url_preview_service
from app import create_app
import requests


class TestURLPreviewService(unittest.TestCase):
    
    def setUp(self):
        """Set up test cases"""
        self.service = URLPreviewService(timeout=5)
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        """Clean up after tests"""
        self.app_context.pop()

    def test_is_valid_url(self):
        """Test URL validation"""
        # Valid URLs
        self.assertTrue(self.service._is_valid_url('https://example.com'))
        self.assertTrue(self.service._is_valid_url('http://example.com'))
        self.assertTrue(self.service._is_valid_url('https://example.com/path?query=1'))
        
        # Invalid URLs
        self.assertFalse(self.service._is_valid_url('not-a-url'))
        self.assertFalse(self.service._is_valid_url(''))
        self.assertFalse(self.service._is_valid_url('ftp://example.com'))
        self.assertFalse(self.service._is_valid_url('example.com'))

    def test_resolve_url(self):
        """Test URL resolution"""
        base_url = 'https://example.com/path/'
        
        # Absolute URLs should remain unchanged
        abs_url = 'https://other.com/image.jpg'
        self.assertEqual(self.service._resolve_url(abs_url, base_url), abs_url)
        
        # Relative URLs should be resolved
        rel_url = '/static/image.jpg'
        expected = 'https://example.com/static/image.jpg'
        self.assertEqual(self.service._resolve_url(rel_url, base_url), expected)
        
        # Protocol-relative URLs
        protocol_rel = '//cdn.example.com/image.jpg'
        expected = 'https://cdn.example.com/image.jpg'
        self.assertEqual(self.service._resolve_url(protocol_rel, base_url), expected)

    def test_error_response(self):
        """Test error response format"""
        error_msg = "Test error"
        response = self.service._error_response(error_msg)
        
        expected = {
            'title': None,
            'description': None,
            'image': None,
            'site_name': None,
            'url': None,
            'success': False,
            'error': error_msg
        }
        
        self.assertEqual(response, expected)

    @patch('services.url_preview.requests.Session.get')
    def test_get_preview_success(self, mock_get):
        """Test successful URL preview extraction"""
        # Mock HTML content
        html_content = '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Article Title</title>
            <meta property="og:title" content="OG Test Title">
            <meta property="og:description" content="This is a test description">
            <meta property="og:image" content="https://example.com/image.jpg">
            <meta property="og:site_name" content="Test Site">
            <meta name="description" content="Meta description">
        </head>
        <body>
            <h1>Article Header</h1>
            <p>First paragraph content</p>
        </body>
        </html>
        '''
        
        # Mock response
        mock_response = Mock()
        mock_response.text = html_content
        mock_response.url = 'https://example.com/article'
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        # Test
        result = self.service.get_preview('https://example.com/article')
        
        # Assertions
        self.assertTrue(result['success'])
        self.assertEqual(result['title'], 'OG Test Title')
        self.assertEqual(result['description'], 'This is a test description')
        self.assertEqual(result['image'], 'https://example.com/image.jpg')
        self.assertEqual(result['site_name'], 'Test Site')
        self.assertEqual(result['url'], 'https://example.com/article')
        self.assertIsNone(result['error'])

    @patch('services.url_preview.requests.Session.get')
    def test_get_preview_timeout(self, mock_get):
        """Test timeout handling"""
        mock_get.side_effect = requests.exceptions.Timeout()
        
        result = self.service.get_preview('https://example.com')
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Request timeout')
        self.assertIsNone(result['title'])

    @patch('services.url_preview.requests.Session.get')
    def test_get_preview_connection_error(self, mock_get):
        """Test connection error handling"""
        mock_get.side_effect = requests.exceptions.ConnectionError()
        
        result = self.service.get_preview('https://example.com')
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Connection failed')

    @patch('services.url_preview.requests.Session.get')
    def test_get_preview_http_error(self, mock_get):
        """Test HTTP error handling"""
        mock_response = Mock()
        mock_response.status_code = 404
        
        http_error = requests.exceptions.HTTPError()
        http_error.response = mock_response
        mock_get.side_effect = http_error
        
        result = self.service.get_preview('https://example.com')
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'HTTP error: 404')

    def test_invalid_url(self):
        """Test invalid URL handling"""
        result = self.service.get_preview('invalid-url')
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Invalid URL format')

    @patch('services.url_preview.requests.Session.get')
    def test_extract_title_fallbacks(self, mock_get):
        """Test title extraction fallback mechanisms"""
        # Test with only HTML title
        html_content = '''
        <html>
        <head><title>HTML Title Only</title></head>
        <body><h1>H1 Title</h1></body>
        </html>
        '''
        
        mock_response = Mock()
        mock_response.text = html_content
        mock_response.url = 'https://example.com'
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        result = self.service.get_preview('https://example.com')
        self.assertEqual(result['title'], 'HTML Title Only')

    @patch('services.url_preview.requests.Session.get')
    def test_extract_description_fallbacks(self, mock_get):
        """Test description extraction fallback mechanisms"""
        # Test with paragraph fallback
        html_content = '''
        <html>
        <body>
            <p>This is the first paragraph that should be used as description when meta tags are not available.</p>
        </body>
        </html>
        '''
        
        mock_response = Mock()
        mock_response.text = html_content
        mock_response.url = 'https://example.com'
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        result = self.service.get_preview('https://example.com')
        self.assertIn('This is the first paragraph', result['description'])

    @patch('services.url_preview.requests.Session.get')
    def test_extract_image_fallbacks(self, mock_get):
        """Test image extraction fallback mechanisms"""
        html_content = '''
        <html>
        <body>
            <article>
                <img src="/article-image.jpg" alt="Article Image">
            </article>
        </body>
        </html>
        '''
        
        mock_response = Mock()
        mock_response.text = html_content
        mock_response.url = 'https://example.com/article'
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        result = self.service.get_preview('https://example.com/article')
        self.assertEqual(result['image'], 'https://example.com/article-image.jpg')


class TestURLPreviewAPI(unittest.TestCase):
    
    def setUp(self):
        """Set up Flask test client"""
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        """Clean up after tests"""
        self.app_context.pop()

    def test_preview_url_missing_url(self):
        """Test API endpoint with missing URL"""
        response = self.client.post('/api/v1/articles/preview-url', 
                                  json={})
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'URL is required')

    def test_preview_url_empty_request(self):
        """Test API endpoint with empty request"""
        response = self.client.post('/api/v1/articles/preview-url')
        
        self.assertEqual(response.status_code, 400)

    @patch('routes.articles.url_preview_service.get_preview')
    def test_preview_url_success(self, mock_get_preview):
        """Test successful API preview"""
        # Mock service response
        mock_preview_data = {
            'title': 'Test Title',
            'description': 'Test Description',
            'image': 'https://example.com/image.jpg',
            'site_name': 'Test Site',
            'url': 'https://example.com',
            'success': True,
            'error': None
        }
        mock_get_preview.return_value = mock_preview_data
        
        response = self.client.post('/api/v1/articles/preview-url',
                                  json={'url': 'https://example.com'})
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data, mock_preview_data)

    @patch('routes.articles.url_preview_service.get_preview')
    def test_preview_url_service_error(self, mock_get_preview):
        """Test API endpoint when service fails"""
        mock_get_preview.side_effect = Exception('Service failed')
        
        response = self.client.post('/api/v1/articles/preview-url',
                                  json={'url': 'https://example.com'})
        
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertIn('Preview failed', data['error'])


class TestURLPreviewIntegration(unittest.TestCase):
    """Integration tests with real HTTP requests (optional, for manual testing)"""
    
    def setUp(self):
        self.service = URLPreviewService(timeout=10)
    
    def test_real_website_preview(self):
        """Test with a real website (enable for integration testing)"""
        # Uncomment for integration testing
        # result = self.service.get_preview('https://httpbin.org/html')
        # self.assertTrue(result.get('success', False))
        # self.assertIsNotNone(result.get('title'))
        pass


if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestURLPreviewService))
    test_suite.addTest(unittest.makeSuite(TestURLPreviewAPI))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\nTest Results:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\nFailures:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nErrors:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
    
    # Exit with appropriate code
    exit(0 if result.wasSuccessful() else 1)
