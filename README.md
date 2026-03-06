# Aumera Stream - LLM Chatbot Mini Challenge

A real-time streaming chatbot application built with Next.js and OpenAI, featuring live token-by-token response streaming without using any abstraction SDKs.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>

# 2. Install dependencies
npm install

# 3. Set up your OpenAI API key
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local

# 4. Start the development server
npm run dev

# 5. Open http://localhost:3000 in your browser
```

That's it! Start chatting with the AI.

## Features

- 🚀 Real-time LLM streaming with OpenAI GPT-4o-mini
- 💬 Modern, responsive chat interface
- 🛑 Request cancellation - stop streaming responses mid-generation
- 💡 Suggested prompts for quick demo showcases
- 📝 Rich Markdown formatting (headings, lists, code blocks, bold, etc.)
- 💾 Chat history persistence with localStorage (survives page reloads)
- 🛡️ Rate limiting (10 messages/minute) with client-side enforcement
- 🔐 Input validation & sanitization (XSS protection, length limits)
- ⚡ Built with Next.js 16.1.6 and Turbopack
- 🎨 Styled with Tailwind CSS v4
- 🔒 Secure API key management with environment variables
- 📱 Mobile-friendly responsive design

## Prerequisites

- Node.js 20+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Detailed Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd ai-streaming
   npm install
   ```

2. **Configure your OpenAI API key:**

   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000) to start chatting!

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # OpenAI streaming API endpoint
│   ├── globals.css            # Global styles & Tailwind config
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main chat page
├── components/
│   ├── chat-interface.tsx     # Main chat orchestrator (~184 lines)
│   └── chat/
│       ├── chat-header.tsx         # Header with title & clear button
│       ├── message-bubble.tsx      # Individual message rendering
│       ├── suggested-prompts.tsx   # Empty state prompt grid
│       └── markdown-components.tsx # Markdown styling config
├── hooks/
│   ├── use-chat-messages.ts   # localStorage persistence logic
│   ├── use-auto-scroll.ts     # Smart scroll behavior management
│   └── use-chat-stream.ts     # Streaming & debouncing logic
└── lib/
    ├── input-validator.ts     # Input validation, sanitization & rate limiting
    └── stream-decoder.ts      # SSE stream parsing utility
```

## How It Works

### Streaming Implementation

The streaming is implemented **without using the Vercel AI SDK** - everything is built from scratch:

1. **API Route** (`src/app/api/chat/route.ts`):
   - Receives messages from the client
   - Makes a streaming request to OpenAI's API
   - Forwards the stream directly to the client

2. **Client Component** (`src/components/chat-interface.tsx`):
   - Orchestrates chat functionality and state management
   - Validates & sanitizes user input before sending
   - Enforces rate limiting (10 messages/minute)
   - Delegates logic to custom hooks (messages, streaming, scrolling)
   - Delegates rendering to focused sub-components

3. **Stream Decoder** (`src/lib/stream-decoder.ts`):
   - Parses SSE format from OpenAI API
   - Handles buffering of incomplete messages
   - Yields content tokens as they arrive
   - Reusable utility for other streaming use cases

4. **Input Validator** (`src/lib/input-validator.ts`):
   - Validates message length (1-4000 characters)
   - Sanitizes input (removes null bytes, normalizes whitespace)
   - Detects XSS patterns (script tags, event handlers, etc.)
   - Rate limiting with sliding window (10 messages/minute)
   - Track message timestamps for abuse prevention

5. **Custom Hooks** (`src/hooks/`):
   - **useChatMessages**: localStorage persistence with auto-save/load
   - **useAutoScroll**: Smart scroll detection and management
   - **useChatStream**: Streaming logic with debouncing and abort control

6. **UI Components** (`src/components/chat/`):
   - **ChatHeader**: Title, subtitle, and clear chat button
   - **MessageBubble**: User/assistant message rendering with markdown
   - **SuggestedPrompts**: Empty state with clickable prompt grid
   - **markdownComponents**: Reusable ReactMarkdown styling config

### Key Technologies

- **Next.js App Router** - Modern React framework
- **Edge Runtime** - Fast, globally distributed API routes
- **Server-Sent Events (SSE)** - Real-time streaming protocol
- **ReadableStream API** - Browser-native streaming
- **Tailwind CSS v4** - Utility-first styling

## Architecture & Technical Decisions

### Why No AI SDK?

The challenge specifically required **no abstraction layers**. This implementation uses native browser APIs and direct OpenAI integration to provide full transparency and control over the streaming process.

### Streaming Flow

```
User Input → Validation → Chat Component → API Route → OpenAI API
                    ↑          ↑              ↓            ↓
                    └──────────└──── SSE Stream ←── Stream Response
