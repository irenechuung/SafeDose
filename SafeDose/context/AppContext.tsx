import React, { createContext, useContext, useState } from 'react';

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
  prescribedBy: string;
};

export type DoseLog = {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt: string | null;
  date: string;
  status: 'taken' | 'missed' | 'pending';
};

type AppContextType = {
  role: 'patient' | 'caregiver' | 'doctor' | null;
  setRole: (role: 'patient' | 'caregiver' | 'doctor') => void;
  medications: Medication[];
  doseLogs: DoseLog[];
  logDose: (medicationId: string, scheduledTime: string) => void;
  addMedication: (med: Omit<Medication, 'id'>) => void;
};

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const MOCK_MEDICATIONS: Medication[] = [
  {
    id: '1', name: 'Lisinopril', dosage: '10mg', pillCount: 1,
    times: ['8:00 AM'], instructions: 'Take with water',
    remainingPills: 18, totalPills: 30,
    patientName: 'Margaret Wilson', prescribedBy: 'Dr. Sarah Chen',
  },
  {
    id: '2', name: 'Metformin', dosage: '500mg', pillCount: 1,
    times: ['8:00 AM', '6:00 PM'], instructions: 'Take with food',
    remainingPills: 24, totalPills: 60,
    patientName: 'Margaret Wilson', prescribedBy: 'Dr. Sarah Chen',
  },
  {
    id: '3', name: 'Atorvastatin', dosage: '20mg', pillCount: 1,
    times: ['9:00 PM'], instructions: 'Take at bedtime',
    remainingPills: 8, totalPills: 30,
    patientName: 'Margaret Wilson', prescribedBy: 'Dr. Sarah Chen',
  },
];

const INITIAL_LOGS: DoseLog[] = [
  { id: 'l1', medicationId: '1', medicationName: 'Lisinopril', scheduledTime: '8:00 AM', takenAt: null, date: today, status: 'pending' },
  { id: 'l2', medicationId: '2', medicationName: 'Metformin', scheduledTime: '8:00 AM', takenAt: null, date: today, status: 'pending' },
  { id: 'l3', medicationId: '2', medicationName: 'Metformin', scheduledTime: '6:00 PM', takenAt: null, date: today, status: 'pending' },
  { id: 'l4', medicationId: '3', medicationName: 'Atorvastatin', scheduledTime: '9:00 PM', takenAt: null, date: today, status: 'pending' },
  { id: 'l5', medicationId: '1', medicationName: 'Lisinopril', scheduledTime: '8:00 AM', takenAt: '8:12 AM', date: yesterday, status: 'taken' },
  { id: 'l6', medicationId: '2', medicationName: 'Metformin', scheduledTime: '8:00 AM', takenAt: '8:14 AM', date: yesterday, status: 'taken' },
  { id: 'l7', medicationId: '2', medicationName: 'Metformin', scheduledTime: '6:00 PM', takenAt: null, date: yesterday, status: 'missed' },
  { id: 'l8', medicationId: '3', medicationName: 'Atorvastatin', scheduledTime: '9:00 PM', takenAt: '9:03 PM', date: yesterday, status: 'taken' },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'patient' | 'caregiver' | 'doctor' | null>(null);
  const [medications, setMedications] = useState<Medication[]>(MOCK_MEDICATIONS);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(INITIAL_LOGS);

  const logDose = (medicationId: string, scheduledTime: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setDoseLogs(prev => prev.map(log =>
      log.medicationId === medicationId && log.scheduledTime === scheduledTime && log.status === 'pending'
        ? { ...log, status: 'taken', takenAt: time }
        : log
    ));
    setMedications(prev => prev.map(m =>
      m.id === medicationId
        ? { ...m, remainingPills: Math.max(0, m.remainingPills - 1) }
        : m
    ));
  };

  const addMedication = (med: Omit<Medication, 'id'>) => {
    const newMed = { ...med, id: Date.now().toString() };
    setMedications(prev => [...prev, newMed]);
    const newLogs: DoseLog[] = med.times.map((time, i) => ({
      id: `${Date.now()}-${i}`,
      medicationId: newMed.id,
      medicationName: med.name,
      scheduledTime: time,
      takenAt: null,
      date: today,
      status: 'pending',
    }));
    setDoseLogs(prev => [...prev, ...newLogs]);
  };

  return (
    <AppContext.Provider value={{ role, setRole, medications, doseLogs, logDose, addMedication }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
