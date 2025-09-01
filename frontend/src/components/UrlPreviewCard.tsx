import React, { useState, useEffect } from 'react';
import { UrlPreview } from '@/lib/types';
import { publicArticlesAPI } from '@/lib/api';
import { ExternalLink, Globe, Loader2, AlertCircle } from 'lucide-react';
import { getDomainFromUrl } from '@/lib/utils';

interface UrlPreviewCardProps {
  url: string;
  className?: string;
  showImage?: boolean;
  compact?: boolean;
}

const UrlPreviewCard: React.FC<UrlPreviewCardProps> = ({ 
  url, 
  className = '', 
  showImage = true, 
  compact = false 
}) => {
  const [preview, setPreview] = useState<UrlPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      fetchUrlPreview();
    }
  }, [url]);

  const fetchUrlPreview = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await publicArticlesAPI.previewUrl(url);
      const previewData = response.data;
    } catch (err: any) {
      console.error('Failed to fetch URL preview:', err);
      setError(err.response?.data?.error || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const openUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const getDomain = () => getDomainFromUrl(url);

  if (loading) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error || !preview || !preview.success) {
    return (
      <div className={`border rounded-lg p-3 bg-gray-50 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium truncate">{getDomain()}</span>
          </div>
          <button
            onClick={openUrl}
            className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
            title="Open link"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <div className="flex items-center space-x-1 mt-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            <span>Preview unavailable</span>
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer ${className}`} onClick={openUrl}>
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
              {preview.title || getDomain()}
            </h4>
            {preview.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {preview.description}
              </p>
            )}
            <div className="flex items-center space-x-1 mt-1">
              <Globe className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{preview.site_name || getDomain()}</span>
            </div>
          </div>
          {showImage && preview.image && (
            <div className="flex-shrink-0">
              <img
                src={preview.image}
                alt=""
                className="w-12 h-12 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer ${className}`} onClick={openUrl}>
      {showImage && preview.image && (
        <div className="aspect-video bg-gray-100 relative">
          <img
            src={preview.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.style.display = 'none';
              }
            }}
          />
          <div className="absolute top-2 right-2">
            <div className="bg-black bg-opacity-50 rounded-full p-1">
              <ExternalLink className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between space-x-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
              {preview.title || getDomain()}
            </h3>
            
            {preview.description && (
              <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                {preview.description}
              </p>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Globe className="h-4 w-4" />
              <span>{preview.site_name || getDomain()}</span>
            </div>
          </div>
          
          {!showImage || !preview.image ? (
            <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UrlPreviewCard;
