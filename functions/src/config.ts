export const config = {
  geminiAPIKey:
    process.env.GEMINI_API_KEY || 'AIzaSyDZe9-f4VgLpRJ2KqJY7mU7f1ta8ynwBII',
  geminiModel: 'gemini-pro',
  contextWindowDays: 2,
  maxSuggestionLength: 50,
};

if (!config.geminiAPIKey) {
  console.warn('GEMINI_API_KEY environment variable is not set.  Set it with:');
  console.warn('firebase functions:config:set gemini.apikey=<YOUR_API_KEY>');
}
