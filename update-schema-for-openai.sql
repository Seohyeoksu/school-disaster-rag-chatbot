-- Update schema for OpenAI embeddings (1536 dimensions)

-- Drop existing function
DROP FUNCTION IF EXISTS match_documents(vector, int, jsonb);

-- Drop existing index
DROP INDEX IF EXISTS documents_embedding_idx;

-- Update embedding column to 1536 dimensions
ALTER TABLE documents 
DROP COLUMN IF EXISTS embedding;

ALTER TABLE documents 
ADD COLUMN embedding vector(1536);

-- Create new index for 1536-dimensional vectors
CREATE INDEX documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create updated function for 1536-dimensional vectors
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.metadata @> filter
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;