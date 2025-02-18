// functions/src/context.ts

import * as admin from 'firebase-admin';
import {ChatContext, isImportantMessage, formatTimestamp} from './models';
import {config} from './config';
import {serverTimestamp} from 'firebase/firestore';

const db = admin.firestore();

/**
 * Retrieves relevant chat context for a given chat ID and current user ID.
 * @param {string} chatId - The ID of the chat.
 * @param {string} currentUserId - The ID of the current user.
 * @return {Promise<string>} -
 * A promise that resolves to the relevant context string.
 */
export async function getRelevantContext(
  chatId: string,
  currentUserId: string
): Promise<string> {
  const contextRef = db.collection('chatContext');
  const now = new Date();
  const past = new Date(now.setDate(now.getDate() - config.contextWindowDays));
  const snapshot = await contextRef
    .where('chatId', '==', chatId)
    .where('userId', '!=', currentUserId)
    // Get context related to the *other* user
    .where('timestamp', '>=', past)
    .where('reminded', '!=', true) // Avoid repeated reminders.
    .orderBy('timestamp', 'desc')
    .get();

  let contextString = '';
  snapshot.forEach((doc) => {
    const context = doc.data() as ChatContext;
    contextString += `On ${formatTimestamp(context.timestamp)}, ${
      context.userId
    } mentioned: ${context.summary}\n`;
  });

  return contextString;
}

/**
 * Adds a new context entry to the chat context collection.
 * @param {string} chatId - The ID of the chat.
 * @param {string} userId - The ID of the user.
 * @param {string} messageText - The text of the message.
 * @param {string} messageId - The ID of the message.
 * @return {Promise<void>} - A promise that resolves when the context
 * entry is added.
 */
export async function addChatContext(
  chatId: string,
  userId: string,
  messageText: string,
  messageId: string // Pass the message ID
): Promise<void> {
  if (isImportantMessage(messageText)) {
    const contextRef = db.collection('chatContext');

    const contextSummary =
      messageText.length > 100 ?
        messageText.substring(0, 97) + '...' : // Truncate for summary
        messageText;

    await contextRef.add({
      chatId,
      userId,
      summary: contextSummary,
      timestamp: serverTimestamp(),
      reminded: false,
      relevantMessageId: messageId, // Store the message ID
    });
  }
}

/**
 * Marks a context entry as "reminded".
 * @param {string} chatId - The ID of the chat.
 * @param {string} relevantMessageId - The ID of the relevant message.
 * @return {Promise<void>} - A promise that
 * resolves when the context entry is marked as reminded.
 */
export async function markContextAsReminded(
  chatId: string,
  relevantMessageId: string
): Promise<void> {
  const contextRef = db.collection('chatContext');
  const snapshot = await contextRef
    .where('chatId', '==', chatId)
    .where('relevantMessageId', '==', relevantMessageId)
    .limit(1) // We expect at most one.
    .get();

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref; // Get the DocumentReference
    await docRef.update({reminded: true});
  }
}
