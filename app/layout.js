import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata = {
  title: 'Health Advisor Web',
  description: 'Patient recommendation review system for clinicians',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <div className="app-content">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
