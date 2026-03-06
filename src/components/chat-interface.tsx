"use client";

import { useState } from "react";
import { Send, Square } from "lucide-react";
import {
  validateChatInput,
  checkRateLimit,
  sanitizeInput,
} from "@/lib/input-validator";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatHeader } from "@/components/chat/chat-header";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { MessageBubble } from "@/components/chat/message-bubble";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Help me create a newsletter for a zoo that has a new animal",
  "Write a travel blog post about visiting the ancient ruins of Machu Picchu",
  "Explain how neural networks work using simple analogies and real-world examples",
  "Create a 7-day meal plan for a busy professional who wants to eat healthier",
];

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Custom hooks
  const { messages, setMessages, clearMessages } = useChatMessages();
  const { isLoading, sendMessage, stopStream } = useChatStream();
  const {
    isAutoScrollEnabled,
    setIsAutoScrollEnabled,
    messagesEndRef,
    scrollContainerRef,
    scrollToBottom,
    handleScroll,
  } = useAutoScroll(messages);

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    // Optionally auto-submit by creating a synthetic submit
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Clear any previous errors
    setError(null);

    // Sanitize input
    const sanitizedInput = sanitizeInput(input);

    // Validate input
    const inputValidation = validateChatInput(sanitizedInput);
    if (!inputValidation.isValid) {
      setError(inputValidation.error || "Invalid input");
      return;
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.isValid) {
      setError(rateLimitCheck.error || "Rate limit exceeded");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: sanitizedInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsAutoScrollEnabled(true);

    // Add placeholder for assistant message
    const assistantMsgIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await sendMessage(messages, userMessage, setMessages, assistantMsgIndex);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <ChatHeader messageCount={messages.length} onClearChat={clearMessages} />

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg bg-muted/10"
      >
        {messages.length === 0 && (
          <SuggestedPrompts
            prompts={SUGGESTED_PROMPTS}
            onSelectPrompt={handleSuggestedPrompt}
            disabled={isLoading}
          />
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} isLoading={isLoading} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAutoScrollEnabled && (
        <div className="mb-2 text-center">
          <button
            onClick={() => {
              setIsAutoScrollEnabled(true);
              scrollToBottom();
            }}
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border"
          >
            ↓ New messages below
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Clear error when user starts typing
            if (error) setError(null);
          }}
          placeholder="Type your message..."
          disabled={isLoading}
          maxLength={4000}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 bg-background"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stopStream}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors flex items-center gap-2 font-medium"
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2 font-medium"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        )}
      </form>
    </div>
  );
}
