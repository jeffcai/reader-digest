'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-markdown-preview/markdown.css';

// Dynamically import the markdown preview component
const MarkdownPreview = dynamic(
  () => import('@uiw/react-markdown-preview').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
  hideToolbar?: boolean;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter your content in Markdown format...',
  height = 400,
  className = '',
}) => {
  return (
    <div className={`markdown-editor-wrapper ${className}`}>
      {/* Enhanced Header Labels */}
      <div className="grid grid-cols-2 gap-0 mb-0">
        <div className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-2 border-blue-200 border-r-0 rounded-tl-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📝</span>
            <span>Original Content (Markdown)</span>
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-2 border-green-200 border-l-0 rounded-tr-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-600">👁️</span>
            <span>Parsed Content (Preview)</span>
          </div>
        </div>
      </div>
      
      {/* Custom Two-Panel Layout */}
      <div className="flex border-2 border-gray-200 rounded-b-lg overflow-hidden" style={{ height: height }}>
        {/* Left Panel - Raw Markdown Editor */}
        <div className="w-1/2 border-r-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white relative">
          <div className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full z-10">
            ✏️ Raw Markdown
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-4 resize-none outline-none bg-transparent font-mono text-sm leading-relaxed"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          />
        </div>
        
        {/* Right Panel - Rendered Preview */}
        <div className="w-1/2 bg-gradient-to-br from-green-50 to-white relative overflow-y-auto">
          <div className="absolute top-2 right-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full z-10">
            🔍 Live Preview
          </div>
          <div className="p-4 h-full">
            <MarkdownPreview 
              source={value || '*Start typing markdown on the left to see the preview here...*'} 
              data-color-mode="light"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .markdown-editor-wrapper .wmde-markdown {
          background: transparent !important;
          color: #1f2937 !important;
        }
        
        .markdown-editor-wrapper .wmde-markdown h1,
        .markdown-editor-wrapper .wmde-markdown h2,
        .markdown-editor-wrapper .wmde-markdown h3,
        .markdown-editor-wrapper .wmde-markdown h4,
        .markdown-editor-wrapper .wmde-markdown h5,
        .markdown-editor-wrapper .wmde-markdown h6 {
          color: #1f2937 !important;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .markdown-editor-wrapper .wmde-markdown p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .markdown-editor-wrapper .wmde-markdown code {
          background-color: #f3f4f6;
          color: #dc2626;
          padding: 0.125rem 0.375rem;
          border-radius: 0.375rem;
          font-weight: 600;
        }
        
        .markdown-editor-wrapper .wmde-markdown pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1.25rem;
          border-radius: 0.75rem;
          border: 2px solid #374151;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          margin: 1rem 0;
        }
        
        .markdown-editor-wrapper .wmde-markdown blockquote {
          border-left: 4px solid #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 0.75rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.1);
        }
        
        .markdown-editor-wrapper .wmde-markdown ul,
        .markdown-editor-wrapper .wmde-markdown ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .markdown-editor-wrapper .wmde-markdown li {
          margin-bottom: 0.25rem;
        }
        
        .markdown-editor-wrapper .wmde-markdown a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .markdown-editor-wrapper .wmde-markdown a:hover {
          color: #1d4ed8;
        }
        
        .markdown-editor-wrapper .wmde-markdown strong {
          font-weight: 700;
        }
        
        .markdown-editor-wrapper .wmde-markdown em {
          font-style: italic;
        }
        
        .markdown-editor-wrapper .wmde-markdown hr {
          border: none;
          height: 2px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
