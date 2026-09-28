import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import { UserProfile, UserRole } from '../types';

export const ADMIN_BOOTSTRAP_EMAILS = [
  'sekouballayira512@gmail.com',
];

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, phone: string, email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user profile from Firestore or create initial profile
  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isEmailAdmin = firebaseUser.email && ADMIN_BOOTSTRAP_EMAILS.includes(firebaseUser.email.toLowerCase());
      
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If user is bootstrap admin but role isn't ADMIN, synchronize it
        if (isEmailAdmin && data.role !== 'ADMIN') {
          const updatedProfile = { ...data, role: 'ADMIN' as UserRole, updatedAt: new Date().toISOString() };
          await setDoc(userDocRef, updatedProfile, { merge: true });
          await setDoc(doc(db, 'admins', firebaseUser.uid), {
            email: firebaseUser.email,
            addedAt: new Date().toISOString(),
          }, { merge: true });
          setUserProfile(updatedProfile);
        } else {
          // If already admin or bootstrap admin, ensure /admins document exists for rules
          if (isEmailAdmin || data.role === 'ADMIN') {
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              email: firebaseUser.email || '',
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
          setUserProfile(data);
        }
      } else {
        // Create new user profile
        const role: UserRole = isEmailAdmin ? 'ADMIN' : 'CLIENT';
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'Client LDB',
          phone: firebaseUser.phoneNumber || '',
          email: firebaseUser.email || '',
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        
        if (isEmailAdmin) {
          await setDoc(doc(db, 'admins', firebaseUser.uid), {
            email: firebaseUser.email,
            addedAt: new Date().toISOString(),
          }, { merge: true });
        }

        setUserProfile(newProfile);
      }
    } catch (error) {
      console.warn('Warning fetching user profile:', error);
      // Fallback in-memory profile so the user is never stuck or blocked from logging in
      const isEmailAdmin = firebaseUser.email && ADMIN_BOOTSTRAP_EMAILS.includes(firebaseUser.email.toLowerCase());
      setUserProfile({
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || 'Client LDB',
        phone: firebaseUser.phoneNumber || '',
        email: firebaseUser.email || '',
        role: isEmailAdmin ? 'ADMIN' : 'CLIENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchOrCreateProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await fetchOrCreateProfile(cred.user);
  };

  const signUp = async (fullName: string, phone: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: fullName.trim() });
    
    const isEmailAdmin = ADMIN_BOOTSTRAP_EMAILS.includes(email.trim().toLowerCase());
    const role: UserRole = isEmailAdmin ? 'ADMIN' : 'CLIENT';
    const profile: UserProfile = {
      uid: cred.user.uid,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      if (isEmailAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          email: email.trim(),
          addedAt: new Date().toISOString(),
        }, { merge: true });
      }
      setUserProfile(profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await fetchOrCreateProfile(cred.user);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      // Prevent client modifying their own role
      delete updated.role;
      delete updated.uid;

      await updateDoc(doc(db, 'users', user.uid), updated);
      setUserProfile(prev => prev ? { ...prev, ...updated } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const isAdmin = userProfile?.role === 'ADMIN' || 
    (!!user?.email && ADMIN_BOOTSTRAP_EMAILS.includes(user.email.toLowerCase()));

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOutUser,
        resetPassword,
        signInWithGoogle,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
