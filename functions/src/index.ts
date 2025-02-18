// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  generateSuggestedReplies,
  generateRefinedMessage,
  generateContextualReminder,
} from './gemini';
import {ChatMessage} from './models';
import {
  getRelevantContext,
  addChatContext,
  markContextAsReminded,
} from './context';

admin.initializeApp();
const db = admin.firestore();

exports.testFunction = functions.https.onRequest((req, res) => {
  console.log('Firebase app initialized:', admin.apps.length > 0);
  res.send('Hello from Firebase!');
});


// 2. Generate Suggested Replies
export const onMessageCreated = functions.firestore.onDocumentCreated(
  'messages/{messageId}', // Trigger on the top-level messages collection
  async (event) => {
    if (!event.data) {
      console.error('Event data is undefined');
      return null;
    }
    if (!event.data) {
      console.error('Event data is undefined');
      return null;
    }
    const message = event.data.data() as ChatMessage;
    const messageId = event.params.messageId;

    // Add to chat context.  IMPORTANT: We now pass the chatId!
    if (message.chatId) {
      await addChatContext(
        message.chatId,
        message.sender,
        message.text,
        messageId
      );
    }

    if (message.sender && message.chatId) {
      // Avoid processing our own generated messages, and ensure chatId exists.
      const suggestions = await generateSuggestedReplies(message.text);
      if (suggestions.length > 0) {
        await event.data.ref.update({suggestedReplies: suggestions});
      }
    }

    return null;
  }
);

// 3. Generate Refined Message Suggestion
export const onMessageUpdated = functions.firestore.onDocumentUpdated(
  'messages/{messageId}', // Trigger on the top-level messages collection
  async (event) => {
    if (!event.data) {
      console.error('Event data is undefined');
      return null;
    }
    const before = event.data.before.data() as ChatMessage;
    const after = event.data.after.data() as ChatMessage;

    // Only refine if the message text has changed,
    // chatId exists, and there isn't already a refined message
    if (before.text !== after.text && after.chatId && !after.refinedMessage) {
      // Get previous messages for context (limit to last 5, for example)
      const messagesRef = db.collection('messages'); // Your original collection
      const previousMessagesSnapshot = await messagesRef
        .where('chatId', '==', after.chatId) // Filter by chatId
        .orderBy('timestamp', 'desc')
        .limit(6) // Get the updated message also, to remove it after
        .get();

      // Exclude the message being updated to avoid infinite loops.
      const previousMessages = previousMessagesSnapshot.docs
        .filter((doc) => doc.id !== event.params.messageId)
        // filter the current message
        .map((doc) => {
          const msg = doc.data() as ChatMessage;
          return `${msg.sender}: ${msg.text}`;
        })
        .reverse() // Reverse to get chronological order
        .join('\n');

      const refinedMessage = await generateRefinedMessage(
        previousMessages,
        after.text
      );
      if (refinedMessage) {
        await event.data.after.ref.update({refinedMessage});
      }
    }
    return null;
  }
);

// 4. Generate Contextual Reminder
export const onNewMessageForReminder = functions.firestore.onDocumentCreated(
  'messages/{messageId}', // Trigger on the top-level messages collection
  async (event) => {
    if (!event.data) {
      console.error('Event data is undefined');
      return null;
    }
    const message = event.data.data() as ChatMessage;
    const messageId = event.params.messageId;

    if (message.chatId) {
      // Get relevant context
      const contextString = await getRelevantContext(
        message.chatId,
        message.sender
      );

      if (contextString) {
        const reminder = await generateContextualReminder(
          contextString,
          message.text
        );
        if (reminder) {
          await event.data.ref.update({reminder});
          // Mark context as reminded to avoid duplication.
          await markContextAsReminded(message.chatId, messageId);
        }
      }
    }
    return null;
  }
);
