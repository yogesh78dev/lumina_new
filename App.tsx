
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { CrmProvider } from './context/CrmContext';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerFormPage from './pages/CustomerFormPage';
import RemindersPage from './pages/RemindersPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import LeadDetailsPage from './pages/LeadDetailsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VendorsPage from './pages/VendorsPage';
import CustomizationSettingsPage from './pages/CustomizationSettingsPage';
import UserLoginActivityPage from './pages/UserLoginActivityPage';
import SecurityControlsPage from './components/settings/SecurityControlsPage';
import DataAdministrationPage from './pages/DataAdministrationPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <CrmProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/:leadId" element={<LeadDetailsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/new" element={<CustomerFormPage />} />
            <Route path="customers/:customerId/edit" element={<CustomerFormPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/customization" element={<CustomizationSettingsPage />} />
            <Route path="settings/security" element={<SecurityControlsPage />} />
            <Route path="settings/data/import" element={<DataAdministrationPage activeView="import" />} />
            <Route path="settings/data/export" element={<DataAdministrationPage activeView="export" />} />
            <Route path="settings/data/target" element={<DataAdministrationPage activeView="target" />} />
            <Route path="settings/users/activity/:userId" element={<UserLoginActivityPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Router>
    </CrmProvider>
  );
};

export default App;
