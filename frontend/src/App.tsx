import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import {Toaster} from 'react-hot-toast'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import SchedulePage from './pages/Schedule'
import ProfilePage from './pages/Profile'
import GroupsPage from './pages/Groups'
import CreateGroupPage from './pages/CreateGroup'
import GroupDashPage from './pages/GroupDash'
import HowToPlayPage from './pages/HowToPlay'
import ProtectedLayout from './components/ProtectedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RootRedirect from './components/RootRedirect'
import './App.css'

function App() {


  return (
    <>
     <Toaster />
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect/>}/>
          <Route path="/login" element={<LoginPage/>} />
            <Route element={<ProtectedRoute/>}>
              <Route element={<ProtectedLayout/>}>
                <Route path="/dashboard" element={<DashboardPage/>}/>
                <Route path='/schedule' element={<SchedulePage />}/>
                <Route path='/groups' element = {<GroupsPage />}/>
                <Route path='/create-group' element={<CreateGroupPage />}/>
                <Route path='/group/:groupId' element={<GroupDashPage />}/>
                <Route path='/profile' element={<ProfilePage />}/>
                <Route path='/how-to-play' element={<HowToPlayPage />}/>
                </Route>
            </Route>
        </Routes>     
      </Router>
    </>
  )
}

export default App
