from flask import Blueprint, Response, request, url_for
from models.models import Article, User
from database import db
from datetime import datetime
import xml.etree.ElementTree as ET
from xml.dom import minidom
import html

rss_bp = Blueprint('rss', __name__)

@rss_bp.route('/articles.xml')
def articles_rss_feed():
    """Generate RSS feed for public articles"""
    try:
        # Get query parameters for filtering
        limit = request.args.get('limit', 50, type=int)  # Default to 50 articles
        user_id = request.args.get('user_id', type=int)
        tag = request.args.get('tag')
        
        # Build query for public articles
        query = Article.query.filter_by(is_public=True)
        
        # Apply filters
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if tag:
            query = query.filter(Article.tags.contains(tag))
        
        # Order by most recent and limit results
        articles = query.order_by(Article.created_at.desc()).limit(limit).all()
        
        # Generate RSS XML
        rss_xml = generate_rss_xml(articles, user_id, tag)
        
        return Response(
            rss_xml,
            mimetype='application/rss+xml',
            headers={
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'  # Cache for 1 hour
            }
        )
        
    except Exception as e:
        print(f"RSS Feed Error: {str(e)}")
        return Response(
            generate_error_rss(),
            mimetype='application/rss+xml',
            status=500
        )

@rss_bp.route('/user/<int:user_id>/articles.xml')
def user_articles_rss_feed(user_id):
    """Generate RSS feed for a specific user's public articles"""
    try:
        # Build query for specific user's public articles
        query = Article.query.filter_by(is_public=True, user_id=user_id)
        
        # Get limit from query params
        limit = request.args.get('limit', 50, type=int)
        
        # Order by most recent and limit results
        articles = query.order_by(Article.created_at.desc()).limit(limit).all()
        
        # Generate RSS XML
        rss_xml = generate_rss_xml(articles, user_id, None)
        
        return Response(
            rss_xml,
            mimetype='application/rss+xml',
            headers={
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'  # Cache for 1 hour
            }
        )
        
    except Exception as e:
        print(f"User RSS Feed Error: {str(e)}")
        return Response(
            generate_error_rss(),
            mimetype='application/rss+xml',
            status=500
        )

@rss_bp.route('/tag/<tag>/articles.xml')
def tag_articles_rss_feed(tag):
    """Generate RSS feed for articles with a specific tag"""
    try:
        # Build query for articles with specific tag
        query = Article.query.filter_by(is_public=True).filter(Article.tags.contains(tag))
        
        # Get limit from query params
        limit = request.args.get('limit', 50, type=int)
        
        # Order by most recent and limit results
        articles = query.order_by(Article.created_at.desc()).limit(limit).all()
        
        # Generate RSS XML
        rss_xml = generate_rss_xml(articles, None, tag)
        
        return Response(
            rss_xml,
            mimetype='application/rss+xml',
            headers={
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'  # Cache for 1 hour
            }
        )
        
    except Exception as e:
        print(f"Tag RSS Feed Error: {str(e)}")
        return Response(
            generate_error_rss(),
            mimetype='application/rss+xml',
            status=500
        )

