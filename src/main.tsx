import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { LevelProvider } from './context/LevelContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'

import { HelmetProvider } from 'react-helmet-async'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <LevelProvider>
            <ThemeProvider defaultTheme="system" storageKey="kukemc-theme">
              <ToastProvider>
                <ConfirmProvider>
                  <App />
                </ConfirmProvider>
              </ToastProvider>
            </ThemeProvider>
          </LevelProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
