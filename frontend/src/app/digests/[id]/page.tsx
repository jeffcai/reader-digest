'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { publicDigestsAPI } from '@/lib/api';
import { ArrowLeft, Calendar, User, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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

export default function DigestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const [digest, setDigest] = useState<Digest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const digestId = resolvedParams.id;
  const referrer = searchParams.get('ref');

  // Helper functions for navigation based on referrer
  const getBackUrl = () => {
    return referrer === 'admin' ? '/admin' : '/public/digests';
  };

  const getBackLabel = () => {
    return referrer === 'admin' ? 'Back to Admin Dashboard' : 'Back to Digests';
  };

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
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: digest?.title || 'Weekly Digest',
          text: digest?.summary || '',
          url: url,
        });
      } catch {
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
    } catch {
      console.error('Failed to copy');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Digest not found'}
          </h3>
          <p className="text-gray-600 mb-6">
            This digest may have been removed or you don&apos;t have permission to view it.
          </p>
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={getBackUrl()}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
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
        </div>
      </div>

      {/* Digest Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {digest.title || `Weekly Digest - ${formatDateRange(digest.week_start, digest.week_end)}`}
      </h1>

      {/* Digest Meta */}
      <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-500 mb-6">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{formatDateRange(digest.week_start, digest.week_end)}</span>
        </div>
        
        {digest.author && (
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>By {digest.author || `User ${digest.user_id}`}</span>
          </div>
        )}
        
        <span className="text-blue-600">
          Published {formatDate(digest.published_at || digest.created_at)}
        </span>
      </div>

      {/* Digest Summary */}
      {digest.summary && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Summary</h2>
          <div className="text-blue-700 leading-relaxed">
            {digest.summary}
          </div>
        </div>
      )}

      {/* Digest Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Digest Content</h2>
        <div className="prose prose-lg max-w-none">
          <MarkdownRenderer content={digest.content} />
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
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
