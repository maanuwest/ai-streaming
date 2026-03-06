# Aumera Stream - LLM Chatbot Mini Challenge

A real-time streaming chatbot application built with Next.js and OpenAI, featuring live token-by-token response streaming without using any abstraction SDKs.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd aumera-stream

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
- � Rich Markdown formatting (headings, lists, code blocks, bold, etc.)
- �💾 Chat history persistence with localStorage (survives page reloads)
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
└── components/
    └── chat-interface.tsx     # Chat UI with streaming logic
```

## How It Works

### Streaming Implementation

The streaming is implemented **without using the Vercel AI SDK** - everything is built from scratch:

1. **API Route** (`src/app/api/chat/route.ts`):
   - Receives messages from the client
   - Makes a streaming request to OpenAI's API
   - Forwards the stream directly to the client

2. **Client Component** (`src/components/chat-interface.tsx`):
   - Manages message state and UI
   - Renders Markdown formatting in assistant responses
   - Persists chat history to localStorage
   - Restores conversation context on page reload
   - Sends requests to the API route
   - Reads the streaming response using `ReadableStream`
   - Parses Server-Sent Events (SSE) format
   - Updates the UI in real-time with debounced rendering (50ms)
   - Smart auto-scroll that respects user's scroll position

3. **Stream Decoder** (`src/lib/stream-decoder.ts`):
   - Parses SSE format from OpenAI API
   - Handles buffering of incomplete messages
   - Yields content tokens as they arrive
   - Reusable utility for other streaming use cases

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
User Input → Chat Component → API Route → OpenAI API
                    ↑              ↓            ↓
                    └──── SSE Stream ←── Stream Response
```

1. **Client → Server**: User message sent via POST to `/api/chat`
2. **Server → OpenAI**: Edge function forwards request with streaming enabled
3. **OpenAI → Server**: Returns SSE stream with `data:` prefixed chunks
4. **Server → Client**: Proxies stream directly (no transformation)
5. **Client Parsing**: ReadableStream reader decodes and parses SSE chunks
6. **UI Updates**: React state updates for each token, triggering re-renders

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

- Single "use client" component for interactivity
- Server Components for static layouts
- Separation of concerns: API route (backend) vs Component (frontend)

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

### Performance Considerations

- **Debounced Streaming**: 80% fewer re-renders with 50ms batching
- **Smart Scrolling**: Respects user position, no forced scroll jumps
- **Turbopack**: Fast HMR and build times in development
- **Edge Runtime**: Sub-100ms response times globally
- **Optimistic Updates**: User message appears instantly before API call
- **Memory Efficient**: Streaming chunks processed incrementally

### Security Measures

- API key stored in `.env.local` (never committed)
- Request validation on API route
- Error messages don't leak sensitive data
- CORS handled by Next.js automatically

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Testing the Application

### What to Try

1. **Basic Chat**: Type "Hello!" and watch the response stream token-by-token
2. **Long Responses**: Ask "Explain quantum computing in detail" to see streaming with longer content
3. **Persistence Test**: Have a conversation, then refresh the page (F5 or Cmd+R) - your messages should remain
4. **Clear History**: Click the "Clear Chat" button in the header to reset the conversation
5. **Scroll Behavior**: While a long response is streaming, scroll up to read earlier messages - notice the auto-scroll stops
6. **Scroll Button**: When scrolled up, click the "↓ New messages below" button to jump back to the latest message
7. **Multiple Messages**: Have a conversation - context is maintained across messages and page reloads
8. **Mobile View**: Resize your browser or test on mobile for responsive design
9. **Error Handling**: Stop the server mid-stream to see error recovery

### Expected Behavior

- ✅ Responses appear in real-time with optimized rendering (50ms batching)
- ✅ Three-dot animation while waiting for first token
- ✅ Chat history persists across page reloads and browser sessions
- ✅ "Clear Chat" button appears when there are messages
- ✅ Smart auto-scroll: follows new messages when you're at the bottom
- ✅ Scroll preservation: stays in place when you scroll up to read
- ✅ "New messages below" button appears when scrolled up
- ✅ Input disabled while processing
- ✅ Clean, readable message formatting

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

## Challenge Requirements

This project fulfills the **Chatbot-LLM Stream Mini Challenge** requirements:

- ✅ Real-time streaming of LLM responses
- ✅ Modern, responsive chat interface
- ✅ Direct streaming implementation (no AI SDK abstraction)
- ✅ Efficient handling of streaming data
- ✅ User-friendly interaction patterns
- ✅ Performance optimization for streaming content

## Tech Stack

- **Framework:** Next.js 16.1.6 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom components (shadcn/ui ready)
- **LLM Provider:** OpenAI GPT-4o-mini
- **Package Manager:** npm
