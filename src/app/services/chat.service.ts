import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Chat } from '../interfaces/chat.interface';
import { User } from '../interfaces/user.interface';
import { Message } from '../interfaces/message.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private chatsCollection = collection(this.firestore, 'chats');
  private messagesCollection = collection(this.firestore, 'messages');
  private usersCollection = collection(this.firestore, 'users');

  private selectedChat = new BehaviorSubject<Chat | null>(null);
  selectedChat$ = this.selectedChat.asObservable();

  private chats = new BehaviorSubject<Chat[]>([]);
  chats$ = this.chats.asObservable();

  constructor() {
    this.fetchChats();
  }

  async getAllUsers(): Promise<User[]> {
    const snapshot = await getDocs(this.usersCollection);
    const users = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as User)
    );

    const currentUserId = this.authService.getCurrentUserId();

    return users.filter((user) => user.id !== currentUserId);
  }

  /** Fetch all chats for the user */
  getUserChats(userId: string, callback: (chats: Chat[]) => void) {
    const chatsQuery = query(
      this.chatsCollection,
      where('participants', 'array-contains', userId),
      orderBy('timestamp', 'desc')
    );

    onSnapshot(chatsQuery, async (snapshot) => {
      const chats = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data() as Chat;

          // Convert timestamp to Date
          const timestamp =
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : new Date(data.timestamp);

          // Fetch participant names
          const participantIds = data.participants.filter(
            (id) => id !== userId
          );
          const participants = await Promise.all(
            participantIds.map(async (id) => {
              try {
                // ✅ Correct Firestore user reference
                const userRef = doc(this.firestore, 'users', id);
                const userSnap = await getDoc(userRef);

                // ✅ Ensure Firestore document exists before accessing data
                return userSnap.exists()
                  ? userSnap.data()?.['name'] || 'Unknown'
                  : 'Unknown';
              } catch (error) {
                console.error(`Error fetching user ${id}:`, error);
                return 'Unknown';
              }
            })
          );

          return {
            ...data,
            id: chatDoc.id,
            timestamp,
            participantNames: participants.join(', '),
          };
        })
      );

      callback(chats);
    });
  }

  /** Create a new chat */
  async createNewChat(userId: string, participantId: string) {
    const newChatRef = doc(this.chatsCollection); // Generate chat ID
    const timestamp = new Date();
    await setDoc(newChatRef, {
      id: newChatRef.id,
      participants: [userId, participantId],
      lastMessage: '',
      timestamp,
    });

    this.fetchChats();
    this.selectChat({
      id: newChatRef.id,
      lastMessage: '',
      participants: [userId, participantId],
      timestamp,
      participantNames: '',
    });

    return newChatRef.id;
  }

  /** Send a message */
  async sendMessage(chatId: string, senderId: string, text: string) {
    const newMessageRef = doc(this.messagesCollection);
    await setDoc(newMessageRef, {
      id: newMessageRef.id,
      chatId,
      sender: senderId,
      text,
      timestamp: new Date(),
    });

    // Update last message in chat
    const chatRef = doc(this.chatsCollection, chatId);
    await updateDoc(chatRef, { lastMessage: text, timestamp: new Date() });
  }

  /** Get messages in real-time */
  getChatMessages(chatId: string, callback: (messages: Message[]) => void) {
    const messagesQuery = query(
      this.messagesCollection,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Message;
        const isMine = data.sender === this.authService.getCurrentUserId();
        return {
          id: doc.id,
          sender: data.sender,
          text: data.text,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : new Date(data.timestamp),
          isMine: isMine,
          chatId: data.chatId,
        };
      });

      console.log(messages);
      callback(messages);
    });
  }

  fetchChats() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const chatsQuery = query(
      this.chatsCollection,
      where('participants', 'array-contains', userId),
      orderBy('timestamp', 'desc')
    );

    onSnapshot(chatsQuery, async (snapshot) => {
      const chatList = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data() as Chat;

          // Convert timestamp to Date
          const timestamp =
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : new Date(data.timestamp);

          // Fetch participant names inside Promise.all()
          const participantIds = data.participants.filter(
            (id) => id !== userId
          );

          const participants = await Promise.all(
            participantIds.map(async (id) => {
              try {
                // ✅ Correct way to reference Firestore document
                const userRef = doc(this.firestore, 'users', id);
                const userSnap = await getDoc(userRef);

                // ✅ Ensure Firestore document exists before accessing data
                return userSnap.exists()
                  ? userSnap.data()?.['name'] || 'Unknown'
                  : 'Unknown';
              } catch (error) {
                console.error(`Error fetching user ${id}:`, error);
                return 'Unknown';
              }
            })
          );

          return {
            ...data,
            id: chatDoc.id,
            timestamp,
            participantNames: participants.join(', '), // Store names in chat object
          };
        })
      );
      console.log(chatList);
      this.chats.next(chatList);
    });
  }

  /** Select a chat */
  selectChat(chat: Chat) {
    this.selectedChat.next(chat);
  }
}
