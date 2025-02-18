import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  User,
} from '@angular/fire/auth';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private usersCollection = collection(this.firestore, 'users');

  private currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUser.asObservable();

  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const user = userCredential.user;
    this.currentUser.next(user);

    return user;
  }

  async signup(name: string, email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const user = userCredential.user;

    if (user) {
      const userRef = doc(this.usersCollection, user.uid);
      await setDoc(userRef, { id: user.uid, name, email });
    }

    this.currentUser.next(user);

    return user;
  }

  /** Get Current Logged-In User ID */
  getCurrentUserId(): string | null {
    if (!this.currentUser.value) {
      this.currentUser.next(this.auth.currentUser);
    }
    return this.currentUser.value?.uid || null;
  }

  /** Get User Info */
  async getUserById(userId: string) {
    const userRef = doc(this.usersCollection, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists()
      ? (userSnap.data() as { id: string; name: string; avatar?: string })
      : null;
  }
}
