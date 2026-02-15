import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import OnboardingPage from './pages/Onboarding';

// Participant pages
import ParticipantDashboard from './components/participant/Dashboard';
import BrowseEvents from './components/participant/BrowseEvents';
import EventDetails from './components/participant/EventDetails';
import ParticipantProfile from './components/participant/Profile';
import ClubsListing from './components/participant/ClubsListing';
import OrganizerDetails from './components/participant/OrganizerDetails';

// Organizer pages
import OrganizerDashboard from './components/organizer/Dashboard';
import CreateEvent from './components/organizer/CreateEvent';
import OrganizerEventDetail from './components/organizer/EventDetail';
import QRScanner from './components/organizer/QRScanner';
import MerchandiseApproval from './components/organizer/MerchandiseApproval';
import OrganizerProfile from './components/organizer/Profile';
import EditEvent from './components/organizer/EditEvent';
import IssueMerchandise from './components/organizer/IssueMerchandise';

// Admin pages
import AdminDashboard from './components/admin/Dashboard';
import ManageClubs from './components/admin/ManageClubs';
import PasswordResets from './components/admin/PasswordResets';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Participant routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/browse-events" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <BrowseEvents />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <EventDetails />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantProfile />
            </ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ClubsListing />
            </ProtectedRoute>
          } />
          <Route path="/organizer/:id" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <OrganizerDetails />
            </ProtectedRoute>
          } />

          {/* Organizer routes */}
          <Route path="/organizer/dashboard" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/organizer/events/:id/issue-merchandise" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <IssueMerchandise />
            </ProtectedRoute>
          } />
          <Route path="/organizer/create-event" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/organizer/events/:id/edit" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <EditEvent />
              </ProtectedRoute>
          } />
          <Route path="/organizer/events/:id" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerEventDetail />
            </ProtectedRoute>
          } />
          <Route path="/organizer/scanner" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <QRScanner />
            </ProtectedRoute>
          } />
          <Route path="/organizer/merchandise-approval" element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <MerchandiseApproval />
            </ProtectedRoute>
          } />
          <Route path="/organizer/profile" element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerProfile />
          </ProtectedRoute>
        } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/clubs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageClubs />
            </ProtectedRoute>
          } />
          <Route path="/admin/password-resets" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PasswordResets />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;