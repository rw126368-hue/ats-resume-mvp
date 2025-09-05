'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useResumes, UseResumesReturn } from '@/hooks/useResumes';

const ResumesContext = createContext<UseResumesReturn | undefined>(undefined);

export function ResumesProvider({ children }: { children: ReactNode }) {
  const resumes = useResumes();
  return (
    <ResumesContext.Provider value={resumes}>
      {children}
    </ResumesContext.Provider>
  );
}

export function useResumesContext() {
  const context = useContext(ResumesContext);
  if (context === undefined) {
    throw new Error('useResumesContext must be used within a ResumesProvider');
  }
  return context;
}