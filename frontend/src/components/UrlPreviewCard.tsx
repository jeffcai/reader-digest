import React, { useState, useEffect } from 'react';
import { UrlPreview } from '@/lib/types';
import { articlesAPI } from '@/lib/api';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';

interface UrlPreviewCardProps {
  url: string;
  className?: string;
}

const UrlPreviewCard: React.FC<UrlPreviewCardProps> = ({ url, className = '' }) => {
  const [preview, setPreview] = useState<UrlPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchPreview = async () => {
    if (!url || loading || preview) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await articlesAPI.getPreview(url);
      if (response.data.preview) {
        setPreview(response.data.preview);
      } else {
        setError('Failed to load preview');
      }
    } catch (err: any) {
      console.error('Preview fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewToggle = () => {
    if (!showPreview) {
      setShowPreview(true);
      fetchPreview();
    } else {
      setShowPreview(false);
    }
  };

  const openUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  if (!url) return null;

  return (
    <div className={`url-preview ${className}`}>
      {!showPreview ? (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviewToggle}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
          >
            <Globe className="h-4 w-4" />
            <span>Show Preview</span>
          </button>
          <button
            onClick={openUrl}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Open URL"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          {loading && (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-500 mt-2">Loading preview...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs text-gray-500 hover:text-gray-700 mt-1"
              >
                Hide
              </button>
            </div>
          )}
          
          {preview && !loading && (
            <div className="group">
              <div className="flex">
                {preview.image && (
                  <div className="flex-shrink-0 w-24 h-20 bg-gray-200 overflow-hidden">
                    <img
                      src={preview.image}
                      alt={preview.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {preview.title || preview.domain}
                      </h4>
                      {preview.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {preview.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {preview.site_name || preview.domain}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={openUrl}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Open URL"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                        title="Hide preview"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UrlPreviewCard;