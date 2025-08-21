'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { digestsAPI } from '@/lib/api';
import { Digest, DigestsResponse } from '@/lib/types';

export default function PublicDigestsPage() {
  const router = useRouter();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublicDigests();
  }, []);

  const loadPublicDigests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await digestsAPI.getDigests({ view: 'public' });
      const digestsData = response.data as DigestsResponse;
      setDigests(digestsData.digests.filter(digest => digest.is_published && digest.is_public));
    } catch (error: any) {
      console.error('Failed to load public digests:', error);
      setError('Failed to load public digests');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Public Reading Digests</h1>
              <p className="text-gray-600 mt-2">Discover what others are reading and learning</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-3 text-gray-600">Loading public digests...</span>
            </div>
          </div>
        ) : digests.length > 0 ? (
          <div className="grid gap-8">
            {digests.map((digest) => (
              <article
                key={digest.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {digest.author?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {digest.author || `User ${digest.user_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Published {formatDate(digest.published_at || digest.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      📅 {formatDateRange(digest.week_start, digest.week_end)}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    {digest.title}
                  </h2>

                  {digest.summary && (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {digest.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => router.push(`/digests/${digest.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                    >
                      Read Full Digest →
                    </button>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button className="hover:text-gray-700 transition-colors">
                        💬 Comment
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/digests/${digest.id}`);
                          alert('Link copied to clipboard!');
                        }}
                        className="hover:text-gray-700 transition-colors"
                      >
                        📤 Share
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-6 text-4xl">
                🌐
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">No public digests yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Be the first to share your reading journey! Create and publish a digest to inspire others.
              </p>
              <div className="text-sm text-gray-500">
                <p>Want to share your reading insights?</p>
                <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in to create your digest
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
