# Aumera Stream - LLM Chatbot Mini Challenge

## Project Overview

This is a Next.js application for the **Chatbot-LLM Stream Mini Challenge**. The project demonstrates real-time streaming capabilities with Large Language Models (LLMs) in a modern web interface.

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Package Manager**: npm

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components (including shadcn/ui components)
- `src/lib/` - Utility functions and shared logic
- `.github/` - GitHub configuration and Copilot instructions

## Coding Standards

### TypeScript

- Use strict TypeScript with proper type definitions
- Prefer interfaces for object shapes
- Use type inference where possible
- Avoid `any` type unless absolutely necessary

### React & Next.js

- Use React Server Components by default
- Add "use client" directive only when needed (hooks, browser APIs, interactivity)
- Prefer Next.js App Router conventions
- Use proper async/await patterns for server components

### Styling

- Use Tailwind CSS utility classes for styling
- Follow mobile-first responsive design principles
- Use shadcn/ui components for consistent UI patterns
- Maintain consistent spacing and typography scales

### Code Organization

- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks or utility functions
- Use meaningful, descriptive variable and function names
- Add comments for complex logic or business rules

## LLM Streaming Implementation Guidelines

### Best Practices

- Implement proper error handling for API failures
- Show loading states during streaming
- Handle partial responses gracefully
- Implement retry logic for failed requests
- Add proper TypeScript types for streaming responses

### User Experience

- Display real-time streaming updates to users
- Show typing indicators or loading states
- Handle interruptions and cancellations
- Provide clear error messages
- Ensure responsive and accessible interface

## Component Development

When creating new components:

1. Use TypeScript with proper prop types
2. Follow shadcn/ui patterns for consistency
3. Make components accessible (ARIA labels, keyboard navigation)
4. Keep components responsive across all screen sizes
5. Add proper error boundaries where needed

## API Routes & Server Actions

- Use Next.js App Router API routes (`app/api/`)
- Implement proper request validation
- Handle errors with appropriate status codes
- Use streaming responses for LLM interactions
- Add rate limiting where appropriate

## Testing & Quality

- Write self-documenting code
- Add error handling for edge cases
- Test streaming functionality thoroughly
- Validate user inputs
- Handle network failures gracefully

## Performance

- Optimize bundle size
- Use code splitting where appropriate
- Implement proper caching strategies
- Lazy load components when beneficial
- Monitor and optimize streaming performance

## Security

- Validate and sanitize user inputs
- Protect API keys and secrets
- Implement proper CORS policies
- Add rate limiting for API endpoints
- Follow OWASP security best practices

## Challenge-Specific Context

This project is built for the **Chatbot-LLM Stream Mini Challenge**, which focuses on:

- Real-time streaming of LLM responses
- Modern, responsive chat interface
- Efficient handling of streaming data
- User-friendly interaction patterns
- Performance optimization for streaming content

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Important Notes

- Always use the `@/` import alias for internal imports
- Follow Next.js 15+ best practices and conventions
- Maintain consistency with existing code patterns
- Prioritize user experience and performance
- Keep the chat interface intuitive and responsive
