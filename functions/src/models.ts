import {firestore} from 'firebase-admin';
import * as functions from 'firebase-functions';
// Firestore Document Interfaces
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: firestore.Timestamp;
  suggestedReplies?: string[];
  refinedMessage?: string;
  reminder?: string;
  relevantMessageId?: string;
  chatId: string;
}

export interface ChatContext {
  chatId: string;
  userId: string;
  summary: string;
  timestamp: firestore.Timestamp;
  reminded?: boolean;
  relevantMessageId?: string;
}

/**
 * Helper function to format Firestore timestamps.
 * @param {Timestamp} timestamp - The Firestore timestamp to format.
 * @return {string} The formatted timestamp string.
 */
export function formatTimestamp(timestamp: firestore.Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleString(); // Adjust formatting as needed
}

/**
 * Helper function to check keywords for "important" messages (very basic).
 * @param {string} text - The message text to check.
 * @return {boolean} True if the message is considered important,
 * false otherwise.
 */
export function isImportantMessage(text: string): boolean {
  const keywords = ['promise',
    'will do', "I'll get", 'I will', 'remind me', 'of course', 'indeed'];
  const lowerText = text.toLowerCase();
  const isImportant = keywords.some((keyword) => lowerText.includes(keyword));
  functions.logger.info('isImportantMessage:', {text, isImportant}); // LOG THIS
  return isImportant;
}

/**
 * Helper function to trim the response from the gemini.
 * @param {string} responseTest - The response text to clean.
 * @return {string[]} The cleaned suggested replies.
 */
export function cleanSuggestedReplies(responseTest: string): string[] {
  return responseTest
    .split('\n')
    .filter((reply) => reply.trim() !== '')
    .map((item) => item.replace(/^\d+\.\s*/, ''));
}
