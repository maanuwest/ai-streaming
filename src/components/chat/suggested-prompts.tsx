interface SuggestedPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({
  prompts,
  onSelectPrompt,
  disabled = false,
}: SuggestedPromptsProps) {
  return (
    <div className="text-center text-muted-foreground py-12">
      <p className="text-lg">Start a conversation!</p>
      <p className="text-sm mt-2">
        Type a message below or try one of these prompts:
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt)}
            disabled={disabled}
            className="text-left p-4 border rounded-lg bg-background hover:bg-muted/50 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-2">
              <span className="text-primary text-lg mt-1 group-hover:scale-110 transition-transform">
                💬
              </span>
              <p className="text-sm text-foreground flex-1">{prompt}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs mt-8 opacity-60">
        Your chat history is saved and will persist across page reloads.
      </p>
    </div>
  );
}
