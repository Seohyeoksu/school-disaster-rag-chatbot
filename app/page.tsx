import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-100 via-orange-50 to-yellow-50">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-red-600 rounded-full">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-red-800">학교 재난 대응 시스템</h1>
          <p className="text-red-600 text-lg">
            🏫 학교현장 재난유형별 교육훈련 매뉴얼 기반 AI 도우미
          </p>
          <p className="text-sm text-red-500 mt-2">
            경상북도교육청 교육안전과 제작
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
