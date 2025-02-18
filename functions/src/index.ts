import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import corsLib from 'cors';
admin.initializeApp();
const db = admin.firestore();
const cors = corsLib({origin: true});

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

// Generate Suggested Replies AND Refined Message on Message Creation
export const onMessageCreated = functions
  .region('europe-west1')
  .firestore.document('messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    if (!snapshot.data) {
      console.error('Snapshot data is undefined');
      return;
    }
    const message = snapshot.data() as ChatMessage;
    const messageId = context.params.messageId;

    // Add to chat context.
    if (message.chatId) {
      await addChatContext(
        message.chatId,
        message.sender,
        message.text,
        messageId
      );
    }

    if (message.sender && message.chatId) {
      // Get previous messages for context (limit to last 5)
      const messagesRef = db.collection('messages');
      const previousMessagesSnapshot = await messagesRef
        .where('chatId', '==', message.chatId) // Filter by the message chatId
        .orderBy('timestamp', 'desc')
        .limit(5) // Limit to a reasonable number of previous messages
        .get();

      const previousMessages = previousMessagesSnapshot.docs
        .map((doc) => {
          const msg = doc.data() as ChatMessage;
          return `${msg.sender}: ${msg.text}`;
        })
        .join('\n');

      // Generate suggested replies.
      const suggestions = await generateSuggestedReplies(message.text);
      const updateObject: Partial<ChatMessage> = {};
      // Use Partial to allow updating only some fields

      if (suggestions.length > 0) {
        updateObject.suggestedReplies = suggestions;
      }

      // Generate refined message.
      functions.logger.info(
        'onMessageCreated: Generating refined message. Previous messages:',
        previousMessages
      );
      const refinedMessage = await generateRefinedMessage(
        previousMessages,
        message.text
      );
      functions.logger.info(
        'onMessageCreated: Refined message:',
        refinedMessage
      );

      if (refinedMessage) {
        updateObject.refinedMessage = refinedMessage;
      }

      // Update the document *once* with all changes.
      await snapshot.ref.update(updateObject);
    }
    return;
  });

// 4. Generate Contextual Reminder
export const onNewMessageForReminder = functions
  .region('europe-west1')
  .firestore.document('messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    if (!snapshot.data) {
      console.error('Snapshot data is undefined');
      return;
    }
    const message = snapshot.data() as ChatMessage;
    const messageId = context.params.messageId;

    if (message.chatId) {
      functions.logger.info(
        'onNewMessageForReminder: Getting context for chat:',
        message.chatId,
        'sender:',
        message.sender
      ); // LOG
      const contextString = await getRelevantContext(
        message.chatId,
        message.sender // Correct
      );
      functions.logger.info(
        'onNewMessageForReminder: contextString:',
        contextString
      ); // LOG

      if (contextString) {
        functions.logger.info(
          'onNewMessageForReminder: Generating reminder...'
        ); // LOG
        const reminder = await generateContextualReminder(
          contextString,
          message.text
        );
        functions.logger.info('onNewMessageForReminder: reminder:', reminder);

        if (reminder) {
          await snapshot.ref.update({reminder});
          // Mark context as reminded *only if a reminder was generated*
          await markContextAsReminded(message.chatId, messageId);
        }
      }
    }
    return;
  });

export const getRefinedMessage = functions
  .region('europe-west1')
  .https.onRequest(async (request, response) => {
    cors(request, response, async () => {
      // Wrap the entire function handler with cors
      try {
        // 1. Authentication (using Firebase Authentication ID Token)
        if (
          !request.headers.authorization ||
          !request.headers.authorization.startsWith('Bearer ')
        ) {
          console.error(
            `No Firebase ID token was passed
            as a Bearer token in the Authorization header.`
          );
          response.status(403).send('Unauthorized');
          return;
        }

        let idToken;
        if (
          request.headers.authorization &&
          request.headers.authorization.startsWith('Bearer ')
        ) {
          // Read the ID Token from the Authorization header.
          idToken = request.headers.authorization.split('Bearer ')[1];
        } else {
          response.status(403).send('Unauthorized');
          return;
        }

        let decodedIdToken; // Declare outside the try block
        try {
          decodedIdToken = await admin.auth().verifyIdToken(idToken);
          // User is authenticated!  You can access user info via decodedIdToken
          // For example:  const userId = decodedIdToken.uid;
        } catch (error) {
          console.error('Error while verifying Firebase ID token:', error);
          response.status(403).send('Unauthorized');
          return;
        }

        // 2. Input Validation
        if (!request.body.text || typeof request.body.text !== 'string') {
          response
            .status(400)
            .send({error: 'Missing or invalid "text" parameter.'});
          return;
        }
        if (!request.body.chatId || typeof request.body.chatId !== 'string') {
          response
            .status(400)
            .send({error: 'Missing or invalid "chatId" parameter.'});
          return;
        }

        const text = request.body.text;
        const chatId = request.body.chatId;

        // 3. Authorization (Check if the user is part of the chat)
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();

        if (!chatDoc.exists) {
          response.status(404).send({error: 'Chat not found'});
          return;
        }

        const chatData = chatDoc.data() as
          { participants: string[] }; // Assuming a 'participants' array

        if (!chatData.participants.includes(decodedIdToken.uid)) {
          response
            .status(403)
            .send({
              error: 'Unauthorized: User is not a participant in this chat',
            });
          return;
        }

        // 4. Fetch Previous Messages (Same as before)
        const messagesRef = db.collection('messages');
        const previousMessagesSnapshot = await messagesRef
          .where('chatId', '==', chatId)
          .orderBy('timestamp', 'desc')
          .limit(5)
          .get();

        const previousMessages = previousMessagesSnapshot.docs
          .map((doc) => {
            const msg = doc.data() as ChatMessage;
            return `${msg.sender}: ${msg.text}`;
          })
          .join('\n');

        // 5. Call Gemini API (Same as before)
        const refinedMessage = await generateRefinedMessage(
          previousMessages,
          text
        );

        // 6. Send Response
        response.status(200).send({refinedMessage}); // Send as JSON
      } catch (error) {
        functions.logger.error('Error in getRefinedMessage:', error);
        response.status(500)
          .send({error: 'Internal Server Error'}); // Send error as JSON
      }
    });
  });
