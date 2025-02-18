export const config = {
  geminiAPIKey:
    process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-pro',
  contextWindowDays: 1,
  maxSuggestionLength: 100,
};

if (!config.geminiAPIKey) {
  console.warn('GEMINI_API_KEY environment variable is not set.  Set it with:');
  console.warn('firebase functions:config:set gemini.apikey=<YOUR_API_KEY>');
}
