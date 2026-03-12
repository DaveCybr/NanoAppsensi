import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/auth/RequireAuth'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import SummaryReport from './pages/summary-report/SummaryReport'
import LocationMap from './pages/location-map/LocationMap'
import IssueAttendance from './pages/issue-attendance/IssueAttendance'
import EmployeePage from './pages/employees/EmployeePage'
import HierarchyPage from './pages/hierarchy/HierarchyPage'
import ZonesPage from './pages/zones/ZonesPage'
import CompanyPage from './pages/company/CompanyPage'
import LeavePage from './pages/leave/LeavePage'
import CategoryPage from './pages/category/CategoryPage'
import ApprovalPage from './pages/approval/ApprovalPage'
import UserReportPage from './pages/report/user/UserReportPage'
import MonthlyReportPage from './pages/report/monthly/MonthlyReportPage'
import ActivityReportPage from './pages/report/activity/ActivityReportPage'
import UserSummaryPage from './pages/report/summary/UserSummaryPage'
import PlaceholderPage from './pages/PlaceholderPage'

function Protected({ children, fullHeight = false }: { children: React.ReactNode; fullHeight?: boolean }) {
  return (
    <RequireAuth>
      <AppLayout>
        <div className={fullHeight ? 'h-full' : ''}>{children}</div>
      </AppLayout>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/summary-report" replace />} />

        {/* Protected */}
        <Route path="/summary-report"   element={<Protected><SummaryReport /></Protected>} />
        <Route path="/location-map"     element={<Protected fullHeight><LocationMap /></Protected>} />
        <Route path="/issue-attendance" element={<Protected><IssueAttendance /></Protected>} />
        <Route path="/employee"         element={<Protected><EmployeePage /></Protected>} />
        <Route path="/hierarchy"        element={<Protected><HierarchyPage /></Protected>} />
        <Route path="/zones"            element={<Protected><ZonesPage /></Protected>} />
        <Route path="/company"          element={<Protected><CompanyPage /></Protected>} />
        <Route path="/leave"            element={<Protected><LeavePage /></Protected>} />
        <Route path="/category"         element={<Protected><CategoryPage /></Protected>} />
        <Route path="/approval"         element={<Protected><ApprovalPage /></Protected>} />

        <Route path="/report/user"     element={<Protected><UserReportPage /></Protected>} />
        <Route path="/report/monthly"  element={<Protected><MonthlyReportPage /></Protected>} />
        <Route path="/report/activity" element={<Protected><ActivityReportPage /></Protected>} />
        <Route path="/report/summary"  element={<Protected><UserSummaryPage /></Protected>} />

        {/* Placeholder routes */}
        {['/shifting','/calendar','/newsfeed','/audit-trail','/groups'].map(path => (
          <Route key={path} path={path} element={
            <Protected>
              <PlaceholderPage title={path.replace(/\//g, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
            </Protected>
          } />
        ))}

        {/* 404 */}
        <Route path="*" element={<Navigate to="/summary-report" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
