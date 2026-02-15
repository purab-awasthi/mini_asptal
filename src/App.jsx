import { Navigate, Route, Routes } from 'react-router-dom'
import Onboarding from './pages/Onboarding.jsx'
import EmergencyDashboard from './pages/EmergencyDashboard.jsx'
import './App.css'

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const hasRequiredProfileData = () => {
  const completed = localStorage.getItem('profileCompleted') === 'true'
  const profile = safeParse(localStorage.getItem('profileData'), null)
  if (!completed || !profile?.personal) return false

  const { fullName, age, gender, bloodGroup, phone } = profile.personal
  const hasContacts = Array.isArray(profile.contacts) && profile.contacts.length > 0

  return Boolean(
    String(fullName || '').trim() &&
      String(age || '').trim() &&
      String(gender || '').trim() &&
      String(bloodGroup || '').trim() &&
      String(phone || '').trim() &&
      hasContacts,
  )
}

function App() {
  const profileReady = hasRequiredProfileData()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={profileReady ? '/emergency' : '/onboarding'}
            replace
          />
        }
      />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/emergency"
        element={
          profileReady ? <EmergencyDashboard /> : <Navigate to="/onboarding" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
