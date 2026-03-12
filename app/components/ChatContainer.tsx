'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ChoiceSelector from './ChoiceSelector';
import ProposalCard from './ProposalCard';
import PhaseIndicator from './PhaseIndicator';
import type { Phase, GeminiResponse } from '@/lib/types';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  structured_data?: GeminiResponse | null;
}

export default function ChatContainer({
  initialConversationId,
}: {
  initialConversationId?: string;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('project_input');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show welcome message for new conversations (no API call)
  useEffect(() => {
    if (!initialConversationId && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'プロジェクト計画を始めましょう！\nどんなことを達成したいですか？目標やアイデアを教えてください。',
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string, selectedChoiceIds?: string[]) => {
    if (!text.trim() && !selectedChoiceIds?.length) return;

    const userMessage: DisplayMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: text,
          selectedChoiceIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API error');
      }

      const data = await res.json();
      setConversationId(data.conversationId);
      setPhase(data.phase);

      const assistantMessage: DisplayMessage = {
        role: 'assistant',
        content: data.message,
        structured_data: data.structured_data,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (data.phase === 'completed') {
        setTimeout(() => {
          router.push(`/projects/${data.projectId}`);
        }, 2000);
      }
    } catch (error) {
      const errMessage: DisplayMessage = {
        role: 'assistant',
        content: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const lastMessage = messages[messages.length - 1];
  const lastStructured = lastMessage?.structured_data;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <PhaseIndicator currentPhase={phase} />

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatMessage role={msg.role} content={msg.content} />
              {msg.role === 'assistant' && msg.structured_data?.proposals && (
                <ProposalCard proposals={msg.structured_data.proposals} />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm text-muted-foreground animate-pulse">
                考え中...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Choice selector */}
      {lastStructured?.choices && !loading && (
        <div className="border-t p-3 max-w-2xl mx-auto w-full">
          <ChoiceSelector
            choices={lastStructured.choices}
            onSelect={(ids) => sendMessage(`選択: ${ids.join(', ')}`, ids)}
            disabled={loading}
          />
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            送信
          </Button>
        </form>
      </div>
    </div>
  );
}
