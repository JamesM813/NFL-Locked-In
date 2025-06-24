import { Outlet } from 'react-router-dom'
import Header from './Header'
// import Footer from './Footer' // when you create it

export default function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <Header />
      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  )
}