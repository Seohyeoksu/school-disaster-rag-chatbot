-- ============================================
-- 완전한 PDF RAG 챗봇 데이터베이스 스키마
-- ============================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS match_documents(vector, int, jsonb);

-- 3. 기존 인덱스가 있다면 삭제 후 재생성
DROP INDEX IF EXISTS documents_embedding_idx;

-- 4. 문서 테이블 생성 (존재하지 않는 경우만)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004는 768차원 벡터 생성
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 벡터 유사도 검색을 위한 인덱스 생성
CREATE INDEX documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 6. 벡터 유사도 검색 함수 생성 (수정된 버전)
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
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

-- 7. 함수 사용 예시 (주석)
-- SELECT * FROM match_documents(
--   '[0.1, 0.2, 0.3, ...]'::vector(768),
--   5,
--   '{}'::jsonb
-- );

-- 8. 권한 설정 (필요한 경우)
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT ALL ON TABLE documents TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION match_documents TO anon, authenticated;