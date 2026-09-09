import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { UserTelemetry } from './components/UserTelemetry'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { AccountDetails } from './pages/AccountDetails'
import { UserHistory } from './pages/UserHistory'
import { AdministrationGeneral } from './pages/AdministrationGeneral'
import { AdministrationContentControl } from './pages/AdministrationContentControl'
import { AdministrationRules } from './pages/AdministrationRules'
import { AdministrationWorkflows } from './pages/AdministrationWorkflows'
import { AdministrationUsers } from './pages/AdministrationUsers'
import { AdministrationHierarchy } from './pages/AdministrationHierarchy'
import { AdministrationStrategicGroups } from './pages/AdministrationStrategicGroups'
import { StrategyPlanningCycles } from './pages/StrategyPlanningCycles'
import { PlanningCycleDetail } from './pages/PlanningCycleDetail'
import { Capabilities } from './pages/Capabilities'
import { StrategyDashboard } from './pages/StrategyDashboard'
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserTelemetry />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StrategyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategy/planning-cycles"
            element={
              <ProtectedRoute>
                <StrategyPlanningCycles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategy/planning-cycles/:cycleId"
            element={
              <ProtectedRoute>
                <PlanningCycleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategy/capabilities"
            element={
              <ProtectedRoute>
                <Capabilities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <UserHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationGeneral />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration/content-control"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationContentControl />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration/rules"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationRules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration/workflows"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationWorkflows />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration/hierarchies"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationHierarchy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administration/strategic-groups"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdministrationStrategicGroups />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
