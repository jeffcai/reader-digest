#!/usr/bin/env python3
"""
Real API test script to test URL preview functionality without server
"""

import sys
sys.path.append('.')

from services.url_preview import URLPreviewService

def test_real_urls():
    """Test URL preview with real websites"""
    service = URLPreviewService()
    
    test_urls = [
        'https://example.com',
        # 'https://news.ycombinator.com',
        # 'https://github.com',
        # 'https://stackoverflow.com',
    ]
    
    print("=" * 60)
    print("REAL URL PREVIEW TESTS")
    print("=" * 60)
    
    for url in test_urls:
        print(f"\n🌐 Testing: {url}")
        print("-" * 40)
        
        try:
            result = service.get_preview(url)
            
            if result.get('success'):
                data = result.get('data', {})
                print(f"✅ SUCCESS")
                print(f"   Title: {data.get('title', 'No title')}")
                print(f"   Description: {data.get('description', 'No description')[:100]}...")
                print(f"   Image: {data.get('image_url') or 'None'}")
                print(f"   Site: {data.get('site_name', 'Unknown')}")
            else:
                print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
                print(f"   Full result: {result}")
                
        except Exception as e:
            print(f"💥 EXCEPTION: {str(e)}")
    
    print("\n" + "=" * 60)
    print("REAL URL TESTING COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_real_urls()
