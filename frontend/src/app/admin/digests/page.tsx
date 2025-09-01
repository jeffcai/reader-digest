'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from 'lucide-react';
import { digestsAPI } from '@/lib/api';
import { Digest, DigestsResponse } from '@/lib/types';

export default function AdminDigestsPage() {
  const router = useRouter();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    loadDigests();
  }, [currentPage, statusFilter]);

  const loadDigests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await digestsAPI.getDigests({ 
        page: currentPage,
        per_page: 20,
        view: 'own'  // Only show user's own digests in admin view
      });
      const digestsData = response.data as DigestsResponse;
      setDigests(digestsData.digests);
      setTotalPages(digestsData.pagination.pages);
    } catch (error: any) {
      console.error('Failed to load digests:', error);
      setError('Failed to load digests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDigest = async (digestId: number, digestTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${digestTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await digestsAPI.deleteDigest(digestId);
      // Reload digests after successful deletion
      await loadDigests();
    } catch (error: any) {
      console.error('Failed to delete digest:', error);
      alert('Failed to delete digest. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  // Filter digests based on search and status
  const filteredDigests = digests.filter(digest => {
    const matchesSearch = digest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         digest.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         digest.author?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && digest.is_published) ||
                         (statusFilter === 'draft' && !digest.is_published);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (digest: Digest) => {
    const badges = [];
    
    if (digest.is_published) {
      badges.push(
        <span key="published" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Published
        </span>
      );
    } else {
      badges.push(
        <span key="draft" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Draft
        </span>
      );
    }
    
    if (digest.is_public) {
      badges.push(
        <span key="public" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Public
        </span>
      );
    } else {
      badges.push(
        <span key="private" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Private
        </span>
      );
    }
    
    return badges;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Weekly Digests</h1>
              <p className="text-gray-600 mt-1">
                Manage your weekly digest publications
              </p>
            </div>
            <Link
              href="/admin/digests/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Digest
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search digests, authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
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
              <span className="ml-3 text-gray-600">Loading digests...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredDigests.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title & Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDigests.map((digest) => (
                        <tr key={digest.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {digest.title}
                              </div>
                              {digest.author && (
                                <div className="text-sm text-gray-500">
                                  by {digest.author}
                                </div>
                              )}
                              {digest.summary && (
                                <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                  {digest.summary}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDateRange(digest.week_start, digest.week_end)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              {getStatusBadge(digest)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>Created: {formatDate(digest.created_at)}</div>
                            {digest.published_at && (
                              <div>Published: {formatDate(digest.published_at)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/admin/digests/${digest.id}`}
                                className="text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </Link>
                              <Link
                                href={`/admin/digests/${digest.id}/edit`}
                                className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center"
                              >
                                <EditIcon className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                              <button 
                                onClick={() => handleDeleteDigest(digest.id, digest.title)}
                                className="text-red-600 hover:text-red-900 transition-colors inline-flex items-center"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing page {currentPage} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  📖
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No digests found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'No digests have been created yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
