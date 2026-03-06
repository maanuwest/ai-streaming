import { useState, useRef, useEffect } from "react";

export function useAutoScroll<T>(dependency: T) {
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const scrollToBottom = () => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    // User scrolled up significantly
    if (scrollTop < lastScrollTop.current - 10) {
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

  // Auto-scroll when dependency changes (e.g., new message)
  useEffect(() => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [dependency, isAutoScrollEnabled]);

  return {
    isAutoScrollEnabled,
    setIsAutoScrollEnabled,
    messagesEndRef,
    scrollContainerRef,
    scrollToBottom,
    handleScroll,
  };
}
