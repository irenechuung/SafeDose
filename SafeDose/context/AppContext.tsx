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
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, onSnapshot, getDocs,
} from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: 'patient' | 'caregiver';
  caregiverId?: string;
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
  patientUid: string;
  photoUri?: string;
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
  patientUid: string;
};

export type PatientProfile = {
  uid: string;
  name: string;
  email: string;
};

type AppContextType = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'patient' | 'caregiver') => Promise<void>;
  signOut: () => Promise<void>;
  role: 'patient' | 'caregiver' | null;
  setRole: (role: 'patient' | 'caregiver') => void;
  medications: Medication[];
  doseLogs: DoseLog[];
  patients: PatientProfile[];
  logDose: (medicationId: string, scheduledTime: string) => Promise<void>;
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  updateMedication: (id: string, updates: Partial<Omit<Medication, 'id'>>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  linkToCaregiver: (caregiverEmail: string) => Promise<void>;
  unlinkCaregiver: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRoleState] = useState<'patient' | 'caregiver' | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);

  const unsubPatientMeds = useRef<(() => void) | null>(null);
  const unsubPatientLogs = useRef<(() => void) | null>(null);
  const unsubCaregiverMeds = useRef<(() => void) | null>(null);
  const unsubCaregiverLogs = useRef<(() => void) | null>(null);
  const unsubPatients = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFirebaseUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            setRoleState(data.role);
          } else {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
        setRoleState(null);
        setMedications([]);
        setDoseLogs([]);
        setPatients([]);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // Patient subscriptions
  useEffect(() => {
    unsubPatientMeds.current?.();
    unsubPatientLogs.current?.();
    unsubPatientMeds.current = null;
    unsubPatientLogs.current = null;

    if (!firebaseUser || role !== 'patient') return;

    const medsQ = query(collection(db, 'medications'), where('patientUid', '==', firebaseUser.uid));
    unsubPatientMeds.current = onSnapshot(medsQ, snap => {
      setMedications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Medication)));
    });

    const logsQ = query(collection(db, 'doseLogs'), where('patientUid', '==', firebaseUser.uid));
    unsubPatientLogs.current = onSnapshot(logsQ, snap => {
      setDoseLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DoseLog)));
    });

    return () => {
      unsubPatientMeds.current?.();
      unsubPatientLogs.current?.();
    };
  }, [firebaseUser, role]);

  // Each time medications or doseLogs update for a patient, ensure today's logs exist
  useEffect(() => {
    if (role !== 'patient' || !firebaseUser || medications.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    const missing: Promise<void>[] = [];
    for (const med of medications) {
      for (const time of med.times) {
        const exists = doseLogs.some(
          l => l.medicationId === med.id && l.scheduledTime === time && l.date === today
        );
        if (!exists) {
          missing.push(
            addDoc(collection(db, 'doseLogs'), {
              medicationId: med.id,
              medicationName: med.name,
              scheduledTime: time,
              takenAt: null,
              date: today,
              status: 'pending',
              patientEmail: med.patientEmail,
              patientUid: med.patientUid,
            }).then(() => {})
          );
        }
      }
    }
    if (missing.length > 0) Promise.all(missing);
  }, [medications, doseLogs, role, firebaseUser]);

  // Caregiver: subscribe to patients list
  useEffect(() => {
    unsubPatients.current?.();
    unsubPatients.current = null;

    if (!firebaseUser || role !== 'caregiver') {
      setPatients([]);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('caregiverId', '==', firebaseUser.uid),
      where('role', '==', 'patient')
    );
    unsubPatients.current = onSnapshot(q, snap => {
      setPatients(snap.docs.map(d => ({
        uid: d.id,
        name: d.data().name as string,
        email: d.data().email as string,
      })));
    });

    return () => { unsubPatients.current?.(); };
  }, [firebaseUser, role]);

  // Caregiver: subscribe to all patients' medications and logs when patient list changes
  const patientUidKey = patients.map(p => p.uid).sort().join(',');

  useEffect(() => {
    unsubCaregiverMeds.current?.();
    unsubCaregiverLogs.current?.();
    unsubCaregiverMeds.current = null;
    unsubCaregiverLogs.current = null;

    if (role !== 'caregiver' || patients.length === 0) {
      if (role === 'caregiver') {
        setMedications([]);
        setDoseLogs([]);
      }
      return;
    }

    const uids = patients.map(p => p.uid);

    const medsQ = query(collection(db, 'medications'), where('patientUid', 'in', uids));
    unsubCaregiverMeds.current = onSnapshot(medsQ, snap => {
      setMedications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Medication)));
    });

    const logsQ = query(collection(db, 'doseLogs'), where('patientUid', 'in', uids));
    unsubCaregiverLogs.current = onSnapshot(logsQ, snap => {
      setDoseLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as DoseLog)));
    });

    return () => {
      unsubCaregiverMeds.current?.();
      unsubCaregiverLogs.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, patientUidKey]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    userRole: 'patient' | 'caregiver'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profileData: UserProfile = {
      uid: cred.user.uid,
      name,
      email: email.toLowerCase(),
      role: userRole,
    };
    await setDoc(doc(db, 'users', cred.user.uid), profileData);
    setProfile(profileData);
    setRoleState(userRole);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const setRole = (newRole: 'patient' | 'caregiver') => {
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
        remainingPills: Math.max(0, med.remainingPills - med.pillCount),
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
          patientUid: med.patientUid,
        })
      )
    );
  };

  const updateMedication = async (id: string, updates: Partial<Omit<Medication, 'id'>>) => {
    await updateDoc(doc(db, 'medications', id), updates);
  };

  const deleteMedication = async (id: string) => {
    await deleteDoc(doc(db, 'medications', id));
    const logsQ = query(collection(db, 'doseLogs'), where('medicationId', '==', id));
    const logsSnap = await getDocs(logsQ);
    await Promise.all(logsSnap.docs.map(d => deleteDoc(d.ref)));
  };

  const linkToCaregiver = async (caregiverEmail: string) => {
    if (!firebaseUser || !profile) throw new Error('Not logged in.');
    const q = query(
      collection(db, 'users'),
      where('email', '==', caregiverEmail.toLowerCase().trim()),
      where('role', '==', 'caregiver')
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('No caregiver found with that email.');
    const caregiverUid = snap.docs[0].id;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { caregiverId: caregiverUid });
    setProfile(prev => prev ? { ...prev, caregiverId: caregiverUid } : prev);
  };

  const unlinkCaregiver = async () => {
    if (!firebaseUser || !profile) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), { caregiverId: null });
    setProfile(prev => prev ? { ...prev, caregiverId: undefined } : prev);
  };

  return (
    <AppContext.Provider value={{
      firebaseUser, profile, isLoading,
      signIn, signUp, signOut,
      role, setRole,
      medications, doseLogs, patients,
      logDose, addMedication, updateMedication, deleteMedication,
      linkToCaregiver, unlinkCaregiver,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
