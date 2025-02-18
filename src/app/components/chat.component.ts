import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '../interfaces/message.interface';
import { ChatService } from '../services/chat.service';
import { Chat } from '../interfaces/chat.interface';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-window">
      <div class="chat-header">
        <span>{{ chat.participantNames }}</span>
      </div>

      <div class="chat-messages">
        @for (msg of messages(); track $index) {
        <div [ngClass]="{ mine: msg.isMine, theirs: !msg.isMine }">
          <p>{{ msg.text }}</p>
          <span>{{ msg.timestamp | date : 'shortTime' }}</span>
        </div>
        }
      </div>

      <div class="chat-input">
        <input
          matInput
          placeholder="Type a message..."
          [(ngModel)]="newMessage"
        />
        <button mat-icon-button color="primary" (click)="sendMessage()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .chat-window {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #121212;
      }

      .chat-header {
        background: #1e1e1e;
        padding: 15px;
        font-size: 18px;
        color: #fff;
        font-weight: bold;
      }

      .chat-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      /* My messages (align left) */
      .mine {
        align-self: flex-start;
        background: #0078ff;
        color: #fff;
        border-radius: 10px;
        padding: 10px;
        max-width: 60%;
        word-wrap: break-word;
        margin: 5px;
      }

      /* Their messages (align right) */
      .theirs {
        align-self: flex-end;
        background: #333;
        color: #fff;
        border-radius: 10px;
        padding: 10px;
        max-width: 60%;
        word-wrap: break-word;
        margin: 5px;
      }

      .timestamp {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        display: block;
        margin-top: 5px;
        text-align: right;
      }

      .chat-input {
        display: flex;
        padding: 10px;
        background: #1e1e1e;
        flex-direction: row;
        justify-content: space-between;

        input {
          flex: 1;
          border-radius: 8px;
          border: 1px solid #333;
          background: transparent;
          padding: 8px;
          color: #fff;
        }
      }
    `,
  ],
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
  ],
})
export class ChatComponent implements OnInit {
  private authService = inject(AuthService);

  @Input() chat!: Chat;
  messages = signal<Message[]>([]);
  newMessage = '';

  private chatService = inject(ChatService);

  ngOnInit() {
    this.chatService.getChatMessages(this.chat.id, (messages: Message[]) => {
      this.messages.set(messages);
    });
  }

  sendMessage() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('No user logged in!');
      return;
    }
    if (this.newMessage.trim() && this.chat) {
      this.chatService.sendMessage(this.chat.id, userId, this.newMessage);
      this.newMessage = '';
    }
  }
}
