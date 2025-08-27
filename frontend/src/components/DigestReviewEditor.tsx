'use client';

import React, { useState } from 'react';
import { digestsAPI } from '@/lib/api';
import { WeeklyDigestGenerationResponse, Digest } from '@/lib/types';

interface DigestReviewEditorProps {
  digestData: WeeklyDigestGenerationResponse;
  onSave?: (digest: Digest) => void;
  onCancel?: () => void;
}

export default function DigestReviewEditor({ digestData, onSave, onCancel }: DigestReviewEditorProps) {
  const [title, setTitle] = useState(digestData.title);
  const [content, setContent] = useState(digestData.content);
  const [summary, setSummary] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = async (publishNow: boolean = false) => {
    if (!title.trim()) {
      setError('Please enter a title for the digest');
      return;
    }

    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const digestPayload = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        week_start: digestData.week_start,
        week_end: digestData.week_end,
        is_published: publishNow,
        is_public: isPublic
      };

      const response = await digestsAPI.createDigest(digestPayload);
      const savedDigest = response.data as Digest;
      
      onSave?.(savedDigest);
    } catch (error: any) {
      console.error('Failed to save digest:', error);
      setError(error.response?.data?.error || 'Failed to save digest');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const renderMarkdownPreview = (text: string) => {
    // Simple markdown rendering for preview - you might want to use a proper markdown library
    return text
      .split('\n')
      .map((line, index) => {
        const uniqueKey = `line-${index}-${line.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '')}-${line.length}`;
        
        if (line.startsWith('# ')) {
          return <h1 key={uniqueKey} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
        } else if (line.startsWith('## ')) {
          return <h2 key={uniqueKey} className="text-xl font-semibold mb-3 mt-6">{line.slice(3)}</h2>;
        } else if (line.startsWith('### ')) {
          return <h3 key={uniqueKey} className="text-lg font-medium mb-2 mt-4">{line.slice(4)}</h3>;
        } else if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={uniqueKey} className="font-semibold mb-1">{line.slice(2, -2)}</p>;
        } else if (line.startsWith('> ')) {
          return <blockquote key={uniqueKey} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">{line.slice(2)}</blockquote>;
        } else if (line.startsWith('_') && line.endsWith('_')) {
          return <p key={uniqueKey} className="italic text-gray-600 mb-2">{line.slice(1, -1)}</p>;
        } else if (line.startsWith('`') && line.endsWith('`')) {
          return <code key={uniqueKey} className="bg-gray-100 px-1 py-0.5 rounded text-sm">{line.slice(1, -1)}</code>;
        } else if (line.trim() === '---') {
          return <hr key={uniqueKey} className="my-6 border-gray-300" />;
        } else if (line.trim()) {
          return <p key={uniqueKey} className="mb-2">{line}</p>;
        } else {
          return <br key={uniqueKey} />;
        }
      });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review & Edit Weekly Digest</h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDateRange(digestData.week_start, digestData.week_end)} • {digestData.article_count} articles
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                previewMode
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {previewMode ? '📝 Edit' : '👁️ Preview'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="p-6">
        {!previewMode ? (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="digest-title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="digest-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter digest title"
              />
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="digest-summary" className="block text-sm font-medium text-gray-700 mb-2">
                Summary (optional)
              </label>
              <textarea
                id="digest-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief summary of this digest..."
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="digest-content" className="block text-sm font-medium text-gray-700 mb-2">
                Content (Markdown)
              </label>
              <textarea
                id="digest-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Your digest content in markdown format..."
              />
              <p className="text-xs text-gray-500 mt-1">
                You can edit the content using Markdown formatting. Use the Preview button to see how it will look.
              </p>
            </div>

            {/* Publishing Options */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center">
                <input
                  id="is-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is-public" className="text-sm font-medium text-gray-700">
                  Make this digest public (others can view it)
                </label>
              </div>
              
              <div className="text-sm text-gray-600">
                📌 <strong>Publishing Options:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                  <li><strong>Save as Draft:</strong> Keep private for further editing</li>
                  <li><strong>Publish Now:</strong> Make available immediately {isPublic ? '(publicly visible)' : '(private to you)'}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="markdown-preview">
                {renderMarkdownPreview(content)}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t mt-6">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '💾 Save as Draft'}
            </button>
            
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? 'Publishing...' : '🚀 Publish Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
