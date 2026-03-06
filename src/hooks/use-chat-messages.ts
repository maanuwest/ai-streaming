import { useState, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "chat-messages";

function loadMessagesFromStorage(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Message[];
    }
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
  }
  return [];
}

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage);

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

  const clearMessages = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear messages from localStorage:", error);
    }
  };

  return { messages, setMessages, clearMessages };
}