def generate_rss_xml(articles, user_id=None, tag=None):
    """Generate RSS 2.0 XML for articles"""
    
    # Create root RSS element
    rss = ET.Element('rss')
    rss.set('version', '2.0')
    rss.set('xmlns:content', 'http://purl.org/rss/1.0/modules/content/')
    rss.set('xmlns:atom', 'http://www.w3.org/2005/Atom')
    
    # Create channel
    channel = ET.SubElement(rss, 'channel')
    
    # Channel metadata
    title_text = "Reader Digest - Public Articles"
    if user_id:
        # Get user name for filtered feed
        user = User.query.get(user_id)
        if user:
            title_text = f"Reader Digest - Articles by {user.first_name or user.username}"
    elif tag:
        title_text = f"Reader Digest - Articles tagged '{tag}'"
    
    title = ET.SubElement(channel, 'title')
    title.text = title_text
    
    link = ET.SubElement(channel, 'link')
    link.text = request.url_root.rstrip('/') + '/public/articles'
    
    description = ET.SubElement(channel, 'description')
    if user_id:
        user = User.query.get(user_id)
        description.text = f"Latest articles shared by {user.first_name or user.username if user else 'Unknown User'} on Reader Digest"
    elif tag:
        description.text = f"Latest articles tagged with '{tag}' on Reader Digest"
    else:
        description.text = "Latest articles shared by the Reader Digest community - discover what others are reading and their thoughts"
    
    language = ET.SubElement(channel, 'language')
    language.text = 'en-us'
    
    last_build_date = ET.SubElement(channel, 'lastBuildDate')
    last_build_date.text = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    
    generator = ET.SubElement(channel, 'generator')
    generator.text = 'Reader Digest RSS Feed Generator'
    
    # Add atom:link for self-reference
    atom_link = ET.SubElement(channel, 'atom:link')
    atom_link.set('href', request.url)
    atom_link.set('rel', 'self')
    atom_link.set('type', 'application/rss+xml')
    
    # Add articles as items
    for article in articles:
        item = ET.SubElement(channel, 'item')
        
        # Item title
        item_title = ET.SubElement(item, 'title')
        item_title.text = html.escape(article.title)
        
        # Item link
        item_link = ET.SubElement(item, 'link')
        article_url = request.url_root.rstrip('/') + f'/articles/{article.id}'
        item_link.text = article_url
        
        # Item description (notes + content preview)
        item_description = ET.SubElement(item, 'description')
        description_text = ""
        
        if article.notes:
            description_text += f"<p><strong>Notes:</strong> {html.escape(article.notes)}</p>"
        
        if article.content:
            # Truncate content for description
            content_preview = article.content[:300] + "..." if len(article.content) > 300 else article.content
            description_text += f"<p><strong>Content:</strong> {html.escape(content_preview)}</p>"
        
        if article.url:
            description_text += f"<p><strong>Original URL:</strong> <a href='{html.escape(article.url)}'>{html.escape(article.url)}</a></p>"
        
        # Add tags
        if article.tags:
            try:
                import json
                tags = json.loads(article.tags) if isinstance(article.tags, str) else article.tags
                if tags:
                    tags_text = ", ".join([html.escape(str(tag)) for tag in tags])
                    description_text += f"<p><strong>Tags:</strong> {tags_text}</p>"
            except:
                pass
        
        item_description.text = description_text
        
        # Full content in content:encoded
        content_encoded = ET.SubElement(item, 'content:encoded')
        full_content = ""
        if article.content:
            full_content += f"<h3>Content</h3><div>{html.escape(article.content)}</div>"
        if article.notes:
            full_content += f"<h3>Notes</h3><div>{html.escape(article.notes)}</div>"
        if article.url:
            full_content += f"<h3>Original Article</h3><p><a href='{html.escape(article.url)}'>{html.escape(article.url)}</a></p>"
        content_encoded.text = full_content
        
        # Author
        item_author = ET.SubElement(item, 'author')
        author_name = article.author.first_name or article.author.username if article.author else "Unknown"
        item_author.text = f"noreply@readerdigest.com ({html.escape(author_name)})"
        
        # Publication date
        pub_date = ET.SubElement(item, 'pubDate')
        pub_date.text = article.created_at.strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        # Unique identifier
        guid = ET.SubElement(item, 'guid')
        guid.set('isPermaLink', 'true')
        guid.text = article_url
        
        # Categories (tags)
        if article.tags:
            try:
                import json
                tags = json.loads(article.tags) if isinstance(article.tags, str) else article.tags
                if tags:
                    for tag in tags:
                        category = ET.SubElement(item, 'category')
                        category.text = html.escape(str(tag))
            except:
                pass
    
    # Convert to pretty XML string
    xml_str = ET.tostring(rss, encoding='unicode')
    dom = minidom.parseString(xml_str)
    return dom.toprettyxml(indent='  ', encoding='utf-8').decode('utf-8')

def generate_error_rss():
    """Generate error RSS feed"""
    rss = ET.Element('rss')
    rss.set('version', '2.0')
    
    channel = ET.SubElement(rss, 'channel')
    
    title = ET.SubElement(channel, 'title')
    title.text = "Reader Digest RSS - Error"
    
    description = ET.SubElement(channel, 'description')
    description.text = "An error occurred while generating the RSS feed"
    
    item = ET.SubElement(channel, 'item')
    item_title = ET.SubElement(item, 'title')
    item_title.text = "RSS Feed Error"
    
    item_description = ET.SubElement(item, 'description')
    item_description.text = "There was an error generating the RSS feed. Please try again later."
    
    xml_str = ET.tostring(rss, encoding='unicode')
    dom = minidom.parseString(xml_str)
    return dom.toprettyxml(indent='  ', encoding='utf-8').decode('utf-8')