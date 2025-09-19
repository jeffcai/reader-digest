# Prompt history


Log all prompts for memo and more refinement in future.

## Prompts and git logs

- git log: v1 init prod repo
- prompt: 

```
You are an AI agent specializing in full-stack web development. Your task is to assist in building a reader digest website with a clear separation between the backend (API and database) and the frontend (user interface). You will work alongside a human developer, providing code, architectural suggestions, and debugging assistance.

**Product Overview:**
- **Name:** Reader Digest
- **Core Functionality:** User can post what they read in admin page and take some notes too, which will be shown on the public page supporting magazine, card, list etc. view, and meanwhile can automatically summarise what user read in the past one week (advanced feature, can be provided latter), can be published weekly after user polish and agree in admin page.
- **Target Audience:** Who read daily in internet and want keep track of what they read and their thoughts, weekly summarise what they read with their own thoughts 

**Backend Requirements:**
- **Technology Stack:** Python with Flask for backend
- **Database:** SQLite
- **Key API Endpoints:**: /api/v1/users (POST/GET/UPDATE/DELETE for user registration, and update, disable), /api/v1/articles (POST/GET) for storing articles with notes input, /api/v1/digests (POST/GET/UPDATE/DELETE for weekly summary CRUD)
- **Authentication/Authorization:** support social login or self registration, user by default only can operate their own urls in admin page, but all users articles and summary will be available in the public page
- **Scalability Considerations:** consider it latter, implement functionality first

**Frontend Requirements:**
- **Technology Stack:** Next.js + tailwind for frontend
- **User Interface (UI) / User Experience (UX):** easy to use, articles can viewed per day, or per user with magazine, card or list view
- **Key Pages/Components:** admin page for managing articles post, and public page for view all articles and summary
- **State Management:** no idea about it
- **Responsiveness:** yes

**AI Agent's Role and Interaction:**
- **Code Generation:** Generate code snippets for specific functionalities (e.g., API routes, database models, frontend components, utility functions).
- **Architectural Guidance:** Suggest best practices for structuring the codebase, designing APIs, and managing state.
- **Debugging Assistance:** Help identify and resolve errors in both backend and frontend code.
- **Technology-Specific Advice:** Provide guidance on using the chosen technologies effectively.
- **Collaboration:** Be prepared to iterate on code and suggestions based on feedback.
```

- git log: v2 fix frontend issue
- prompts 
    - error occurs when accessing the localhost:3000, fix it
    - "Attempted to call useAuth() from the server but useAuth is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component."
    - still not working, fix issue "Cannot find module 'autoprefixer'"
    - fix issue "The current Flask app is not registered with this 'SQLAlchemy' instance. Did you forget to call 'init_app', or did you create multiple 'SQLAlchemy' instances?"

- git log: v3 support user registration, login and logout
- prompts 
    - continue working on it, to support user registration by providing user details include valid and complex password, password should be stored in encyrpted format but can not decrypted for security, meanwhile user can login and logout ✅
    - enhance function to redirect user to admin page for managing articles, and meanwhile show login user somewhere, by default token expire is 1 day ✅

- git log: v4 for imlementing article creation and publishing
- prompts:
    - error occurs "POST /api/v1/articles HTTP/1.1" 422 -" when creating article, fix it
    - still got error "POST /api/v1/articles HTTP/1.1" 422 - 422 UNPROCESSABLE ENTITY" when creating article, check and fix it
    - when accessing the public article page, error occurs "tagsString.split is not a function
src/lib/utils.ts (96:23) @ extractTags", fix it

- git log: implement user can see preview of any article with URL
- prompts: 
  - continue working on it, to implement user can see preview of any article with URL when accessing articles, no need to store preview content, instead of crawling the ULR to show preview content or some way else, but do not store ULR preview content, do not test frontend I will test it myself manually and focus on backend unit test
  - continue working on it, to implement user can view preview of article with URL in the public article page by integrating with backend

- git log: implement user can see preview of any article with URL
- prompts:
  - continue working on it, to implement generate weekly summary by aggregating all user created artiles for user review and change its content, and then can select to publish or not, the summary format would be markdown formatted with template like 
  ```
  ## <placeholder - title for the week>

  ## All arcitles in past week

  ### <placeholder - article 1>

  [xxx title](xxx url)

  <summary with AI service - latter will be implemented>

  <note taking for the article>

  ### <placeholder - article 2>
  ```
  - continue working on frontend, user can click a button to generate weekly summary, and then review/change content, finally can select to publish or not. 
  - after testing, there is an issue, when click read full digest for weekly sumamry, no respnse, seems not implemented yet, implement and UI test leave it to me

- git log: deployment in Ali Cloud ECS
- prompts:
  - need deploy this application in one ECS in Ali Cloud (equivalent to EC2 in AWS), create deployment instruction and script for how-to

