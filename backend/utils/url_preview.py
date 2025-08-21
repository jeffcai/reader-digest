import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
import logging

logger = logging.getLogger(__name__)

def get_url_preview(url: str) -> dict:
    """
    Extract preview data from a URL without storing it.
    Returns title, description, image, and site_name.
    """
    try:
        # Validate URL
        if not url or not isinstance(url, str):
            return {"error": "Invalid URL"}
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Parse URL to ensure it's valid
        parsed = urlparse(url)
        if not parsed.netloc:
            return {"error": "Invalid URL format"}
        
        # Set up headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        
        # Make request with timeout
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Extract preview data
        preview_data = {
            'url': url,
            'title': _extract_title(soup),
            'description': _extract_description(soup),
            'image': _extract_image(soup, url),
            'site_name': _extract_site_name(soup, parsed.netloc),
            'domain': parsed.netloc
        }
        
        return preview_data
        
    except requests.exceptions.Timeout:
        return {"error": "Request timeout"}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection error"}
    except requests.exceptions.HTTPError as e:
        return {"error": f"HTTP error: {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Error fetching preview for {url}: {str(e)}")
        return {"error": "Failed to fetch preview"}

def _extract_title(soup: BeautifulSoup) -> str:
    """Extract title from HTML"""
    # Try Open Graph title first
    og_title = soup.find('meta', property='og:title')
    if og_title and og_title.get('content'):
        return og_title['content'].strip()
    
    # Try Twitter title
    twitter_title = soup.find('meta', name='twitter:title')
    if twitter_title and twitter_title.get('content'):
        return twitter_title['content'].strip()
    
    # Fallback to HTML title tag
    title_tag = soup.find('title')
    if title_tag and title_tag.text:
        return title_tag.text.strip()
    
    return ""

def _extract_description(soup: BeautifulSoup) -> str:
    """Extract description from HTML"""
    # Try Open Graph description first
    og_desc = soup.find('meta', property='og:description')
    if og_desc and og_desc.get('content'):
        return og_desc['content'].strip()
    
    # Try Twitter description
    twitter_desc = soup.find('meta', name='twitter:description')
    if twitter_desc and twitter_desc.get('content'):
        return twitter_desc['content'].strip()
    
    # Try meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc and meta_desc.get('content'):
        return meta_desc['content'].strip()
    
    # Fallback to first paragraph text
    first_p = soup.find('p')
    if first_p and first_p.text:
        text = first_p.text.strip()
        # Limit to reasonable length
        return text[:300] + '...' if len(text) > 300 else text
    
    return ""

def _extract_image(soup: BeautifulSoup, base_url: str) -> str:
    """Extract image from HTML"""
    # Try Open Graph image first
    og_image = soup.find('meta', property='og:image')
    if og_image and og_image.get('content'):
        image_url = og_image['content'].strip()
        return _resolve_url(image_url, base_url)
    
    # Try Twitter image
    twitter_image = soup.find('meta', name='twitter:image')
    if twitter_image and twitter_image.get('content'):
        image_url = twitter_image['content'].strip()
        return _resolve_url(image_url, base_url)
    
    # Try to find first suitable img tag
    for img in soup.find_all('img', src=True):
        src = img.get('src')
        if src and not src.startswith('data:'):
            # Skip very small images (likely icons)
            width = img.get('width')
            height = img.get('height')
            if width and height:
                try:
                    w, h = int(width), int(height)
                    if w < 100 or h < 100:
                        continue
                except ValueError:
                    pass
            
            return _resolve_url(src, base_url)
    
    return ""

def _extract_site_name(soup: BeautifulSoup, domain: str) -> str:
    """Extract site name from HTML"""
    # Try Open Graph site name
    og_site_name = soup.find('meta', property='og:site_name')
    if og_site_name and og_site_name.get('content'):
        return og_site_name['content'].strip()
    
    # Fallback to domain name
    return domain.replace('www.', '').split('.')[0].title()

def _resolve_url(url: str, base_url: str) -> str:
    """Resolve relative URLs to absolute URLs"""
    if not url:
        return ""
    
    # If already absolute, return as is
    if url.startswith(('http://', 'https://')):
        return url
    
    # Join with base URL
    return urljoin(base_url, url)