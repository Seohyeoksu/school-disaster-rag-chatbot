'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Shield, Bot, User, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    content: string;
    metadata: Record<string, any>;
    similarity: number;
  }>;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "산불 발생시 학교 대피 방법은?",
  "산불 확산 시 학생 안전 조치는?",
  "산불 경보시 학교 대응 절차는?",
  "지진이 발생하면 어떻게 행동해야 하나요?",
  "폭우나 홍수 발생시 대응 방법은?"
];

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `안녕하세요! 저는 **학교 재난 대응 전문 도우미**입니다. 🚨

학교현장에서 발생할 수 있는 다양한 재난 상황에 대한 교육훈련 매뉴얼을 바탕으로 정확한 정보를 제공해드립니다.

**📋 도움을 드릴 수 있는 분야:**
- 🔥 화재 대응 및 대피
- 🌪️ 자연재해 (지진, 태풍, 폭설 등)
- 🌲 산불 대응
- 🏥 응급처치 및 의료 대응
- 🌊 폭우 및 홍수 대응
- 📞 비상 연락 체계

궁금한 재난 대응 방법이 있으시면 언제든 질문해주세요!`,
  timestamp: new Date('2024-01-01T00:00:00'),
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${messageIdCounter}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessageIdCounter(prev => prev + 1);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${messageIdCounter}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };
      
      setMessageIdCounter(prev => prev + 1);

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `error-${messageIdCounter}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question.',
        timestamp: new Date(),
      };
      
      setMessageIdCounter(prev => prev + 1);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const toggleSourceExpansion = (messageId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="p-4 border-b border-red-200 bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          학교 재난 대응 도우미
        </h2>
        <div className="mt-2 text-xs text-red-200 flex items-center gap-2">
          📚 현재 활용 중인 매뉴얼: 학교현장 재난유형별 교육훈련 매뉴얼
          <span className="text-red-300">|</span>
          <a 
            href="https://www.schoolsafe24.or.kr/front/rpstr/selectRpstrInfo.do?menuSn=185&upperMenuSn=148&rpstrPstSn=4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-200 hover:text-white underline transition-colors"
          >
            📥 매뉴얼 다운로드
          </a>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 max-w-full">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className={
                  message.role === 'user' ? 'bg-blue-100' : 'bg-red-100'
                }>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-red-600" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 space-y-2 ${
                message.role === 'user' ? 'flex flex-col items-end' : ''
              }`}>
                <div className={`flex items-center gap-2 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  <span className="font-semibold">
                    {message.role === 'user' ? '교직원' : '재난대응 도우미'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className={`prose prose-sm ${
                  message.role === 'assistant' 
                    ? 'bg-red-50 p-3 rounded-lg border border-red-100 max-w-full break-words' 
                    : 'bg-blue-50 p-3 rounded-lg border border-blue-100 text-right max-w-xs ml-auto break-words'
                }`}>
                  {message.content}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <div 
                      className="flex items-center justify-between cursor-pointer bg-red-50 hover:bg-red-100 p-3 rounded-lg border border-red-200 transition-colors"
                      onClick={() => toggleSourceExpansion(message.id)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          참고 매뉴얼 ({message.sources.length}개 섹션)
                        </span>
                      </div>
                      {expandedSources[message.id] ? (
                        <ChevronUp className="h-4 w-4 text-red-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    {expandedSources[message.id] && (
                      <div className="space-y-3 pl-4 border-l-2 border-red-200">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-red-300 text-red-700">
                                  📖 {source.metadata.page}페이지
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  유사도: {(source.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border font-mono break-words overflow-wrap-anywhere">
                              {source.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-red-100">
                  <Bot className="h-4 w-4 text-red-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                <span className="text-sm text-red-600">매뉴얼을 확인하고 있습니다...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
            <Phone className="h-4 w-4" />
            자주 묻는 질문:
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question)}
                className="text-xs border-red-200 text-red-700 hover:bg-red-50"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-red-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="재난 대응 방법에 대해 질문해주세요... (예: 화재시 대피방법)"
            disabled={isLoading}
            className="flex-1 border-red-200 focus:border-red-400 focus:ring-red-200 focus:ring-1 focus:ring-opacity-50"
            autoComplete="off"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-300 focus:ring-opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}