#!/usr/bin/env python3
"""
Weekly Digest Service Logic Test
Tests the core functionality without database dependencies
"""

from datetime import datetime, timedelta
from collections import namedtuple

# Mock Article data structure
Article = namedtuple('Article', ['id', 'title', 'url', 'created_at', 'tags', 'notes'])

def create_mock_articles():
    """Create mock articles for testing"""
    base_date = datetime.now() - timedelta(days=3)
    
    return [
        Article(
            id=1,
            title="Understanding Python Decorators",
            url="https://example.com/python-decorators",
            created_at=base_date,
            tags="python,programming,decorators",
            notes="Great explanation of decorators with practical examples."
        ),
        Article(
            id=2,
            title="Machine Learning Best Practices", 
            url="https://example.com/ml-practices",
            created_at=base_date + timedelta(days=1),
            tags="machine-learning,best-practices,data-science",
            notes="Key principles for building robust ML systems."
        ),
        Article(
            id=3,
            title="React Hooks Deep Dive",
            url="https://example.com/react-hooks", 
            created_at=base_date + timedelta(days=2),
            tags="react,javascript,frontend,hooks",
            notes="Comprehensive guide to React hooks with practical examples."
        )
    ]

def format_article_tags(tags_string):
    """Format tags for markdown display"""
    if not tags_string:
        return ""
    
    tags = [tag.strip() for tag in tags_string.split(',')]
    return ', '.join(f'`{tag}`' for tag in tags if tag)

def generate_articles_section(articles):
    """Generate the articles section of the digest"""
    if not articles:
        return "No articles found for this period."
    
    sections = []
    for i, article in enumerate(articles, 1):
        # Format created_at
        read_date = article.created_at.strftime("%B %d, %Y")
        
        # Format tags
        tags_formatted = format_article_tags(article.tags)
        
        # Format notes
        notes_lines = []
        if article.notes:
            for line in article.notes.split('\n'):
                if line.strip():
                    notes_lines.append(f"> {line.strip()}")
        
        notes_section = '\n'.join(notes_lines) if notes_lines else "> No notes available."
        
        # Build article section
        section = f"""### {i}. [{article.title}]({article.url})

**Read on:** {read_date}

**Tags:** {tags_formatted}

**Summary:**
_AI summary will be generated here in future updates._

**My Notes:**
{notes_section}"""
        
        sections.append(section)
    
    return '\n\n'.join(sections)

def generate_weekly_digest_mock(articles, start_date=None, end_date=None, custom_title=None):
    """Generate a weekly digest from mock articles"""
    
    if not start_date:
        start_date = datetime.now() - timedelta(days=7)
    if not end_date:
        end_date = datetime.now()
    
    # Filter articles by date range
    filtered_articles = [
        article for article in articles
        if start_date <= article.created_at <= end_date
    ]
    
    # Generate title
    if custom_title:
        title = custom_title
    else:
        start_str = start_date.strftime("%B %d")
        end_str = end_date.strftime("%B %d, %Y")
        title = f"Weekly Reading Digest: {start_str} - {end_str}"
    
    # Generate articles section
    articles_section = generate_articles_section(filtered_articles)
    
    # Generate footer
    article_count = len(filtered_articles)
    start_str = start_date.strftime("%B %d, %Y")
    end_str = end_date.strftime("%B %d, %Y")
    footer = f"*This digest covers {article_count} articles read between {start_str} and {end_str}.*"
    
    # Combine everything
    digest_content = f"""# {title}

## All articles in past week

{articles_section}

---

{footer}"""
    
    return {
        'content': digest_content,
        'title': title,
        'article_count': article_count,
        'start_date': start_date,
        'end_date': end_date
    }

def test_weekly_digest_service():
    """Test the weekly digest generation logic"""
    print("=" * 80)
    print("WEEKLY DIGEST SERVICE LOGIC TEST")
    print("=" * 80)
    
    # Create mock articles
    articles = create_mock_articles()
    
    print(f"📊 Test Data: {len(articles)} mock articles created")
    for i, article in enumerate(articles, 1):
        print(f"   {i}. {article.title}")
        print(f"      Created: {article.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"      Tags: {article.tags}")
        print()
    
    # Test digest generation
    print("🔄 Generating weekly digest...")
    digest = generate_weekly_digest_mock(articles)
    
    print(f"✅ Digest generated successfully!")
    print(f"   Title: {digest['title']}")
    print(f"   Articles: {digest['article_count']}")
    print(f"   Date range: {digest['start_date'].strftime('%Y-%m-%d')} to {digest['end_date'].strftime('%Y-%m-%d')}")
    
    print("\n" + "="*80)
    print("GENERATED DIGEST CONTENT")
    print("="*80)
    print(digest['content'])
    print("="*80)
    
    # Test custom title
    print("\n🎯 Testing custom title...")
    custom_digest = generate_weekly_digest_mock(
        articles, 
        custom_title="My Personal Reading Digest - Week 1"
    )
    print(f"✅ Custom title: {custom_digest['title']}")
    
    # Validate structure
    print("\n🔍 Validating digest structure...")
    content = digest['content']
    
    validations = [
        ("Has main title", content.startswith("# Weekly Reading Digest:")),
        ("Has articles section", "## All articles in past week" in content),
        ("Has numbered articles", "### 1." in content),
        ("Has reading dates", "**Read on:**" in content),
        ("Has tags", "**Tags:**" in content),
        ("Has AI placeholders", "_AI summary will be generated here in future updates._" in content),
        ("Has notes sections", "**My Notes:**" in content),
        ("Has quote formatting", ">" in content),
        ("Has footer", "*This digest covers" in content),
        ("Article count in footer", f"{len(articles)} articles" in content)
    ]
    
    all_valid = True
    for validation_name, is_valid in validations:
        status = "✅" if is_valid else "❌"
        print(f"   {status} {validation_name}")
        if not is_valid:
            all_valid = False
    
    print(f"\n{'🎉 ALL TESTS PASSED!' if all_valid else '⚠️  SOME TESTS FAILED'}")
    
    return digest

if __name__ == '__main__':
    test_weekly_digest_service()