```

1. **Input Validation**: Sanitize input, check length & rate limits
2. **Client → Server**: User message sent via POST to `/api/chat`
3. **Server → OpenAI**: Edge function forwards request with streaming enabled
4. **OpenAI → Server**: Returns SSE stream with `data:` prefixed chunks
5. **Server → Client**: Proxies stream directly (no transformation)
6. **Client Parsing**: ReadableStream reader decodes and parses SSE chunks
7. **UI Updates**: React state updates for each token, triggering re-renders

### Key Technical Decisions

**1. Edge Runtime**

- Chosen for lower latency and global distribution
- Eliminates cold starts typical of serverless functions
- Direct streaming proxy without buffering

**2. Native ReadableStream API**

- No external dependencies for streaming
- Browser-native, well-supported API
- Efficient memory usage with streaming chunks

**3. Direct State Management**

- No Redux/Zustand needed for this scope
- React `useState` sufficient for message history
- Real-time updates via incremental state mutations

**4. Server-Sent Events (SSE) Format**

- OpenAI's native streaming format
- Simple text-based protocol
- Easy to parse: `data: {json}\n\n`

**5. Component Architecture**

- Main chat-interface as orchestrator (~184 lines)
- Extracted UI components for single responsibility
- Extracted custom hooks for logic reusability
- Reusable, testable components (header, messages, prompts)
- Markdown configuration separated for maintainability
- Server Components for static layouts
- Separation of concerns: API route (backend) vs Components (frontend)

**6. Error Handling Strategy**

- Graceful degradation on stream failures
- User-friendly error messages
- Console logging for debugging

**7. Tailwind CSS v4**

- Latest version with improved performance
- Inline theme configuration via `@theme`
- No external config files needed

**8. Debounced Rendering (50ms)**

- Reduces re-renders from ~100/sec to ~20/sec
- Updates UI every 50ms instead of every token
- Still feels real-time (imperceptible delay)
- Significant performance improvement for long responses

**9. Smart Auto-Scroll**

- Detects when user manually scrolls up (10px+ threshold)
- Disables auto-scroll to preserve reading position
- Re-enables when user scrolls back to bottom (100px tolerance)
- Shows "New messages below" button when disabled
- Prevents shake/flicker with generous thresholds and direction detection

**10. LocalStorage Persistence**

- Automatically saves chat history to browser localStorage
- Restores messages on page reload/refresh
- Maintains conversation context across sessions
- "Clear Chat" button to reset history when needed
- Error handling for localStorage unavailable/quota exceeded

**11. Markdown Rendering**

- Uses `react-markdown` for formatting assistant responses
- Supports headings, lists, code blocks, bold, italic, links
- Custom Tailwind styling for consistent look & feel
- User messages remain plain text for simplicity
- Syntax highlighting ready (can be extended with plugins)

**12. Request Cancellation with AbortController**

- Browser-native AbortController API for request cancellation
- Stop button replaces Send button while streaming
- Cancels OpenAI API request immediately (stops token generation)
- Preserves accumulated content before cancellation
- Saves on API costs - you only pay for tokens generated before abort
- Graceful error handling distinguishes abort from network failures

**13. Suggested Prompts**

- Four pre-written prompts displayed in empty state
- Designed to generate longer responses for streaming demonstration
- One-click activation - prompts auto-submit on click
- Helps new users understand capabilities
- Grid layout responsive to screen size

**14. Rate Limiting & Input Validation**

- Client-side rate limiting: 10 messages per minute maximum
- Sliding window algorithm tracks message timestamps
- Clear error messages when limit exceeded
- Input sanitization removes dangerous characters
- XSS pattern detection blocks malicious content
- Length validation (1-4000 characters)
- Errors display above input field and auto-clear on typing

**15. Component Extraction & Refactoring**

- Reduced main component from 487 to 184 lines (62% reduction)
- Extracted 4 focused UI components for better maintainability
- Extracted 3 custom hooks for logic separation
- Single responsibility principle: each file has one clear purpose
- Improved testability: components and hooks can be tested in isolation
- Reusable components and hooks: can be used in other parts of the app
- Markdown configuration centralized and reusable
- Follows Copilot instructions for clean code organization

**16. Custom Hooks Pattern**

- **useChatMessages**: Encapsulates localStorage persistence logic
- **useAutoScroll**: Manages scroll position and auto-scroll behavior
- **useChatStream**: Handles streaming, debouncing, and abort control
- Each hook has single responsibility and clear API
- Hooks are framework-agnostic and easily testable
- Main component becomes a thin orchestration layer
- Follows React best practices for hook composition

### Performance Considerations

- **Debounced Streaming**: 80% fewer re-renders with 50ms batching
- **Smart Scrolling**: Respects user position, no forced scroll jumps
- **Turbopack**: Fast HMR and build times in development
- **Edge Runtime**: Sub-100ms response times globally
- **Optimistic Updates**: User message appears instantly before API call
- **Memory Efficient**: Streaming chunks processed incrementally

### Security Measures

- **API Key Protection**: Stored in `.env.local` (never committed to git)
- **Input Validation**: Length limits (1-4000 chars) on all messages
- **Input Sanitization**: Removes null bytes, normalizes whitespace
- **XSS Prevention**: Detects and blocks suspicious patterns (script tags, event handlers, iframes)
- **Rate Limiting**: Client-side enforcement of 10 messages/minute maximum
- **Error Handling**: Error messages don't leak sensitive data
- **CORS**: Handled by Next.js automatically

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Testing the Application

### What to Try

1. **Suggested Prompts**: On empty state, click any of the four suggested prompts to see instant streaming demos
2. **Stop Button**: Click a suggested prompt (like the zoo newsletter), then click the Stop button mid-generation to cancel
3. **Basic Chat**: Type "Hello!" and watch the response stream token-by-token
4. **Long Responses**: Ask "Explain quantum computing in detail" to see streaming with longer content
5. **Stop & Resume**: Start a long response, stop it halfway, then send another message - the chat continues normally
6. **Persistence Test**: Have a conversation, then refresh the page (F5 or Cmd+R) - your messages should remain
7. **Clear History**: Click the "Clear Chat" button in the header to reset the conversation
8. **Scroll Behavior**: While a long response is streaming, scroll up to read earlier messages - notice the auto-scroll stops
9. **Scroll Button**: When scrolled up, click the "↓ New messages below" button to jump back to the latest message
10. **Multiple Messages**: Have a conversation - context is maintained across messages and page reloads
11. **Mobile View**: Resize your browser or test on mobile for responsive design
12. **Rate Limiting**: Try sending 11 messages rapidly - you should see an error after the 10th message
13. **Input Validation**: Try typing a very long message (over 4000 characters) - submit will be blocked with an error
14. **Error Handling**: Stop the server mid-stream to see error recovery

### Expected Behavior

- ✅ Four suggested prompts appear when chat is empty
- ✅ Responses appear in real-time with optimized rendering (50ms batching)
- ✅ Three-dot animation while waiting for first token
- ✅ Send button transforms into black Stop button during streaming
- ✅ Stop button cancels request and preserves accumulated content
- ✅ Chat history persists across page reloads and browser sessions
- ✅ "Clear Chat" button appears when there are messages
- ✅ Smart auto-scroll: follows new messages when you're at the bottom
- ✅ Scroll preservation: stays in place when you scroll up to read
- ✅ "New messages below" button appears when scrolled up
- ✅ Rate limiting prevents more than 10 messages per minute
- ✅ Error messages display for validation failures (too long, rate limit, etc.)
- ✅ Errors auto-clear when user starts typing
- ✅ Input field has max length of 4000 characters
- ✅ Input disabled while processing
- ✅ Clean, readable message formatting with Markdown support

### Troubleshooting

**"OpenAI API key not configured"**

- Ensure `.env.local` exists with valid `OPENAI_API_KEY`
- Restart dev server after adding the key

**Port already in use**

- Next.js will automatically use the next available port
- Check terminal output for the actual URL

**Stream not working**

- Check browser console for errors
- Verify OpenAI API key has credits
- Ensure network connection is stable

## Environment Variables

| Variable         | Description         | Required |
| ---------------- | ------------------- | -------- |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes      |
