"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { decodeStreamResponse } from "@/lib/stream-decoder";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "chat-messages";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const contentBufferRef = useRef("");
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsAutoScrollEnabled(true); // Re-enable auto-scroll for new message

    // Add placeholder for assistant message
    const assistantMsgIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
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
      console.error("Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[assistantMsgIndex] = {
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LLM Streaming Chat</h1>
          <p className="text-muted-foreground">
            Real-time streaming chatbot powered by OpenAI
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:bg-muted/50 transition-colors"
            title="Clear chat history"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg bg-muted/10"
      >
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">Start a conversation!</p>
            <p className="text-sm mt-2">
              Type a message below to begin chatting.
            </p>
            <p className="text-xs mt-2 opacity-60">
              Your chat history is saved and will persist across page reloads.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-70">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              {message.role === "user" ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => (
                        <h1
                          className="text-2xl font-bold mt-4 mb-3"
                          {...props}
                        />
                      ),
                      h2: ({ ...props }) => (
                        <h2
                          className="text-xl font-bold mt-4 mb-2"
                          {...props}
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="text-lg font-semibold mt-3 mb-2"
                          {...props}
                        />
                      ),
                      p: ({ ...props }) => (
                        <p className="my-2 leading-relaxed" {...props} />
                      ),
                      ul: ({ ...props }) => (
                        <ul
                          className="my-2 list-disc pl-5 space-y-1"
                          {...props}
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="my-2 list-decimal pl-5 space-y-1"
                          {...props}
                        />
                      ),
                      li: ({ ...props }) => <li className="my-1" {...props} />,
                      strong: ({ ...props }) => (
                        <strong className="font-semibold" {...props} />
                      ),
                      code: ({ ...props }) => (
                        <code
                          className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        />
                      ),
                      pre: ({ ...props }) => (
                        <pre
                          className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2"
                          {...props}
                        />
                      ),
                      blockquote: ({ ...props }) => (
                        <blockquote
                          className="border-l-4 border-primary pl-4 italic my-2"
                          {...props}
                        />
                      ),
                      a: ({ ...props }) => (
                        <a
                          className="text-primary underline hover:opacity-80"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {message.role === "assistant" &&
                message.content === "" &&
                isLoading && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  </div>
                )}
            </div>
          </div>
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

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 bg-background"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-opacity"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
