import './globals.css'
import { Inter } from 'next/font/google'
import { LayoutDashboard, Users, UserPlus } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Screening AI Agent',
  description: 'Agentic Pipeline for Campus Recruitment',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(11, 14, 20, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--brand-gradient)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Users size={20} color="white" />
            </div>
            <h1 className="heading-gradient" style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              KGP CV Screener <span style={{ color: 'white', fontWeight: 400 }}>AI</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 500 }}>
              <UserPlus size={18} /> Ingest
            </a>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={18} /> Batch Analytics
            </a>
          </div>
        </nav>
        <main style={{ minHeight: 'calc(100vh - 72px)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
