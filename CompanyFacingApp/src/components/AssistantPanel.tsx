import { FormEvent, useMemo, useState } from 'react';
import { AiContextPayload } from '../types';
import {
  askGemini,
  buildFallbackAssistantReply,
  getGeminiApiKey,
  isGeminiConfigured,
} from '../services/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantPanelProps {
  context: AiContextPayload;
}

export function AssistantPanel({ context }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('Which items and ingredients need attention over the next week?');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const apiKey = useMemo(() => getGeminiApiKey(), []);
  const configured = useMemo(() => isGeminiConfigured(apiKey), [apiKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
    };

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);
    setStatus(configured ? 'Sending the current dashboard state to Gemini…' : 'Gemini key placeholder detected; using the local fallback response.');

    try {
      const reply = configured
        ? await askGemini(context, question.trim())
        : buildFallbackAssistantReply(context, question.trim());

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
        },
      ]);

      setQuestion('');
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I could not generate a Gemini response right now. ${error instanceof Error ? error.message : 'Unknown error.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-panel__header">
        <div>
          <h3>AI Operations Assistant</h3>
          <p>
            {configured
              ? 'Live Gemini analysis is active for the current dashboard state.'
              : 'Gemini is wired in, but you still need to replace GEMINI_KEY with a real API key for live AI answers.'}
          </p>
        </div>
        <span className={`status-chip ${configured ? 'status-chip--success' : 'status-chip--warning'}`}>
          {configured ? 'Gemini ready' : 'Placeholder key'}
        </span>
      </div>

      <form className="assistant-panel__form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          placeholder="Ask about staffing, forecasts, margins, or inventory risks…"
        />
        <button type="submit" className="button" disabled={isLoading}>
          {isLoading ? 'Thinking…' : 'Ask assistant'}
        </button>
      </form>

      {status ? <p className="assistant-panel__status">{status}</p> : null}

      <div className="assistant-panel__messages">
        {messages.length === 0 ? (
          <div className="assistant-message assistant-message--assistant">
            Ask for a narrative on the forecast, staffing plan, stockout risk, margin gaps, or waste reduction priorities.
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`assistant-message ${message.role === 'assistant' ? 'assistant-message--assistant' : 'assistant-message--user'}`}
          >
            <strong>{message.role === 'assistant' ? 'Assistant' : 'You'}</strong>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
