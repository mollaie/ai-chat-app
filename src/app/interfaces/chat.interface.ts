export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: Date;
  avatar?: string;
  participantNames: string;
}
