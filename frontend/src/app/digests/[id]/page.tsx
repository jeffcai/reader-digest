'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownPreview from '@uiw/react-md-editor/nohighlight';
import { publicDigestsAPI } from '@/lib/api';

interface Digest {
  id: number;
  title: string;
  content: string;
  summary?: string;
  week_start: string;
  week_end: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  is_published: boolean;
  is_public: boolean;
  user_id: number;
  author?: string;
}

export default function PublicDigestView() {
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
      // Use publicDigestsAPI for public digest viewing (no authentication required)
      const response = await publicDigestsAPI.getDigest(parseInt(digestId));
      const digestData = response.data.digest as Digest;
      
      // Backend already handles public/published checks
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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
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
                This digest may have been removed or you don&apos;t have permission to view it.
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

          {/* Article Body - Using MarkdownPreview like articles */}
          <div className="px-6 py-8">
            <div className="prose prose-lg max-w-none">
              <MarkdownPreview 
                value={digest.content} 
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#374151',
                  fontSize: '16px',
                  lineHeight: '1.7'
                }}
              />
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
