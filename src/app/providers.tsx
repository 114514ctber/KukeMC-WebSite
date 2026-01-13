'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { LevelProvider } from '@/context/LevelContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LevelProvider>
        <ThemeProvider defaultTheme="system" storageKey="kukemc-theme">
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </LevelProvider>
    </AuthProvider>
  );
}
