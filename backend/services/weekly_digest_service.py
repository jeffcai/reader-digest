from datetime import datetime, timedelta, date
from models.models import Article, User
from database import db
from typing import List, Dict, Optional, Union
import json

class WeeklyDigestService:
    """Service for generating weekly digests from user articles"""
    
    def __init__(self):
        self.template = """# {title}

## All articles in past week

{articles_section}

---

*This digest covers {articles_count} articles read between {week_start} and {week_end}.*
"""
    
    def generate_weekly_digest(
        self, 
        user_id: int, 
        week_start: Optional[Union[datetime, date, str]] = None, 
        week_end: Optional[Union[datetime, date, str]] = None,
        custom_title: Optional[str] = None
    ) -> Dict:
        """
        Generate a weekly digest for a user's articles
        
        Args:
            user_id: ID of the user
            week_start: Start date of the week (optional, defaults to last week)
            week_end: End date of the week (optional, defaults to last week)
            custom_title: Custom title for the digest (optional)
            
        Returns:
            Dict containing the generated digest data
        """
        # Set default week range if not provided
        if not week_start or not week_end:
            today = datetime.now().date()
            days_since_monday = today.weekday()
            week_start_date = today - timedelta(days=days_since_monday + 7)
            week_end_date = week_start_date + timedelta(days=6)
        else:
            # Convert to date objects if needed
            if isinstance(week_start, str):
                week_start_date = datetime.strptime(week_start, '%Y-%m-%d').date()
            elif isinstance(week_start, datetime):
                week_start_date = week_start.date()
            else:
                week_start_date = week_start
            
            if isinstance(week_end, str):
                week_end_date = datetime.strptime(week_end, '%Y-%m-%d').date()
            elif isinstance(week_end, datetime):
                week_end_date = week_end.date()
            else:
                week_end_date = week_end
        
        # Get user's articles from that week
        articles = Article.query.filter(
            Article.user_id == user_id,
            Article.reading_date >= week_start_date,
            Article.reading_date <= week_end_date
        ).order_by(Article.reading_date, Article.created_at).all()
        
        if not articles:
            raise ValueError(f"No articles found for the week {week_start_date} to {week_end_date}")
        
        # Get user info for title generation
        user = User.query.get(user_id)
        username = user.username if user else "User"
        
        # Generate title
        if custom_title:
            title = custom_title
        else:
            # Format week range nicely
            start_str = week_start_date.strftime("%B %d")
            end_str = week_end_date.strftime("%B %d, %Y")
            if week_start_date.month == week_end_date.month:
                start_str = week_start_date.strftime("%B %d")
                end_str = week_end_date.strftime("%d, %Y")
            title = f"Weekly Reading Digest: {start_str} - {end_str}"
        
        # Generate articles section
        articles_section = self._generate_articles_section(articles)
        
        # Generate the complete content using the template
        content = self.template.format(
            title=title,
            articles_section=articles_section,
            articles_count=len(articles),
            week_start=week_start_date.strftime("%B %d, %Y"),
            week_end=week_end_date.strftime("%B %d, %Y")
        )
        
        # Generate summary
        summary = self._generate_summary(articles, week_start_date, week_end_date)
        
        return {
            'title': title,
            'content': content,
            'summary': summary,
            'week_start': week_start_date.isoformat(),
            'week_end': week_end_date.isoformat(),
            'articles_count': len(articles),
            'articles': [article.to_dict() for article in articles]
        }
    
    def _generate_articles_section(self, articles: List[Article]) -> str:
        """Generate the articles section of the digest"""
        if not articles:
            return "_No articles were read this week._"
        
        sections = []
        
        for i, article in enumerate(articles, 1):
            # Article title with URL link
            if article.url:
                article_header = f"[{article.title}]({article.url})"
            else:
                article_header = article.title
            
            # Build the article section
            section = f"### {i}. {article_header}\n\n"
            
            # Add reading date
            section += f"**Read on:** {article.reading_date.strftime('%B %d, %Y')}\n\n"
            
            # Add tags if available
            if article.tags:
                try:
                    tags = json.loads(article.tags) if isinstance(article.tags, str) else article.tags
                    if tags and isinstance(tags, list):
                        tags_str = ", ".join([f"`{tag}`" for tag in tags])
                        section += f"**Tags:** {tags_str}\n\n"
                except (json.JSONDecodeError, TypeError):
                    pass
            
            # Add AI summary placeholder
            section += "**Summary:**\n"
            section += "_AI summary will be generated here in future updates._\n\n"
            
            # Add user notes
            if article.notes:
                section += "**My Notes:**\n"
                # Format notes with proper markdown indentation
                notes_lines = article.notes.split('\n')
                formatted_notes = '\n'.join([f"> {line}" if line.strip() else ">" for line in notes_lines])
                section += f"{formatted_notes}\n\n"
            else:
                section += "**My Notes:**\n"
                section += "_No notes taken for this article._\n\n"
            
            sections.append(section)
        
        return '\n'.join(sections)
    
    def _generate_summary(self, articles: List[Article], week_start: date, week_end: date) -> str:
        """Generate a summary of the weekly digest"""
        if not articles:
            return f"No articles were read during the week of {week_start} to {week_end}."
        
        # Count articles by day
        daily_counts = {}
        for article in articles:
            day = article.reading_date.strftime('%A')
            daily_counts[day] = daily_counts.get(day, 0) + 1
        
        # Extract unique tags
        all_tags = []
        for article in articles:
            if article.tags:
                try:
                    tags = json.loads(article.tags) if isinstance(article.tags, str) else article.tags
                    if tags and isinstance(tags, list):
                        all_tags.extend(tags)
                except (json.JSONDecodeError, TypeError):
                    pass
        
        unique_tags = list(set(all_tags))
        
        # Build summary
        summary_parts = []
        summary_parts.append(f"Read {len(articles)} articles during the week of {week_start.strftime('%B %d')} to {week_end.strftime('%B %d, %Y')}.")
        
        if daily_counts:
            most_active_day = max(daily_counts.items(), key=lambda x: x[1])
            summary_parts.append(f"Most active reading day: {most_active_day[0]} with {most_active_day[1]} articles.")
        
        if unique_tags:
            top_tags = unique_tags[:5]  # Show top 5 tags
            summary_parts.append(f"Main topics covered: {', '.join(top_tags)}.")
        
        return ' '.join(summary_parts)

    def get_available_weeks(self, user_id: int, limit: int = 12) -> List[Dict]:
        """Get available weeks that have articles for the user"""
        # Get all reading dates for the user
        articles = db.session.query(Article.reading_date).filter(
            Article.user_id == user_id
        ).distinct().order_by(Article.reading_date.desc()).all()
        
        if not articles:
            return []
        
        weeks = []
        processed_weeks = set()
        
        for article in articles:
            reading_date = article.reading_date
            # Calculate the Monday of that week
            monday = reading_date - timedelta(days=reading_date.weekday())
            sunday = monday + timedelta(days=6)
            
            week_key = monday.isoformat()
            
            if week_key not in processed_weeks:
                # Count articles in this week
                article_count = Article.query.filter(
                    Article.user_id == user_id,
                    Article.reading_date >= monday,
                    Article.reading_date <= sunday
                ).count()
                
                weeks.append({
                    'week_start': monday.isoformat(),
                    'week_end': sunday.isoformat(),
                    'week_label': f"{monday.strftime('%b %d')} - {sunday.strftime('%b %d, %Y')}",
                    'article_count': article_count
                })
                
                processed_weeks.add(week_key)
            
            if len(weeks) >= limit:
                break
        
        return weeks
