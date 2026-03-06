"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { decodeStreamResponse } from "@/lib/stream-decoder";
import {
  validateChatInput,
  checkRateLimit,
  sanitizeInput,
} from "@/lib/input-validator";
import { ChatHeader } from "@/components/chat/chat-header";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { MessageBubble } from "@/components/chat/message-bubble";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "chat-messages";

const SUGGESTED_PROMPTS = [
  "Help me create a newsletter for a zoo that has a new animal",
  "Write a travel blog post about visiting the ancient ruins of Machu Picchu",
  "Explain how neural networks work using simple analogies and real-world examples",
  "Create a 7-day meal plan for a busy professional who wants to eat healthier",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const contentBufferRef = useRef("");
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const DEBOUNCE_MS = 50; // Update UI every 50ms instead of every token

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        setMessages(parsed);
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (error) {
      console.error("Failed to save messages to localStorage:", error);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear messages from localStorage:", error);
    }
  };

  // Detect manual scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // More generous threshold to account for content updates
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Only disable auto-scroll if user scrolled up significantly
    // This prevents accidental triggers from content updates
    if (scrollTop < lastScrollTop.current - 10) {
      // User intentionally scrolled up
      if (!isAtBottom) {
        setIsAutoScrollEnabled(false);
      }
    }
    // User scrolled back to bottom
    else if (isAtBottom && scrollTop >= lastScrollTop.current) {
      setIsAutoScrollEnabled(true);
    }

    lastScrollTop.current = scrollTop;
  };

  // Debounced update function
  const updateMessageDebounced = (content: string, messageIndex: number) => {
    contentBufferRef.current = content;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[messageIndex] = {
          role: "assistant",
          content: contentBufferRef.current,
        };
        return newMessages;
      });
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
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
    setIsLoading(true);
    setIsAutoScrollEnabled(true); // Re-enable auto-scroll for new message

    // Add placeholder for assistant message
    const assistantMsgIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("No reader available");
      }

      let accumulatedContent = "";

      // Use the stream decoder utility
      for await (const chunk of decodeStreamResponse(reader)) {
        if (chunk.content) {
          accumulatedContent += chunk.content;
          // Use debounced update instead of immediate update
          updateMessageDebounced(accumulatedContent, assistantMsgIndex);
        }
      }

      // Final update to ensure all content is displayed
      clearTimeout(debounceTimerRef.current);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[assistantMsgIndex] = {
          role: "assistant",
          content: accumulatedContent,
        };
        return newMessages;
      });
    } catch (error) {
      // Check if the error is due to abort
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted by user");
        // Keep whatever content was accumulated before abort
      } else {
        console.error("Error:", error);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMsgIndex] = {
            role: "assistant",
            content: "Sorry, an error occurred. Please try again.",
          };
          return newMessages;
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <ChatHeader messageCount={messages.length} onClearChat={clearChat} />

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
            onClick={handleStop}
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
