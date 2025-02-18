import { Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ChatService } from '../services/chat.service';
import { ChatComponent } from '../components/chat.component';
import { FormsModule } from '@angular/forms';
import { Chat } from '../interfaces/chat.interface';
import { MatDialog } from '@angular/material/dialog';
import { UserDialogComponent } from '../components/users.component';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chats',
  template: `
    <div class="chat-container">
      <!-- Sidebar: Chat List -->
      <div class="chat-sidebar">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            placeholder="Search chats..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <mat-list>
          @for (chat of filteredChats$ | async; track $index) {

          <mat-list-item (click)="selectChat(chat)">
            <div class="chat-info">
              <div class="chat-title">{{ chat.participantNames }}</div>
              <div class="chat-message">
                {{ chat.lastMessage | slice : 0 : 30 }}...
              </div>
            </div>
            <div class="chat-timestamp">
              {{ chat.timestamp | date : 'shortTime' }}
            </div>
          </mat-list-item>
          }
        </mat-list>

        <!-- Floating Action Button (FAB) -->
        <button
          mat-fab
          color="primary"
          class="fab"
          (click)="createNewChat()"
          position="BottomLeft"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <!-- Right Panel: Chat Messages -->
      <div class="chat-panel">
        @if (selectedChat) {
        <app-chat [chat]="selectedChat"></app-chat>

        } @else {
        <div class="no-chat-selected">
          <p>Select a chat to start messaging</p>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .chat-container {
        display: flex;
        height: 100vh;
        background-color: #121212;
        overflow: hidden;
      }

      /* Sidebar: Left Chat List */
      .chat-sidebar {
        width: 25%;
        max-width: 320px;
        background: #1e1e1e;
        overflow-y: auto;
        padding: 15px;
        border-right: 1px solid #333;
      }

      .search-box {
        display: flex;
        align-items: center;
        background: #333;
        padding: 10px;
        border-radius: 10px;
      }

      .search-box mat-icon {
        color: #bbb;
        margin-right: 8px;
      }

      .search-box input {
        background: transparent;
        border: none;
        color: #fff;
        width: 100%;
      }

      mat-list-item {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        border-bottom: 1px solid #333;
        height: 80px !important;
      }

      .avatar {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        margin-right: 12px;
      }

      .chat-info {
        flex-grow: 1;
      }

      .chat-title {
        font-weight: bold;
        color: #fff;
      }

      .chat-message {
        font-size: 14px;
        color: #aaa;
      }

      .chat-timestamp {
        font-size: 12px;
        color: #888;
      }

      /* Right Panel: Chat Window */
      .chat-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #121212;
      }

      /* Floating Action Button */
      .fab {
        position: fixed;
        bottom: 20px;
        left: 20px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .chat-container {
          flex-direction: column;
        }

        .chat-sidebar {
          width: 100%;
          max-width: 100%;
        }
      }
    `,
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    ChatComponent,
    FormsModule,
    AsyncPipe,
  ],
})
export class ChatsComponent {
  private router = inject(Router);
  private chatService = inject(ChatService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  filteredChats$: Observable<Chat[]>;
  searchQuery = '';
  selectedChat: Chat | null = null;

  constructor() {
    this.filteredChats$ = this.chatService.chats$;
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
  }

  createNewChat() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('No user logged in!');
      return;
    }
    this.dialog.open(UserDialogComponent, { data: { userId } });
  }
}
