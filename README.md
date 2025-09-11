# PDF RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot that answers questions based on PDF documents using Google Gemini Pro 2.0 and Supabase Vector Search.

## Features

- PDF document processing and text extraction
- Vector embeddings using Gemini text-embedding-004
- Semantic search with Supabase pgvector
- Chat interface built with shadcn/ui
- Real-time question answering with source citations
- Document indexing management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI Model**: Google Gemini Pro 2.0
- **Database**: Supabase (PostgreSQL + pgvector)
- **UI**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Google AI Studio API key

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd pdf-rag-chatbot
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 4. Setup Supabase Database

1. Create a new Supabase project
2. Go to SQL Editor and run the schema from `database/schema.sql`
3. Enable pgvector extension if not already enabled

### 5. Add PDF Documents

Place your PDF files in the `pdfs` folder at the root of the project.

### 6. Index Documents

Run the indexing script:

```bash
npm run index-pdfs
```

Or use the web interface:
1. Start the development server: `npm run dev`
2. Go to the "Upload & Index" tab
3. Click "Index PDF Documents"

### 7. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the chatbot.

## Usage

1. **Add PDFs**: Place PDF files in the `pdfs` folder
2. **Index**: Run indexing to process and store documents
3. **Chat**: Ask questions about your documents in the chat interface
4. **View Sources**: Each answer includes source citations

## Project Structure

```
pdf-rag-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/         # Chat endpoint
│   │   └── index/        # Indexing endpoint
│   └── page.tsx          # Main page
├── components/
│   ├── chat-interface.tsx
│   └── pdf-uploader.tsx
├── lib/
│   ├── gemini.ts         # Gemini API integration
│   ├── supabase.ts       # Database client
│   ├── pdf-processor.ts  # PDF processing
│   ├── embeddings.ts     # Vector operations
│   └── rag.ts           # RAG chain
├── scripts/
│   └── index-pdfs.ts    # CLI indexing script
├── database/
│   └── schema.sql       # Database schema
└── pdfs/                # PDF storage folder
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run index-pdfs` - Index PDF documents
- `npm run lint` - Run linter

## License

MIT