- git log: fix bug for searching public articles with filter condition
- prompts:
  - continue working on reader digest, to fix bug when user input in the search box on the public articles page, filter not working well it stoping user input another letter until filter done which is bad user experience, better to have user input all letters then do filter automatically or maybe just add search button

- git log: fix bug for publishing digest
- prompts:
  - continue working on reader digest, to fix bug when click 'Publish Now' on the digest generation page error as shown below occurs ✅
```
Each child in a list should have a unique "key" prop.
Check the render method of `DigestsPage`. See https://react.dev/link/warning-keys for more information.
```
  - still got errors in page after click publish now, continue fixing it ✅
```
Each child in a list should have a unique "key" prop.
Check the render method of `DigestsPage`. See https://react.dev/link/warning-keys for more information.
src/app/digests/page.tsx (133:19) @ eval
  131 |               <div className="grid gap-6">
  132 |                 {digests.map((digest) => (
> 133 |                   <div
      |                   ^
  134 |                     key={digest.id}
  135 |                     className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
  136 |                   >
```
  - still got same issue, if digest.id is duplicate somewhere or caused by backend service

- git log: enhance admin function to only view user own articles instead of view all
- prompts:
  - continue working on reader digest, to enhance admin function to only view user own articles instead of view all, currently can view all articles but unable to delete (403 error if trying to delete, this implementation is correct) ✅
  - not working as a tester I still can view demo_user's articles when accessing my admin dashboard.

- git log: enhance admin function to enable user view/edit/delete user own articles in admin dashboard
- prompts:
  - continue working on reader digest, to enhance admin function to enable user view/edit/delete user own articles in admin dashboard
  - fix the bug, when trying to update article at frontend, error occurs: '"PUT /api/v1/articles/2 HTTP/1.1" 403' 
  - can not view article, update frontend to implement it ✅
  - enhance view article function in admin dashboard, should enable user to back to admin dashboard instead of the page of all public articles ✅

- git log: enhance admin function to add a markdown editor for editing article content and show it by parsing markdown content
- prompts:
  - continue working on reader digest, to enhance admin function to enable user use a markdown editor for editing article content, and also show content of article by parsing markdown content on public articles screen
  - continue enhancing the function, can see original content at left-side when editing article content with markdown editor, now only show the parsing content at the right-side
  - still can not view original content and parsed content in the editor, fix it
  - content not showing there for both sides

- git log: enhance admin function to enable user can add/view/edit/delete weekly digest, and use markdown for editing and view content
- prompts:
  - continue working on reader digest, to enhance admin function to enable user can add/view/edit/delete weekly digest, to edit digest similar with article editing it provides markdown editor, and meanwhile show digest summary with parsed markdown content on public digest screen or view page in admin console
  - fix bug, when view digest, it redirect to login page but logged in already
  - for public digest, to view them it's no need to login but for admin functions it's required, implementation should be same as the one for article
  - do not like the naming for publicAPI for digest, make it more specific, using consistent naming convention
  - publicApi can be used for article API too

- git log: fix digest content view issue, and enhance UX design
- prompts:
  - fix current implementation, viewing public digest it should not show a markdown editor instead show parsed markdown content for view, and meanwhile it should be same as viewing public digest for user experience like navigating to the view page 

- git log: fix params.id issue when viewing public digest
- prompts
  - fix below issue when viewing public digest
  ```
A param property was accessed directly with `params.id`. `params` is now a Promise and should be unwrapped with `React.use()` before accessing properties of the underlying params object. In this version of Next.js direct access to param properties is still supported to facilitate migration but in a future version you will be required to unwrap `params` with `React.use()`.

src/app/digests/[id]/page.tsx (32:27) @ DigestPage


  30 |   const [error, setError] = useState<string | null>(null);
  31 |   const [copySuccess, setCopySuccess] = useState(false);
> 32 |   const digestId = params.id as string;
     |                           ^
  33 |   const referrer = searchParams.get('ref');
  34 |
  35 |   // Helper functions for navigation based on referrer
  ```

- git log: enhance admin UI consistency for articles and digests action columns
- prompts:
  - two list of articles and digests in administration page, the last column for action with different style and design icon, enhance them to make them consistent, comparing 2 ones, the one for articles looks better, more simple and nice.

- git log: fix issue of adding article (may just first time)
- prompts:
  - fix the issue
```
Module not found: Can't resolve '@uiw/react-markdown-preview/markdown.css'

./src/components/MarkdownEditor.tsx (5:1)

Module not found: Can't resolve '@uiw/react-markdown-preview/markdown.css'
  3 | import React from 'react';
  4 | import dynamic from 'next/dynamic';
> 5 | import '@uiw/react-markdown-preview/markdown.css';
    | ^
  6 |
  7 | // Dynamically import the markdown preview component
  8 | const MarkdownPreview = dynamic(

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./src/app/admin/articles/new/page.tsx
```  

