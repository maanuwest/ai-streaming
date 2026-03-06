import { useRef, useState } from "react";
import { decodeStreamResponse } from "@/lib/stream-decoder";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const DEBOUNCE_MS = 50;

export function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);
  const contentBufferRef = useRef("");
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateMessageDebounced = (
    content: string,
    messageIndex: number,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  ) => {
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

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const sendMessage = async (
    messages: Message[],
    userMessage: Message,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    assistantMsgIndex: number,
  ) => {
    setIsLoading(true);

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

      for await (const chunk of decodeStreamResponse(reader)) {
        if (chunk.content) {
          accumulatedContent += chunk.content;
          updateMessageDebounced(
            accumulatedContent,
            assistantMsgIndex,
            setMessages,
          );
        }
      }

      // Final update
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
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted by user");
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

  return { isLoading, sendMessage, stopStream };
}
