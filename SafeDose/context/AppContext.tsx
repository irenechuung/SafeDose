import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, onSnapshot,
} from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: 'patient' | 'caregiver' | 'doctor';
  verified: boolean;
  licenseNumber?: string;
  npiNumber?: string;
  monitoredPatientEmail?: string;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  pillCount: number;
  times: string[];
  instructions: string;
  remainingPills: number;
  totalPills: number;
  patientName: string;
  patientEmail: string;
  prescribedBy: string;
  doctorId: string;
};

export type DoseLog = {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt: string | null;
  date: string;
  status: 'taken' | 'missed' | 'pending';
  patientEmail: string;
};

type AppContextType = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: 'patient' | 'caregiver' | 'doctor',
    extra?: { licenseNumber?: string; npiNumber?: string; monitoredPatientEmail?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  verifyDoctor: (code: string) => Promise<boolean>;
  role: 'patient' | 'caregiver' | 'doctor' | null;
  setRole: (role: 'patient' | 'caregiver' | 'doctor') => void;
  medications: Medication[];
  doseLogs: DoseLog[];
  logDose: (medicationId: string, scheduledTime: string) => Promise<void>;
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRoleState] = useState<'patient' | 'caregiver' | 'doctor' | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const unsubMeds = useRef<(() => void) | null>(null);
  const unsubLogs = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFirebaseUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        } catch (e) {
          setProfile(null);
        }
      } else {
        setProfile(null);
        setRoleState(null);
        setMedications([]);
        setDoseLogs([]);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // Firestore real-time listeners when role changes
  useEffect(() => {
    unsubMeds.current?.();
    unsubLogs.current?.();
    unsubMeds.current = null;
    unsubLogs.current = null;

    if (!firebaseUser || !role) return;

    let medsQ;
    if (role === 'patient') {
      medsQ = query(collection(db, 'medications'), where('patientEmail', '==', firebaseUser.email));
    } else if (role === 'doctor') {
      medsQ = query(collection(db, 'medications'), where('doctorId', '==', firebaseUser.uid));
    } else if (role === 'caregiver' && profile?.monitoredPatientEmail) {
      medsQ = query(collection(db, 'medications'), where('patientEmail', '==', profile.monitoredPatientEmail));
    }

    if (medsQ) {
      unsubMeds.current = onSnapshot(medsQ, snap => {
        setMedications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Medication)));
      });
    }

    const logsEmail =
      role === 'patient' ? firebaseUser.email :
      role === 'caregiver' ? profile?.monitoredPatientEmail :
      null;

    if (logsEmail) {
      const logsQ = query(collection(db, 'doseLogs'), where('patientEmail', '==', logsEmail));
      unsubLogs.current = onSnapshot(logsQ, snap => {
        setDoseLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DoseLog)));
      });
    }

    return () => {
      unsubMeds.current?.();
      unsubLogs.current?.();
    };
  }, [firebaseUser, role, profile]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    userRole: 'patient' | 'caregiver' | 'doctor',
    extra?: { licenseNumber?: string; npiNumber?: string; monitoredPatientEmail?: string }
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profileData: UserProfile = {
      uid: cred.user.uid,
      name,
      email: email.toLowerCase(),
      role: userRole,
      verified: userRole !== 'doctor',
      ...extra,
    };
    const clean = Object.fromEntries(
      Object.entries(profileData).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'users', cred.user.uid), clean);
    setProfile(profileData);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const verifyDoctor = async (code: string): Promise<boolean> => {
    if (code.trim() !== 'DOCTOR2024' || !firebaseUser) return false;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { verified: true });
    setProfile(prev => prev ? { ...prev, verified: true } : prev);
    return true;
  };

  const setRole = (newRole: 'patient' | 'caregiver' | 'doctor') => {
    setRoleState(newRole);
  };

  const logDose = async (medicationId: string, scheduledTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    const log = doseLogs.find(
      l => l.medicationId === medicationId &&
           l.scheduledTime === scheduledTime &&
           l.date === today &&
           l.status === 'pending'
    );
    if (!log) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    await updateDoc(doc(db, 'doseLogs', log.id), { status: 'taken', takenAt: time });
    const med = medications.find(m => m.id === medicationId);
    if (med) {
      await updateDoc(doc(db, 'medications', medicationId), {
        remainingPills: Math.max(0, med.remainingPills - 1),
      });
    }
  };

  const addMedication = async (med: Omit<Medication, 'id'>) => {
    const medRef = await addDoc(collection(db, 'medications'), med);
    const today = new Date().toISOString().split('T')[0];
    await Promise.all(
      med.times.map(time =>
        addDoc(collection(db, 'doseLogs'), {
          medicationId: medRef.id,
          medicationName: med.name,
          scheduledTime: time,
          takenAt: null,
          date: today,
          status: 'pending',
          patientEmail: med.patientEmail,
        })
      )
    );
  };

  return (
    <AppContext.Provider value={{
      firebaseUser, profile, isLoading,
      signIn, signUp, signOut, verifyDoctor,
      role, setRole,
      medications, doseLogs, logDose, addMedication,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
