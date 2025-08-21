# Weekly Digest Feature

The weekly digest feature allows users to generate comprehensive markdown summaries of their reading activity for any time period.

## ✨ Features

### 🎯 **Generate Weekly Digest**
- **Smart Week Selection**: Choose from available weeks with article counts
- **Custom Date Range**: Specify any start and end date for the digest
- **Custom Titles**: Override the default title with personalized ones
- **Automatic Formatting**: Professional markdown template with consistent structure

### 📝 **Review & Edit**
- **Live Preview**: Toggle between edit and preview modes
- **Markdown Editor**: Full content editing with syntax highlighting
- **Publishing Options**: Save as draft or publish immediately
- **Visibility Control**: Choose between private and public visibility

### 🚀 **Publishing Workflow**
- **Draft Mode**: Save and continue editing later
- **Immediate Publishing**: Publish directly after review
- **Public/Private**: Control who can see your digests
- **Social Features**: Share and discover others' reading journeys

## 📋 **Template Structure**

Generated digests follow this markdown template:

```markdown
# Weekly Reading Digest: [Date Range]

## All articles in past week

### 1. [Article Title](URL)
**Read on:** Date
**Tags:** `tag1`, `tag2`, `tag3`
**Summary:** _AI summary placeholder for future integration_
**My Notes:** 
> Personal notes in quote format
> Multiple lines supported

### 2. [Next Article Title](URL)
...

---
*This digest covers X articles read between [start] and [end].*
```

## 🛠 **API Endpoints**

### Generate Weekly Digest
```bash
POST /api/v1/digests/generate-weekly
Content-Type: application/json

{
  "week_start": "2025-08-14",      // Optional, defaults to 7 days ago
  "week_end": "2025-08-21",        // Optional, defaults to today
  "custom_title": "My Week 3"      // Optional custom title
}
```

### Get Available Weeks
```bash
GET /api/v1/digests/available-weeks
```

Response:
```json
{
  "available_weeks": [
    {
      "week_start": "2025-08-14",
      "week_end": "2025-08-21", 
      "article_count": 5
    }
  ]
}
```

### Digest CRUD Operations
- `GET /api/v1/digests` - List digests (with pagination)
- `POST /api/v1/digests` - Create digest from generated content
- `GET /api/v1/digests/:id` - Get specific digest
- `PUT /api/v1/digests/:id` - Update digest
- `DELETE /api/v1/digests/:id` - Delete digest

## 🎨 **Frontend Components**

### WeeklyDigestGenerator
- **Location**: `/src/components/WeeklyDigestGenerator.tsx`
- **Purpose**: UI for generating weekly digests
- **Features**: Week selection, custom dates, title customization

### DigestReviewEditor
- **Location**: `/src/components/DigestReviewEditor.tsx` 
- **Purpose**: Review and edit generated digests
- **Features**: Markdown editing, preview mode, publishing controls

### Page Routes
- `/digests` - User's personal digest management
- `/admin/digests` - Admin view of all digests
- `/public/digests` - Public feed of published digests

## 🔄 **User Workflow**

1. **Navigate to Digests** → Click "My Digests" or visit `/digests`
2. **Generate Digest** → Click "Generate New Digest" button
3. **Select Period** → Choose from available weeks or set custom dates
4. **Customize** → Add optional custom title
5. **Generate** → Click "Generate Weekly Digest"
6. **Review** → View generated markdown content
7. **Edit** → Modify title, content, add summary
8. **Preview** → Toggle preview to see formatted output
9. **Publish** → Choose to save as draft or publish immediately
10. **Share** → Public digests appear in community feed

## 🔮 **Future Enhancements**

### AI Integration Ready
- **Summary Placeholders**: "_AI summary will be generated here in future updates._"
- **Hooks**: Service layer ready for AI summary integration
- **Template**: Structured format perfect for AI enhancement

### Planned Features
- **Export Options**: PDF, HTML, social media formats
- **Template Customization**: User-defined templates
- **Collaboration**: Share drafts for feedback
- **Analytics**: Reading insights and trends
- **Automation**: Scheduled digest generation

## 🛡️ **Security & Privacy**

- **Authentication Required**: Only logged-in users can create digests
- **User Isolation**: Users only see their own articles in generation
- **Privacy Controls**: Public/private visibility settings
- **Admin Oversight**: Admins can manage all digests
- **Data Protection**: Personal notes and content remain private by default

## 🧪 **Testing**

The feature includes comprehensive testing:
- **Template Validation**: Ensures correct markdown structure
- **Logic Testing**: Core functionality with mock data  
- **API Testing**: Backend service integration
- **Component Testing**: Frontend UI components

Run tests:
```bash
# Backend
python test_digest_logic.py
python demo_template.py

# Frontend  
npm test
```

## 📱 **Responsive Design**

- **Mobile First**: Optimized for all screen sizes
- **Progressive Enhancement**: Works on all browsers
- **Accessibility**: WCAG compliant interface
- **Performance**: Optimized loading and rendering

---

**Ready to use!** The weekly digest feature is fully implemented and production-ready. Users can now create beautiful, professional summaries of their reading journey with just a few clicks.
