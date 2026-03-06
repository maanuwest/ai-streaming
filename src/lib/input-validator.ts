const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGES_PER_MINUTE = 10;

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Store message timestamps for rate limiting
const messageTimestamps: number[] = [];

/**
 * Validates chat input for length and malicious patterns
 */
export function validateChatInput(input: string): ValidationResult {
  // Check length
  if (input.length < MIN_MESSAGE_LENGTH) {
    return { isValid: false, error: "Message cannot be empty" };
  }

  if (input.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
    };
  }

  // Check for malicious patterns
  if (containsSuspiciousPatterns(input)) {
    return {
      isValid: false,
      error: "Message contains invalid content",
    };
  }

  return { isValid: true };
}

/**
 * Checks if user has exceeded rate limit
 */
export function checkRateLimit(): ValidationResult {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Remove timestamps older than 1 minute
  while (messageTimestamps.length > 0 && messageTimestamps[0] < oneMinuteAgo) {
    messageTimestamps.shift();
  }

  if (messageTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
    return {
      isValid: false,
      error: "Too many messages. Please wait a moment before sending another.",
    };
  }

  messageTimestamps.push(now);
  return { isValid: true };
}

/**
 * Gets remaining messages in current rate limit window
 */
export function getRemainingMessages(): number {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Count recent messages
  const recentMessages = messageTimestamps.filter(
    (timestamp) => timestamp > oneMinuteAgo,
  );

  return Math.max(0, MAX_MESSAGES_PER_MINUTE - recentMessages.length);
}

/**
 * Checks for suspicious patterns that might indicate XSS or injection attempts
 */
function containsSuspiciousPatterns(input: string): boolean {
  // Check for common XSS patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitizes user input by removing dangerous characters and normalizing whitespace
 */
export function sanitizeInput(input: string): string {
  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Normalize whitespace (replace multiple spaces with single space)
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}
