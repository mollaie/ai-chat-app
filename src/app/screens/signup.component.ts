import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
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
  selector: 'app-signup',
  template: `
    <div class="auth-container">
      <mat-card>
        <mat-card-title>Sign Up</mat-card-title>
        <form [formGroup]="signUpForm" (ngSubmit)="onSubmit()">
          <!-- Name Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name</mat-label>
            <input matInput type="text" formControlName="name" />
            @if (signUpForm.controls.name.invalid &&
            signUpForm.controls.name.touched) {
            <mat-error> Please enter a valid name. </mat-error>
            }
          </mat-form-field>
          <!-- Email Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
            @if (signUpForm.controls.email.invalid &&
            signUpForm.controls.email.touched) {
            <mat-error> Please enter a valid email. </mat-error>
            }
          </mat-form-field>

          <!-- Password Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
            @if (signUpForm.controls.password.invalid &&
            signUpForm.controls.password.touched) {
            <mat-error>
              Password must be at least 6 characters long.
            </mat-error>
            }
          </mat-form-field>

          <!-- Confirm Password Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm Password</mat-label>
            <input matInput type="password" formControlName="confirmPassword" />
            @if (signUpForm.hasError('passwordMismatch')) {
            <mat-error> Passwords do not match. </mat-error>
            }
          </mat-form-field>

          <!-- Sign Up Button -->
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="signUpForm.invalid"
            class="full-width"
          >
            Sign Up
          </button>
        </form>

        <!-- Sign In Message -->
        <p class="auth-text">
          Already have an account?
          <button mat-button color="accent" (click)="onSignIn()">
            Sign In
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
export class SignupComponent {
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  signUpForm = new FormGroup(
    {
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: this.passwordsMatchValidator as ValidatorFn }
  );

  async onSubmit() {
    if (!this.signUpForm.valid) {
      return this.showSnackbar('Invalid sign-up details');
    }

    const { name, email, password } = this.signUpForm.value;
    const user = await this.authService.signup(name!, email!, password!);

    user
      ? (this.showSnackbar('Sign-Up Successful!'),
        this.router.navigate(['chats']))
      : this.showSnackbar('Sign-Up failed. Please try again.');
  }

  onSignIn() {
    this.router.navigate(['signin']);
  }

  private showSnackbar(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
