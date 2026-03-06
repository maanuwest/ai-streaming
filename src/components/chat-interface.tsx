"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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

  const scrollToBottom = () => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                accumulatedContent += content;

                // Use debounced update instead of immediate update
                updateMessageDebounced(accumulatedContent, assistantMsgIndex);
              }
            } catch (e) {
              // Skip invalid JSON
              console.error("JSON parse error:", e);
            }
          }
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
      <div className="mb-4">
        <h1 className="text-3xl font-bold">LLM Streaming Chat</h1>
        <p className="text-muted-foreground">
          Real-time streaming chatbot powered by OpenAI
        </p>
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
              <div className="whitespace-pre-wrap">{message.content}</div>
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
