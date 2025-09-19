#!/usr/bin/env python3
"""
Test script for RSS feed functionality
"""

import sys
import os
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

try:
    from routes.rss import generate_rss_xml
    print("✅ RSS module imported successfully")
except ImportError as e:
    print(f"❌ Failed to import RSS module: {e}")
    sys.exit(1)

# Mock article data for testing
class MockArticle:
    def __init__(self, id, title, content, notes, tags, created_at, url=None):
        self.id = id
        self.title = title
        self.content = content
        self.notes = notes
        self.tags = tags
        self.created_at = created_at
        self.url = url
        self.author = MockUser()

class MockUser:
    def __init__(self):
        self.first_name = "Test"
        self.username = "testuser"

# Create mock articles
import datetime
mock_articles = [
    MockArticle(
        id=1,
        title="Test Article 1",
        content="This is the content of test article 1. It's a sample article to test RSS feed generation.",
        notes="These are my notes about test article 1.",
        tags='["technology", "testing"]',
        created_at=datetime.datetime.now(),
        url="https://example.com/article1"
    ),
    MockArticle(
        id=2,
        title="Test Article 2",
        content="This is the content of test article 2. Another sample for RSS testing.",
        notes="Notes about article 2.",
        tags='["development", "rss"]',
        created_at=datetime.datetime.now() - datetime.timedelta(days=1),
        url="https://example.com/article2"
    )
]

# Mock request object
class MockRequest:
    @property
    def url_root(self):
        return "http://localhost:5001/"
    
    @property
    def url(self):
        return "http://localhost:5001/rss/articles.xml"

# Set up mock request
import routes.rss
routes.rss.request = MockRequest()

def test_rss_generation():
    """Test RSS XML generation"""
    try:
        # Generate RSS XML
        rss_xml = generate_rss_xml(mock_articles)
        
        # Validate XML structure
        try:
            root = ET.fromstring(rss_xml)
            print("✅ Generated valid XML")
            
            # Check RSS structure
            if root.tag == 'rss':
                print("✅ Root element is 'rss'")
            else:
                print("❌ Root element is not 'rss'")
                return False
            
            # Find channel
            channel = root.find('channel')
            if channel is not None:
                print("✅ Channel element found")
                
                # Check for required elements
                title = channel.find('title')
                description = channel.find('description')
                
                if title is not None:
                    print(f"✅ Channel title: {title.text}")
                else:
                    print("❌ Channel title missing")
                
                if description is not None:
                    print(f"✅ Channel description: {description.text}")
                else:
                    print("❌ Channel description missing")
                
                # Check items
                items = channel.findall('item')
                print(f"✅ Found {len(items)} items")
                
                for i, item in enumerate(items):
                    item_title = item.find('title')
                    item_link = item.find('link')
                    item_desc = item.find('description')
                    
                    if item_title is not None:
                        print(f"  Item {i+1} title: {item_title.text}")
                    if item_link is not None:
                        print(f"  Item {i+1} link: {item_link.text}")
                    if item_desc is not None:
                        desc_text = item_desc.text or ""
                        print(f"  Item {i+1} has description: {len(desc_text)} chars")
            else:
                print("❌ Channel element not found")
                return False
            
            # Write sample RSS to file for inspection
            with open('/tmp/test_rss.xml', 'w', encoding='utf-8') as f:
                f.write(rss_xml)
            print("✅ Sample RSS saved to /tmp/test_rss.xml")
            
            return True
            
        except ET.ParseError as e:
            print(f"❌ Invalid XML generated: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error generating RSS: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Testing RSS feed generation...")
    success = test_rss_generation()
    
    if success:
        print("\n✅ RSS feed test completed successfully!")
        print("You can now test the RSS feed at: http://localhost:5001/rss/articles.xml")
    else:
        print("\n❌ RSS feed test failed!")
        sys.exit(1)