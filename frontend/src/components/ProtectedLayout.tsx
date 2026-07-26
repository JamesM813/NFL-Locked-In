import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { SessionProvider } from '@/context/SessionContext'
import { SeasonProvider } from '@/context/SeasonContext'

export default function ProtectedLayout() {
  return (
    <SessionProvider>
      <SeasonProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          <Header />

          <main>
            <Outlet />
            <Footer />
          </main>
        </div>
      </SeasonProvider>
    </SessionProvider>
  )
}
