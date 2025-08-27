'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { digestsAPI } from '@/lib/api';
import { Digest, DigestsResponse, WeeklyDigestGenerationResponse } from '@/lib/types';
import WeeklyDigestGenerator from '@/components/WeeklyDigestGenerator';
import DigestReviewEditor from '@/components/DigestReviewEditor';

type ViewState = 'list' | 'generate' | 'review';

export default function DigestsPage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('list');
  const [digests, setDigests] = useState<Digest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDigest, setGeneratedDigest] = useState<WeeklyDigestGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewState === 'list') {
      loadDigests();
    }
  }, [viewState]);

  const loadDigests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await digestsAPI.getDigests({ view: 'own' });
      const digestsData = response.data as DigestsResponse;
      
      // Debug: Check for duplicate IDs
      const ids = digestsData.digests.map(d => d.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('Duplicate digest IDs found:', duplicateIds);
      }
      console.log('Loaded digests:', digestsData.digests.map(d => ({ id: d.id, title: d.title })));
      
      setDigests(digestsData.digests);
    } catch (error: any) {
      console.error('Failed to load digests:', error);
      setError('Failed to load digests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigestGenerated = (digest: WeeklyDigestGenerationResponse) => {
    setGeneratedDigest(digest);
    setViewState('review');
  };

  const handleDigestSaved = (digest: Digest) => {
    // Add the new digest to the list
    setDigests(prev => [digest, ...prev]);
    setViewState('list');
    setGeneratedDigest(null);
  };

  const handleCancel = () => {
    setViewState('list');
    setGeneratedDigest(null);
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Weekly Digests</h1>
                <p className="text-gray-600 mt-1">Create and manage your reading summaries</p>
              </div>
              
              {viewState === 'list' && (
                <button
                  onClick={() => setViewState('generate')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  ✨ Generate New Digest
                </button>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          {viewState !== 'list' && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setViewState('list')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to Digests
                </button>
                <span className="text-sm text-gray-500">
                  {viewState === 'generate' && 'Generate Weekly Digest'}
                  {viewState === 'review' && 'Review & Edit Digest'}
                </span>
              </nav>
            </div>
          )}
        </div>

        {/* Main Content */}
        {viewState === 'list' && (
          <div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">Loading your digests...</span>
                </div>
              </div>
            ) : digests.length > 0 ? (
              <div className="grid gap-6">
                {digests.map((digest, index) => (
                  <div
                    key={digest.id ? `digest-${digest.id}` : `digest-index-${index}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{digest.title}</h3>
                          <div className="flex space-x-2">
                            {digest.is_published && (
                              <span 
                                key={`published-badge-${digest.id || index}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                Published
                              </span>
                            )}
                            {!digest.is_published && (
                              <span 
                                key={`draft-badge-${digest.id || index}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                Draft
                              </span>
                            )}
                            {digest.is_public && (
                              <span 
                                key={`public-badge-${digest.id || index}`}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                Public
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          📅 {formatDateRange(digest.week_start, digest.week_end)}
                          <span className="mx-2">•</span>
                          📝 Created {formatDate(digest.created_at)}
                          {digest.published_at && (
                            <React.Fragment key={`published-${digest.id || index}`}>
                              <span className="mx-2">•</span>
                              🚀 Published {formatDate(digest.published_at)}
                            </React.Fragment>
                          )}
                        </div>
                        
                        {digest.summary && (
                          <p key={`summary-${digest.id || index}`} className="text-gray-700 mb-3">{digest.summary}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <button 
                            onClick={() => router.push(`/digests/${digest.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            View Details
                          </button>
                          {!digest.is_published && (
                            <button 
                              key={`edit-button-${digest.id || index}`}
                              className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/digests/${digest.id}`);
                              alert('Link copied to clipboard!');
                            }}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    📖
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No digests yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first weekly digest to summarize your reading journey.
                  </p>
                  <button
                    onClick={() => setViewState('generate')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    ✨ Generate Your First Digest
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewState === 'generate' && (
          <WeeklyDigestGenerator onDigestGenerated={handleDigestGenerated} />
        )}

        {viewState === 'review' && generatedDigest && (
          <DigestReviewEditor
            digestData={generatedDigest}
            onSave={handleDigestSaved}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
