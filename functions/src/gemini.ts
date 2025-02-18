// functions/src/gemini.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import {config} from './config';
import {cleanSuggestedReplies} from './models';

const genAI = new GoogleGenerativeAI(config.geminiAPIKey);
const model = genAI.getGenerativeModel({
  model: config.geminiModel,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});

/**
 * Generates suggested replies for a given chat message.
 * @param {string} messageText - The chat message to generate replies for.
 * @return {Promise<string[]>}
 * A promise that resolves to an array of suggested replies.
 */
export async function generateSuggestedReplies(
  messageText: string
): Promise<string[]> {
  try {
    const prompt = 'Generate 3 short suggested replies (max ' +
                   `${config.maxSuggestionLength} characters each) for this ` +
                   `chat message: "${messageText}"`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    // Clean up the response and return as an array

    return cleanSuggestedReplies(response.text());
  } catch (error) {
    console.error('Error generating suggested replies:', error);
    return []; // Return an empty array on error
  }
}

/**
 * Generates a refined version of the current message
 * based on the previous messages.
 * @param {string} previousMessages - The previous messages in the conversation.
 * @param {string} currentMessage - The current message to be refined.
 * @return {Promise<string | null>}
 * A promise that resolves to the refined message or null if an error occurs.
 */
export async function generateRefinedMessage(
  previousMessages: string,
  currentMessage: string
): Promise<string | null> {
  try {
    const prompt = `Here's the conversation so far:\n${previousMessages}\n\n` +
                   `Current message: ${currentMessage}\n\n` +
      `Suggest a more polite and
                   comprehensive rephrasing of the current message.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text() || null; // Return the refined message or null
  } catch (error) {
    console.error('Error generating refined message:', error);
    return null;
  }
}

/**
 * Generates a contextual reminder based on
 * the previous context and current message.
 * @param {string} previousContext - The previous context of the conversation.
 * @param {string} currentMessage - The current message in the conversation.
 * @return {Promise<string | null>}
 * A promise that resolves to a contextual
 * reminder or null if no reminder is needed.
 */
export async function generateContextualReminder(
  previousContext: string,
  currentMessage: string
): Promise<string | null> {
  try {
    const prompt = `${previousContext}\n\nCurrent message: ${currentMessage}.
    \n\nGenerate a subtle reminder related to the previous context,
    if appropriate, and within ${config.maxSuggestionLength} characters.
    If no reminder is needed, return an empty string.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const reminderText = response.text();
    return reminderText.trim() !== '' ? reminderText : null;
    // Return null for empty responses, string otherwise
  } catch (error) {
    console.error('Error generating contextual reminder:', error);
    return null;
  }
}
