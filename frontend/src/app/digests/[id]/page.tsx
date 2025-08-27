'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { digestsAPI } from '@/lib/api';
import { Digest } from '@/lib/types';

export default function DigestViewPage() {
  const params = useParams();
  const router = useRouter();
  const [digest, setDigest] = useState<Digest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const digestId = params.id as string;

  useEffect(() => {
    if (digestId) {
      loadDigest();
    }
  }, [digestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDigest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await digestsAPI.getDigest(parseInt(digestId));
      const digestData = response.data.digest as Digest;
      
      // Check if digest is published and public, or if user owns it
      if (!digestData.is_published || !digestData.is_public) {
        setError('This digest is not available publicly');
        return;
      }
      
      setDigest(digestData);
    } catch (error: unknown) {
      console.error('Failed to load digest:', error);
      const errorResponse = error as { response?: { status: number } };
      if (errorResponse.response?.status === 404) {
        setError('Digest not found');
      } else if (errorResponse.response?.status === 403) {
        setError('You do not have permission to view this digest');
      } else {
        setError('Failed to load digest');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const renderMarkdownContent = (content: string) => {
    // Split content by lines for processing
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const uniqueKey = `digest-line-${index}-${trimmedLine.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}-${line.length}`;
      
      if (trimmedLine.startsWith('# ')) {
        // Main heading
        elements.push(
          <h1 key={uniqueKey} className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">
            {trimmedLine.slice(2)}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        // Section heading
        elements.push(
          <h2 key={uniqueKey} className="text-2xl font-semibold text-gray-800 mb-4 mt-8">
            {trimmedLine.slice(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        // Article heading (with link extraction)
        const linkMatch = trimmedLine.match(/###\s*(\d+\.\s*)?\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [, number, title, url] = linkMatch;
          elements.push(
            <div key={uniqueKey} className="mb-6">
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                {number && <span className="text-blue-600 mr-2">{number}</span>}
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {title}
                </a>
              </h3>
            </div>
          );
        } else {
          elements.push(
            <h3 key={uniqueKey} className="text-xl font-medium text-gray-900 mb-3">
              {trimmedLine.slice(4)}
            </h3>
          );
        }
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold metadata lines
        const boldText = trimmedLine.slice(2, -2);
        elements.push(
          <p key={uniqueKey} className="font-semibold text-gray-800 mb-2">
            {boldText}
          </p>
        );
      } else if (trimmedLine.startsWith('> ')) {
        // Quote/notes
        elements.push(
          <blockquote key={uniqueKey} className="border-l-4 border-blue-200 pl-4 italic text-gray-700 mb-2 bg-blue-50 py-2">
            {trimmedLine.slice(2)}
          </blockquote>
        );
      } else if (trimmedLine.startsWith('_') && trimmedLine.endsWith('_')) {
        // Italic text (AI summaries)
        elements.push(
          <p key={uniqueKey} className="italic text-gray-600 bg-gray-50 px-4 py-3 rounded-md mb-3">
            {trimmedLine.slice(1, -1)}
          </p>
        );
      } else if (trimmedLine.includes('`')) {
        // Tags with backticks
        const processedLine = trimmedLine.replace(/`([^`]+)`/g, '<span class="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono mr-1">$1</span>');
        elements.push(
          <div key={uniqueKey} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      } else if (trimmedLine === '---') {
        // Horizontal rule
        elements.push(
          <hr key={uniqueKey} className="my-8 border-gray-300" />
        );
      } else if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*')) {
        // Footer text
        elements.push(
          <p key={uniqueKey} className="text-sm text-gray-500 italic text-center mt-6">
            {trimmedLine.slice(1, -1)}
          </p>
        );
      } else if (trimmedLine) {
        // Regular paragraph
        elements.push(
          <p key={uniqueKey} className="text-gray-700 mb-3 leading-relaxed">
            {trimmedLine}
          </p>
        );
      } else {
        // Empty line - add spacing
        elements.push(<div key={uniqueKey} className="mb-2" />);
      }
    });
    
    return elements;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-3 text-gray-600">Loading digest...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-400 mb-4 text-4xl">
                ⚠️
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Digest not found'}</h3>
              <p className="text-gray-600 mb-6">
                This digest may have been removed or you don't have permission to view it.
              </p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back
              </button>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Digest Content */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Article Header */}
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg font-medium">
                    {digest.author?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {digest.author || `User ${digest.user_id}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Published {formatDate(digest.published_at || digest.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-md border">
                📅 {formatDateRange(digest.week_start, digest.week_end)}
              </div>
            </div>

            {digest.summary && (
              <div className="bg-white rounded-md p-4 border-l-4 border-blue-300">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700 leading-relaxed">{digest.summary}</p>
              </div>
            )}
          </div>

          {/* Article Body */}
          <div className="px-6 py-8">
            <div className="prose prose-lg max-w-none">
              {renderMarkdownContent(digest.content)}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Created: {formatDate(digest.created_at)}
                {digest.updated_at !== digest.created_at && (
                  <span className="ml-4">
                    Updated: {formatDate(digest.updated_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleShare}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  📤 Share this digest
                </button>
                <a
                  href="/public/digests"
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  📚 More digests
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
