import { Component, computed, inject, Input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Message } from '../interfaces/message.interface';
import { ChatService } from '../services/chat.service';
import { Chat } from '../interfaces/chat.interface';
import { AuthService } from '../services/auth.service';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap, takeUntil } from 'rxjs';
@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-window">
      <div class="chat-header">
        <span>{{ chat.participantNames }}</span>
      </div>

      <div class="chat-messages">
        @for (msg of messages(); track $index) {
        <div
          class="message"
          [class.mine]="msg.isMine"
          [class.theirs]="!msg.isMine"
        >
          <p>{{ msg.text }}</p>

          @if (msg.reminder) {
          <div class="reminder">🔔 {{ msg.reminder }}</div>
          } @if (msg.suggestedReplies && !msg.isMine) {
          <div class="suggested-replies">
            @for (reply of msg.suggestedReplies; track $index) {
            <button (click)="insertSuggestion(reply)">{{ reply }}</button>
            }
          </div>
          }

          <span class="timestamp">{{
            msg.timestamp | date : 'shortTime'
          }}</span>
        </div>
        }
      </div>

      @if (refinedMessage()) {
      <div class="refined-message-option">
        ✨ Suggested Refinement: <span>{{ refinedMessage() }}</span>
      </div>
      }

      <div class="chat-input">
        <input
          matInput
          placeholder="Type a message..."
          [(ngModel)]="newMessageText"
          (ngModelChange)="inputText$.next($event)"
          (keyup.enter)="sendMessage()"
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

      .refined-message-option {
        background-color: #2a2a2a; /* Darker background */
        padding: 5px;
        border-radius: 5px;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
      }
      .refined-message-option button {
        background-color: transparent;
        border: none;
        color: #fff;
      }

      .reminder {
        font-size: 0.8em;
        color: #aaa;
        margin-bottom: 5px;
      }

      .suggested-replies {
        display: flex;
        flex-wrap: wrap; /* Allow replies to wrap */
        margin-top: 5px;
      }

      .suggested-replies button {
        background-color: #333;
        color: white;
        border: none;
        border-radius: 15px; /* Rounded buttons */
        padding: 5px 10px;
        margin-right: 5px;
        margin-bottom: 5px; /* Space between buttons */
        cursor: pointer;
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
export class ChatComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  @Input() chat!: Chat;
  messages = signal<Message[]>([]);
  newMessageText: string = '';
  refinedMessage: WritableSignal<string | null> = signal(null); // Signal for refined message

  private chatService = inject(ChatService);
  private destroy$ = new Subject<void>();
   inputText$ = new Subject<string>();

  ngOnInit() {
    if (this.chat) {
      this.loadMessages(this.chat.id);
    }

    // Debounce the input text changes and call getRefinedMessage
    this.inputText$
      .pipe(
        debounceTime(500), // Wait for 500ms pause in typing
        distinctUntilChanged(), // Only if the text has actually changed
        takeUntil(this.destroy$), // Unsubscribe when component is destroyed
        switchMap((text) => {
          // Only call if there's text and a chat selected.  Return 'of(null)' to clear previous result.
          return this.chat && text.trim()
            ? this.chatService.getRefinedMessage(this.chat.id, text)
            : of(null);
        })
      )
      .subscribe((refinedText) => {
        this.refinedMessage.set(refinedText); // Update the signal
      });
  }

  loadMessages(chatId: string) {
    this.chatService.getChatMessages(chatId, (messages) => {
      this.messages.set(messages);
    });
  }

  sendMessage() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('No user logged in!');
      return;
    }
    // Send the message if newMessageText not empty
    if (this.newMessageText.trim() && this.chat) {
      this.chatService.sendMessage(this.chat.id, userId, this.newMessageText);
      this.newMessageText = ''; // Clear input field after sending
      this.refinedMessage.set(null); // Clear refined message after sending
    }
  }

  insertSuggestion(suggestion: string) {
    this.newMessageText = suggestion;
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Unsubscribe from observables
    this.destroy$.complete();
  }
}
