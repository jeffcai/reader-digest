'use client';

import { useState } from 'react';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function MarkdownDemoPage() {
  const [content, setContent] = useState(`# Welcome to Markdown Editor Demo

This is a **markdown editor** that shows:
- *Original content* on the **left side**
- *Parsed content* on the **right side**

## Features

### Code Blocks
\`\`\`javascript
function demo() {
  console.log("You can see both raw markdown and rendered output!");
}
\`\`\`

### Lists
1. First item
2. Second item
3. Third item

### Blockquotes
> This is a blockquote that demonstrates how markdown is parsed and rendered in real-time.

### Links and Emphasis
Check out [this link](https://example.com) and see how **bold**, *italic*, and \`inline code\` are rendered.

---

**Try editing this content!** You should see:
- Raw markdown text on the left
- Beautiful rendered output on the right
`);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Markdown Editor Demo
          </h1>
          <p className="text-gray-600">
            This demo shows the enhanced markdown editor with <strong>original content on the left</strong> and <strong>parsed content on the right</strong>.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Edit the content below to see live preview:
          </h2>
          
          <MarkdownEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height={600}
            placeholder="Type your markdown content here..."
          />
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href="http://localhost:3000" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}
