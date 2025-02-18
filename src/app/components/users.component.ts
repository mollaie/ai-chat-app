import { Component, inject, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { User } from '../interfaces/user.interface';

@Component({
  selector: 'app-new-chat-dialog',
  template: `
    <div class="modal-header">
      <h2>Select a Participant</h2>
      <button mat-icon-button (click)="closeDialog()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-list class="user-list">
      <mat-list-item *ngFor="let user of users" (click)="createChat(user.id)">
        <div class="user-info">
          <span class="user-name">{{ user.name }}</span>
        </div>
      </mat-list-item>
    </mat-list>
  `,
  styles: [
    `
      /* Modal Container */
      :host {
        display: flex;
        flex-direction: column;
        width: 400px;
        padding: 20px;
        background: #1e1e1e;
        color: #fff;
        border-radius: 8px;
      }

      /* Header with Close Button */
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      mat-icon {
        color: #ccc;
      }

      /* User List */
      .user-list {
        max-height: 400px;
        overflow-y: auto;
      }

      mat-list-item {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        transition: background 0.2s ease-in-out;
        border-radius: 5px;
        border: 1px solid #333;
      }

      mat-list-item:hover {
        background: #333;
      }

      /* Avatar Styling */
      .avatar {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        margin-right: 10px;
      }

      /* User Name */
      .user-name {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }
    `,
  ],
  imports: [CommonModule, MatListModule, MatButtonModule, MatIconModule],
})
export class UserDialogComponent implements OnInit {
  data = inject<{ userId: string }>(MAT_DIALOG_DATA);
  private chatService = inject(ChatService);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);

  users: User[] = [];

  async ngOnInit() {
    this.users = await this.chatService.getAllUsers();
  }

  async createChat(participantId: string) {
    const chatId = await this.chatService.createNewChat(
      this.data.userId,
      participantId
    );
    if (chatId) {
      this.dialogRef.close();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
