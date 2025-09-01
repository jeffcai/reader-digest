'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { digestsAPI } from '@/lib/api';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import MarkdownEditor from '@/components/MarkdownEditor';

interface DigestFormData {
  title: string;
  content: string;
  summary: string;
  week_start: string;
  week_end: string;
  is_public: boolean;
  is_published: boolean;
}

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
}

export default function EditDigestPage() {
  const params = useParams();
  const digestId = params.id as string;
  
  const [formData, setFormData] = useState<DigestFormData>({
    title: '',
    content: '',
    summary: '',
    week_start: '',
    week_end: '',
    is_public: true,
    is_published: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDigest, setIsLoadingDigest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  
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
      setIsLoadingDigest(true);

      // Use digestsAPI for authenticated admin access
      const response = await digestsAPI.getDigest(parseInt(digestId));
      const digestData = response.data.digest;
      setDigest(digestData);
      
      setFormData({
        title: digestData.title,
        content: digestData.content,
        summary: digestData.summary || '',
        week_start: digestData.week_start,
        week_end: digestData.week_end,
        is_public: digestData.is_public,
        is_published: digestData.is_published,
      });
    } catch (error: unknown) {
      console.error('Error loading digest:', error);
      const errorResponse = error as { response?: { status: number; data?: { error: string } } };
      
      if (errorResponse.response?.status === 401) {
        router.push('/login');
        return;
      } else if (errorResponse.response?.status === 403) {
        setError('You do not have permission to edit this digest');
      } else if (errorResponse.response?.status === 404) {
        setError('Digest not found');
      } else {
        setError(errorResponse.response?.data?.error || 'Failed to load digest');
      }
    } finally {
      setIsLoadingDigest(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      if (!formData.content.trim()) {
        setError('Content is required');
        return;
      }

      // Prepare the digest data
      const digestData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim(),
        week_start: formData.week_start,
        week_end: formData.week_end,
        is_public: formData.is_public,
        is_published: formData.is_published
      };

      // Use digestsAPI for authenticated admin update
      await digestsAPI.updateDigest(parseInt(digestId), digestData);
      router.push('/admin/digests');
    } catch (error: unknown) {
      console.error('Error updating digest:', error);
      const errorResponse = error as { response?: { status: number; data?: { error: string } } };
      
      if (errorResponse.response?.status === 401) {
        router.push('/login');
        return;
      } else {
        setError(errorResponse.response?.data?.error || 'Failed to update digest');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoadingDigest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !digest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-center">
              <h2 className="text-lg font-medium mb-2">Error Loading Digest</h2>
              <p>{error}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Digest</h1>
          <p className="text-gray-600 mt-1">
            Edit your weekly digest with markdown support
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter digest title"
              required
            />
          </div>

          {/* Week Period */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Week Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="week_start" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="week_start"
                  name="week_start"
                  value={formData.week_start}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="week_end" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="week_end"
                  name="week_end"
                  value={formData.week_end}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content * (Markdown Supported)
            </label>
            <MarkdownEditor
              value={formData.content}
              onChange={(val) => setFormData(prev => ({ ...prev, content: val || '' }))}
              placeholder="Write the main content of your digest... (Supports Markdown formatting)"
              height={500}
            />
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              Summary (Optional)
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={4}
              value={formData.summary}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a brief summary of your digest..."
            />
          </div>

          {/* Visibility & Publishing */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visibility & Publishing</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                  Make this digest public (visible to everyone when published)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                  Publish this digest now
                </label>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Draft mode:</strong> Keep unchecked to save as a draft for later editing.<br/>
                <strong>Published:</strong> Check to make the digest live and visible to others (if public).
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/digests"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isLoading ? 'Updating...' : 'Update Digest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
