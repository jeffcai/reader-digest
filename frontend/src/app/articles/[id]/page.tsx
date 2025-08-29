'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Article } from '@/lib/types';
import { articlesAPI } from '@/lib/api';
import { formatDate, getDomainFromUrl, extractTags } from '@/lib/utils';
import { ArrowLeft, ExternalLink, Calendar, Tag, User, Share2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import UrlPreviewCard from '@/components/UrlPreviewCard';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function ArticleView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const referrer = searchParams.get('ref');
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Helper functions for navigation based on referrer
  const getBackUrl = () => {
    return referrer === 'admin' ? '/admin' : '/';
  };

  const getBackLabel = () => {
    return referrer === 'admin' ? 'Back to Admin Dashboard' : 'Back to Articles';
  };

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the specific article by ID using the API
      const response = await articlesAPI.getArticle(parseInt(articleId));
      setArticle(response.data.article);
    } catch (err: any) {
      console.error('Error fetching article:', err);
      
      if (err.response?.status === 404) {
        setError('Article not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this article');
      } else {
        setError('Failed to load article. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'Article',
          text: article?.notes || '',
          url: url,
        });
      } catch (err) {
        // Fallback to copy to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openOriginalUrl = () => {
    if (article?.url) {
      window.open(article.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={getBackUrl()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            {getBackLabel()}
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Article Not Found</h1>
          <Link
            href={getBackUrl()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            {getBackLabel()}
          </Link>
        </div>
      </div>
    );
  }

  const tags = extractTags(article.tags || []);
  const domain = getDomainFromUrl(article.url);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={getBackUrl()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {getBackLabel()}
          </Link>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
            >
              {copySuccess ? (
                <Check className="h-5 w-5 mr-1" />
              ) : (
                <Share2 className="h-5 w-5 mr-1" />
              )}
              {copySuccess ? 'Copied!' : 'Share'}
            </button>
            
            {article.url && (
              <button
                onClick={openOriginalUrl}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <ExternalLink className="h-5 w-5 mr-1" />
                Original
              </button>
            )}
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        {/* Article Meta */}
        <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-500 mb-6">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(article.reading_date)}</span>
          </div>
          
          {article.author && (
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>By {article.author}</span>
            </div>
          )}
          
          {domain && (
            <span className="text-blue-600">{domain}</span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center space-x-2 mb-6">
            <Tag className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <span
                  key={`tag-${article.id}-${tag}`}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* URL Preview */}
      {article.url && (
        <div className="mb-8">
          <UrlPreviewCard 
            url={article.url} 
            compact={false} 
            showImage={true}
          />
        </div>
      )}

      {/* Article Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Content</h2>
        <div className="prose prose-lg max-w-none">
          {article.content ? (
            <MarkdownRenderer content={article.content} />
          ) : (
            <div className="text-gray-500 italic">
              No content available for this article.
            </div>
          )}
        </div>
      </div>

      {/* Personal Notes */}
      {article.notes && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-8">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">Personal Notes</h2>
          <div className="text-amber-700 leading-relaxed whitespace-pre-wrap">
            {article.notes}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8 text-center">
        <Link
          href={getBackUrl()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {getBackLabel()}
        </Link>
      </div>
    </div>
  );
}
