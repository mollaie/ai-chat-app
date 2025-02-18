import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  template: `
    <div class="auth-container">
      <mat-card>
        <mat-card-title>Sign In</mat-card-title>
        <form [formGroup]="signInForm" (ngSubmit)="onSubmit()">
          <!-- Email Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            @if (signInForm.controls.email.invalid &&
            signInForm.controls.email.touched){
            <mat-error> Please enter a valid email. </mat-error>
            }
          </mat-form-field>

          <!-- Password Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
            @if (signInForm.controls.password.invalid &&
            signInForm.controls.password.touched){
            <mat-error>
              Password must be at least 6 characters long.
            </mat-error>
            }
          </mat-form-field>

          <!-- Login Button -->
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="signInForm.invalid"
            class="full-width"
          >
            Login
          </button>
        </form>

        <!-- Sign Up Message -->
        <p class="auth-text">
          Don't have an account?
          <button mat-button color="accent" (click)="onSignUp()">
            Sign Up
          </button>
        </p>
      </mat-card>
    </div>
  `,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
})
export class SigninComponent {
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  signInForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  async onSubmit() {
    if (!this.signInForm.valid) {
      return this.showSnackbar('Invalid login credentials');
    }

    const { email, password } = this.signInForm.value;
    const user = await this.authService.signIn(email!, password!);

    user
      ? (this.showSnackbar('Login Successful!'),
        this.router.navigate(['chats']))
      : this.showSnackbar('Invalid login credentials');
  }

  onSignUp() {
    this.router.navigate(['signup']);
  }
  private showSnackbar(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