- git log: support pagination for both public articles and digests
- prompts:
  - continue working on reader digest, to enhance public article and digests features, support pagination for both public articles and digests
  - it's possible to do a bit refactoring? we have the public/digests/page.tsx but have no articles/page.tsx (instead which is under the root of app folder), this is not consistent per structure and hard to understand it

- git log: support using rss to subscribe public articles
- prompts:
  - continue working on reader digest, to support using rss to subscribe public articles


## future functions

- user can view AI summary information which by default with local ollama OpenAI API compatible services, but user can bring their their own OpenAPI compatible service by providing API token, URL and model information
- super admin (user with admin role) can manage all contents including articles and digests
- user can have chrome extension to add articles with notes input
- UX design and user experience not very consistent across different modules


nice to have - if worthing doing?
- can add good food/restaurant collections per others' recommendation as life is important part along with reading/digests - thoughts
- can add good book review
- user can bring their own OpenAI compatible API token and URL for AI summary for digest

prompts: continue working on it, to implement ...
- user registration with social login like google, consider using logto (https://logto.io/)


## AI Agent useful scripts

- lsof -ti:5001 | xargs kill -9 (kill any existing process on port 5001)
- curl -s -X POST http://localhost:5001/api/v1/auth/login -H "Content-Type: application/json" -d '{"login": "admin", "password": "Admin123!"}'
- sqlite3 reader_digest.db "SELECT * FROM users;"
- curl -s -X POST http://localhost:5001/api/v1/auth/register -H "Content-Type: application/json" -d '{"username": "admin", "email": "admin@test.com", "password": "Admin123!", "first_name": "Admin", "last_name": "User"}'
- /reader-digest/backend/venv/bin/python app.py
- curl -s http://localhost:5001/health
- /reader-digest/frontend && npm run dev
- crete article:
```
curl -s -X POST http://localhost:5001/api/v1/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1NTczNDUzMiwianRpIjoiNmU0MWRjMTUtNTQyYy00ZGVjLTgyZDgtNmQ1YjAwZDhkZTA1IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjMiLCJuYmYiOjE3NTU3MzQ1MzIsImNzcmYiOiJlZjA4OTFhNC01YmMzLTQ5MDMtYWExNy0zYjM3YjczNzhiNGMiLCJleHAiOjE3NTU4MjA5MzJ9.fTbrz1PbzywikopDuumR1c3mShIm8hJ74B32dI7nKKY" \
  -d '{
    "title": "Article Preview Feature Demo",
    "content": "This article demonstrates the new preview functionality where users can view detailed article information either in a modal overlay or on a dedicated page. Features include:\n\n• Modal and page view modes\n• Share functionality with social media integration\n• Copy-to-clipboard URL sharing\n• Responsive design for all devices\n• Full content display with notes and tags\n• Author information and reading date\n• Direct links to original articles\n\nUsers can switch between modal and page preview modes using the toggle in the main interface. The page mode creates shareable URLs that can be bookmarked and shared with others.",
    "url": "https://github.com/reader-digest/article-preview-demo",
    "notes": "This is a demo article created to showcase the article preview functionality. The feature allows seamless article viewing and sharing.",
    "tags": ["demo", "preview", "feature", "ui/ux"],
    "is_public": true
  }'
```
- 
```
ls -la venv/bin/python*
The issue is that your virtual environment is linked to a Homebrew Python installation which has the "externally-managed-environment" restriction. Let me try a different approach by activating the virtual environment properly and using the virtual environment's pip directly:
source venv/bin/activate && which python && which pip
source venv/bin/activate && pip install beautifulsoup4 lxml
ls -la
rm -rf venv && python3 -m venv venv
source venv/bin/activate && which python && pip install beautifulsoup4 lxml
source venv/bin/activate && pip install -r requirements.txt
source venv/bin/activate && pip install Flask Flask-SQLAlchemy Flask-CORS Flask-JWT-Extended Flask-Login Flask-WTF python-dotenv requests bcrypt Werkzeug authlib python-jose[cryptography]
source venv/bin/activate && pip install Flask Flask-SQLAlchemy Flask-CORS Flask-JWT-Extended Flask-Login Flask-WTF python-dotenv requests bcrypt Werkzeug authlib
source venv/bin/activate && python -m pytest test_url_preview_simple.py -v
source venv/bin/activate && pip install pytest
source venv/bin/activate && python -m pytest test_url_preview_simple.py -v
source venv/bin/activate && python -m pytest test_url_preview.py -v
source venv/bin/activate && python test_api_manual.py
source venv/bin/activate && python app.py
```