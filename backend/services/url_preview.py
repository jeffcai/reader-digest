"""
URL Preview Service
Crawls URLs to extract metadata for article previews without storing content
"""
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
from typing import Dict, Optional
import logging

class URLPreviewService:
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.session = requests.Session()
        # Set a user agent to avoid blocking
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.logger = logging.getLogger(__name__)

    def get_preview(self, url: str) -> Dict[str, Optional[str]]:
        """
        Extract preview metadata from a URL
        Returns: {
            'title': str,
            'description': str, 
            'image': str,
            'site_name': str,
            'url': str,
            'success': bool,
            'error': str
        }
        """
        try:
            # Validate URL
            if not self._is_valid_url(url):
                return self._error_response("Invalid URL format")

            # Make HTTP request
            response = self.session.get(url, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract metadata
            preview_data = {
                'url': response.url,  # Final URL after redirects
                'title': self._extract_title(soup),
                'description': self._extract_description(soup),
                'image': self._extract_image(soup, response.url),
                'site_name': self._extract_site_name(soup),
                'success': True,
                'error': None
            }

            return preview_data

        except requests.exceptions.Timeout:
            return self._error_response("Request timeout")
        except requests.exceptions.ConnectionError:
            return self._error_response("Connection failed")
        except requests.exceptions.HTTPError as e:
            return self._error_response(f"HTTP error: {e.response.status_code}")
        except Exception as e:
            self.logger.error(f"URL preview error for {url}: {str(e)}")
            return self._error_response(f"Preview extraction failed: {str(e)}")

    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False

    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract page title from various sources"""
        # Try Open Graph title
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            return og_title['content'].strip()

        # Try Twitter title
        twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})
        if twitter_title and twitter_title.get('content'):
            return twitter_title['content'].strip()

        # Try HTML title tag
        title_tag = soup.find('title')
        if title_tag and title_tag.text:
            return title_tag.text.strip()

        # Try h1 tag
        h1_tag = soup.find('h1')
        if h1_tag and h1_tag.text:
            return h1_tag.text.strip()

        return None

    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract page description from various sources"""
        # Try Open Graph description
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            return og_desc['content'].strip()

        # Try Twitter description
        twitter_desc = soup.find('meta', attrs={'name': 'twitter:description'})
        if twitter_desc and twitter_desc.get('content'):
            return twitter_desc['content'].strip()

        # Try meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc['content'].strip()

        # Try to extract from first paragraph
        first_p = soup.find('p')
        if first_p and first_p.text:
            text = first_p.text.strip()
            # Limit to reasonable length
            return text[:300] + '...' if len(text) > 300 else text

        return None

    def _extract_image(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Extract preview image from various sources"""
        # Try Open Graph image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            return self._resolve_url(og_image['content'], base_url)

        # Try Twitter image
        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            return self._resolve_url(twitter_image['content'], base_url)

        # Try to find first image in article
        article_img = soup.find('article')
        if article_img:
            img = article_img.find('img')
            if img and img.get('src'):
                return self._resolve_url(img['src'], base_url)

        # Try first img tag
        first_img = soup.find('img')
        if first_img and first_img.get('src'):
            src = first_img['src']
            # Skip small images (likely icons)
            if 'icon' not in src.lower() and 'logo' not in src.lower():
                return self._resolve_url(src, base_url)

        return None

    def _extract_site_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract site name"""
        # Try Open Graph site name
        og_site = soup.find('meta', property='og:site_name')
        if og_site and og_site.get('content'):
            return og_site['content'].strip()

        # Try to extract from title
        title_tag = soup.find('title')
        if title_tag and title_tag.text:
            # Look for patterns like "Article Title - Site Name"
            title_parts = title_tag.text.split(' - ')
            if len(title_parts) > 1:
                return title_parts[-1].strip()

        return None

    def _resolve_url(self, url: str, base_url: str) -> str:
        """Resolve relative URLs to absolute URLs"""
        if url.startswith(('http://', 'https://')):
            return url
        return urljoin(base_url, url)

    def _error_response(self, error_message: str) -> Dict[str, Optional[str]]:
        """Return standardized error response"""
        return {
            'title': None,
            'description': None,
            'image': None,
            'site_name': None,
            'url': None,
            'success': False,
            'error': error_message
        }

# Global instance
url_preview_service = URLPreviewService()
