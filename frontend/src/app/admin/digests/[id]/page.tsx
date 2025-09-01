'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { digestsAPI } from '@/lib/api';
import { ArrowLeftIcon, EditIcon, TrashIcon, CalendarIcon, GlobeIcon, LockIcon } from 'lucide-react';
import Link from 'next/link';
import MarkdownPreview from '@uiw/react-markdown-preview';

interface Digest {
  id: number;
  title: string;
  content: string;
  summary: string;
  week_start: string;
  week_end: string;
  is_public: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  user_id: number;
}

export default function ViewDigestPage() {
  const params = useParams();
  const digestId = params.id as string;
  
  const [digest, setDigest] = useState<Digest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load digest data
  useEffect(() => {
    if (user && digestId) {
      loadDigest();
    }
  }, [user, digestId]);

  const loadDigest = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Use digestsAPI for authenticated admin access
      const response = await digestsAPI.getDigest(parseInt(digestId));
      setDigest(response.data.digest);
    } catch (error: unknown) {
      console.error('Error loading digest:', error);
      const errorResponse = error as { response?: { status: number; data?: { error: string } } };
      
      if (errorResponse.response?.status === 401) {
        router.push('/login');
        return;
      } else if (errorResponse.response?.status === 403) {
        setError('You do not have permission to view this digest');
      } else if (errorResponse.response?.status === 404) {
        setError('Digest not found');
      } else {
        setError(errorResponse.response?.data?.error || 'Failed to load digest');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    
    try {
      // Use digestsAPI for authenticated admin delete
      await digestsAPI.deleteDigest(parseInt(digestId));
      router.push('/admin/digests');
    } catch (error: unknown) {
      console.error('Error deleting digest:', error);
      const errorResponse = error as { response?: { status: number; data?: { error: string } } };
      
      if (errorResponse.response?.status === 401) {
        router.push('/login');
        return;
      } else {
        setError(errorResponse.response?.data?.error || 'Failed to delete digest');
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !digest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-center">
              <h2 className="text-lg font-medium mb-2">Error Loading Digest</h2>
              <p>{error || 'Digest not found'}</p>
              <Link href="/admin/digests" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                ← Back to Digests
              </Link>
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
        <div className="mb-8">
          <Link
            href="/admin/digests"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Digests
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{digest.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="inline-flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(digest.week_start)} - {formatDate(digest.week_end)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  digest.is_published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {digest.is_published ? 'Published' : 'Draft'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  digest.is_public
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {digest.is_public ? (
                    <>
                      <GlobeIcon className="h-3 w-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <LockIcon className="h-3 w-3 mr-1" />
                      Private
                    </>
                  )}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/admin/digests/${digest.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Summary */}
        {digest.summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Summary</h2>
            <p className="text-blue-800">{digest.summary}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Content</h2>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <MarkdownPreview 
                source={digest.content} 
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#374151'
                }}
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2 text-gray-600">{formatDateTime(digest.created_at)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Updated:</span>
              <span className="ml-2 text-gray-600">{formatDateTime(digest.updated_at)}</span>
            </div>
            {digest.published_at && (
              <div>
                <span className="font-medium text-gray-700">Published:</span>
                <span className="ml-2 text-gray-600">{formatDateTime(digest.published_at)}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Digest ID:</span>
              <span className="ml-2 text-gray-600">#{digest.id}</span>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-5">Delete Digest</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete &quot;{digest.title}&quot;? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {deleteLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
