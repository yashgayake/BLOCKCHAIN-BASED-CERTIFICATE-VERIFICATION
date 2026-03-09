import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StoredCertificate {
  certificateHash: string;
  transactionHash: string;
  studentName: string;
  enrollmentNumber: string;
  course: string;
  institution: string;
  issueYear: number;
  issueDate: string;
  studentPhoto?: string;
  certificatePdf?: string;
}

export interface StoredStudent {
  enrollmentNumber: string;
  name: string;
  email: string;
  course: string;
  password: string;
  registrationDate: string;
}

interface AppContextType {
  certificates: StoredCertificate[];
  students: StoredStudent[];
  addCertificate: (cert: StoredCertificate) => void;
  addStudent: (student: StoredStudent) => void;
  getCertificateByHash: (hash: string) => StoredCertificate | undefined;
  getCertificatesByEnrollment: (enrollment: string) => StoredCertificate[];
  getStudentByEnrollment: (enrollment: string) => StoredStudent | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [certificates, setCertificates] = useState<StoredCertificate[]>(() => {
    const stored = localStorage.getItem('certificates');
    return stored ? JSON.parse(stored) : [];
  });

  const [students, setStudents] = useState<StoredStudent[]>(() => {
    const stored = localStorage.getItem('students');
    return stored ? JSON.parse(stored) : [];
  });

  const addCertificate = (cert: StoredCertificate) => {
    setCertificates(prev => {
      const updated = [...prev, cert];
      localStorage.setItem('certificates', JSON.stringify(updated));
      return updated;
    });
  };

  const addStudent = (student: StoredStudent) => {
    setStudents(prev => {
      const updated = [...prev, student];
      localStorage.setItem('students', JSON.stringify(updated));
      return updated;
    });
  };

  const getCertificateByHash = (hash: string) => {
    return certificates.find(c => c.certificateHash.toLowerCase() === hash.toLowerCase());
  };

  const getCertificatesByEnrollment = (enrollment: string) => {
    return certificates.filter(c => c.enrollmentNumber === enrollment);
  };

  const getStudentByEnrollment = (enrollment: string) => {
    return students.find(s => s.enrollmentNumber === enrollment);
  };

  return (
    <AppContext.Provider
      value={{
        certificates,
        students,
        addCertificate,
        addStudent,
        getCertificateByHash,
        getCertificatesByEnrollment,
        getStudentByEnrollment
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
