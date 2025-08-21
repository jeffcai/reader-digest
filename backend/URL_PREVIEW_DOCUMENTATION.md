# URL Preview Service Documentation

## Overview

The URL Preview Service enables users to see previews of articles by crawling URLs to extract metadata without storing the content permanently. This provides a fresh, dynamic preview each time it's requested.

## Features

### ✅ Implemented Features

1. **Dynamic URL Crawling**
   - Extracts title, description, images, and site name from URLs
   - No content storage - fetches fresh data on each request
   - Supports Open Graph and Twitter meta tags
   - Fallback to HTML title tags and first paragraphs

2. **Robust Error Handling**
   - Connection timeouts and failures
   - HTTP errors (404, 500, etc.)
   - Invalid URL formats
   - Graceful degradation when metadata is unavailable

3. **API Endpoint**
   - `POST /api/v1/articles/preview-url`
   - Accepts JSON with `url` field
   - Returns structured preview data

4. **Comprehensive Testing**
   - Unit tests for service logic
   - API endpoint testing
   - Mock HTTP requests
   - Edge case handling

## API Documentation

### Endpoint: `POST /api/v1/articles/preview-url`

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Success Response (200):**
```json
{
  "title": "Article Title",
  "description": "Article description extracted from meta tags",
  "image": "https://example.com/preview-image.jpg",
  "site_name": "Example Site",
  "url": "https://example.com/article",
  "success": true,
  "error": null
}
```

**Error Response (400/500):**
```json
{
  "title": null,
  "description": null,
  "image": null,
  "site_name": null,
  "url": null,
  "success": false,
  "error": "Error message description"
}
```

## Service Architecture

### URLPreviewService Class

**Methods:**
- `get_preview(url)` - Main method to extract preview data
- `_is_valid_url(url)` - Validates URL format
- `_extract_title(soup)` - Extracts page title with fallbacks
- `_extract_description(soup)` - Extracts description with fallbacks
- `_extract_image(soup, base_url)` - Extracts preview image
- `_extract_site_name(soup)` - Extracts site name
- `_resolve_url(url, base_url)` - Resolves relative URLs to absolute

**Metadata Extraction Priority:**

1. **Title Extraction:**
   - Open Graph title (`og:title`)
   - Twitter title (`twitter:title`)
   - HTML `<title>` tag
   - First `<h1>` tag

2. **Description Extraction:**
   - Open Graph description (`og:description`)
   - Twitter description (`twitter:description`)
   - Meta description tag
   - First paragraph text (truncated to 300 chars)

3. **Image Extraction:**
   - Open Graph image (`og:image`)
   - Twitter image (`twitter:image`)
   - First image in `<article>` tag
   - First general image (excluding icons/logos)

## Testing

### Test Files Created

1. **`test_url_preview.py`** - Comprehensive unit tests with mocking
2. **`test_url_preview_simple.py`** - Basic logic tests
3. **`test_api_manual.py`** - API endpoint logic testing

### Test Coverage

- ✅ URL validation
- ✅ URL resolution (relative to absolute)
- ✅ Error response formatting
- ✅ HTML metadata extraction
- ✅ API endpoint request/response handling
- ✅ Edge cases (timeouts, connection errors, HTTP errors)
- ✅ Fallback mechanisms for missing metadata

### Running Tests

```bash
# Run simple tests (no dependencies)
python3 test_url_preview_simple.py
python3 test_api_manual.py

# Run comprehensive tests (requires packages)
python3 test_url_preview.py
```

## Installation & Setup

### 1. Install Dependencies

Add to `requirements.txt`:
```
beautifulsoup4==4.12.2
lxml==4.9.3
requests==2.31.0  # (already included)
```

Install packages:
```bash
pip install beautifulsoup4 lxml requests
```

### 2. Service Integration

The service is automatically imported in `/routes/articles.py`:
```python
from services.url_preview import url_preview_service
```

### 3. API Endpoint

The endpoint is registered at:
```
POST /api/v1/articles/preview-url
```

## Usage Examples

### cURL Testing

```bash
# Test with a real website
curl -X POST http://localhost:5001/api/v1/articles/preview-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/html"}'

# Test with invalid URL
curl -X POST http://localhost:5001/api/v1/articles/preview-url \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid-url"}'
```

### Frontend Integration

```javascript
// Fetch URL preview
const response = await fetch('/api/v1/articles/preview-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/article'
  })
});

const preview = await response.json();

if (preview.success) {
  // Display preview data
  console.log('Title:', preview.title);
  console.log('Description:', preview.description);
  console.log('Image:', preview.image);
} else {
  console.log('Error:', preview.error);
}
```

## Security Considerations

1. **Request Timeout** - 10-second timeout prevents hanging requests
2. **URL Validation** - Only HTTP/HTTPS URLs allowed
3. **User Agent** - Uses standard browser user agent to avoid blocking
4. **No Content Storage** - Metadata only, no content caching
5. **Error Handling** - Safe error messages, no sensitive info exposure

## Performance Considerations

1. **Timeout Management** - Configurable timeout (default 10s)
2. **Session Reuse** - HTTP session reused for multiple requests
3. **No Caching** - Fresh data on each request (trade-off for accuracy)
4. **Memory Efficient** - No content storage, only metadata extraction

## Future Enhancements

Potential improvements that could be added:

1. **Caching Layer** - Redis/Memcached for frequently requested URLs
2. **Rate Limiting** - Prevent abuse of the preview service
3. **Async Processing** - Non-blocking URL fetching
4. **Content Sanitization** - XSS protection for extracted content
5. **Image Size Validation** - Skip very small images (icons)
6. **Domain Whitelist/Blacklist** - Control which domains can be previewed

## Error Codes

| Error | Description | HTTP Status |
|-------|-------------|-------------|
| `URL is required` | Missing or empty URL in request | 400 |
| `Invalid URL format` | URL doesn't start with http/https | 400 |
| `Request timeout` | URL took too long to respond | 200* |
| `Connection failed` | Network connection issues | 200* |
| `HTTP error: XXX` | Server returned error status | 200* |
| `Preview extraction failed` | General extraction error | 200* |

*Returns 200 with `success: false` for preview failures to distinguish from API errors.

## Conclusion

The URL Preview Service provides a robust, secure way to extract article metadata without storing content. It's fully tested, handles edge cases gracefully, and integrates seamlessly with the existing article system.

The implementation focuses on:
- **Reliability** - Comprehensive error handling
- **Security** - URL validation and timeouts
- **Performance** - Efficient parsing and no storage overhead
- **Maintainability** - Well-tested, modular code
- **Extensibility** - Easy to add new metadata sources
