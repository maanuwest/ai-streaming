interface ChatHeaderProps {
  messageCount: number;
  onClearChat: () => void;
}

export function ChatHeader({ messageCount, onClearChat }: ChatHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">LLM Streaming Chat</h1>
        <p className="text-muted-foreground">
          Real-time streaming chatbot powered by OpenAI
        </p>
      </div>
      {messageCount > 0 && (
        <button
          onClick={onClearChat}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:bg-muted/50 transition-colors"
          title="Clear chat history"
        >
          Clear Chat
        </button>
      )}
    </div>
  );
}
