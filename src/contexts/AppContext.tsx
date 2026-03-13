import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StoredCertificate {
  certificateHash: string;
  certificateNumber: string;
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

interface AppContextType {
  certificates: StoredCertificate[];
  addCertificate: (cert: StoredCertificate) => void;
  getCertificateByHash: (hash: string) => StoredCertificate | undefined;
  getCertificatesByEnrollment: (enrollment: string) => StoredCertificate[];
  clearCertificates: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [certificates, setCertificates] = useState<StoredCertificate[]>(() => {
    const stored = localStorage.getItem('certificates');
    return stored ? JSON.parse(stored) : [];
  });

  const addCertificate = (cert: StoredCertificate) => {
    setCertificates(prev => {
      const exists = prev.some(
        c => c.certificateHash.toLowerCase() === cert.certificateHash.toLowerCase()
      );

      if (exists) return prev;

      const updated = [...prev, cert];
      localStorage.setItem('certificates', JSON.stringify(updated));
      return updated;
    });
  };

  const getCertificateByHash = (hash: string) => {
    return certificates.find(
      c => c.certificateHash.toLowerCase() === hash.toLowerCase()
    );
  };

  const getCertificatesByEnrollment = (enrollment: string) => {
    return certificates.filter(c => c.enrollmentNumber === enrollment);
  };

  const clearCertificates = () => {
    setCertificates([]);
    localStorage.removeItem('certificates');
  };

  return (
    <AppContext.Provider
      value={{
        certificates,
        addCertificate,
        getCertificateByHash,
        getCertificatesByEnrollment,
        clearCertificates
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