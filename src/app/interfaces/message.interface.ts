export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isMine: boolean;
  chatId: string;
  suggestedReplies?: string[];
  refinedMessage?: string;
  reminder?: string;
}
