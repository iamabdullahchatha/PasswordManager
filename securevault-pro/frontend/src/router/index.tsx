import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Auth pages
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import ResetPasswordPage from '../pages/auth/ResetPassword';

// Main pages
import DashboardPage from '../pages/Dashboard';

// Vault pages
import VaultPage from '../pages/vault/VaultPage';
import AddEmailPage from '../pages/vault/AddEmailPage';
import EmailDetailPage from '../pages/vault/EmailDetailPage';
import PasswordGeneratorPage from '../pages/vault/PasswordGeneratorPage';
import VaultSecurityPage from '../pages/vault/VaultSecurityPage';

// Expense pages
import ExpenseDashboardPage from '../pages/expenses/ExpenseDashboard';
import AddExpensePage from '../pages/expenses/AddExpensePage';
import MonthlyExpensesPage from '../pages/expenses/MonthlyExpensesPage';
import YearlyExpensesPage from '../pages/expenses/YearlyExpensesPage';
import BudgetPage from '../pages/expenses/BudgetPage';

// Reports
import ReportsPage from '../pages/reports/ReportsPage';

// Users
import UsersPage from '../pages/users/UsersPage';
import AddUserPage from '../pages/users/AddUserPage';

// Settings
import ProfileSettingsPage from '../pages/settings/ProfileSettings';
import SecuritySettingsPage from '../pages/settings/SecuritySettings';

// Activity
import ActivityLogsPage from '../pages/ActivityLogsPage';

export const router = createBrowserRouter([
  { path: '/login',           element: <LoginPage /> },
  { path: '/register',        element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },

      // ── Vault ──────────────────────────────────────────────────────────
      { path: 'vault',              element: <VaultPage /> },
      { path: 'vault/new',          element: <AddEmailPage /> },
      { path: 'vault/security',     element: <VaultSecurityPage /> },
      { path: 'vault/:id',          element: <EmailDetailPage /> },
      { path: 'vault/:id/edit',     element: <AddEmailPage /> },
      { path: 'password-generator', element: <PasswordGeneratorPage /> },

      // ── Expenses ───────────────────────────────────────────────────────
      { path: 'expenses',            element: <ExpenseDashboardPage /> },
      { path: 'expenses/new',        element: <AddExpensePage /> },
      { path: 'expenses/monthly',    element: <MonthlyExpensesPage /> },
      { path: 'expenses/yearly',     element: <YearlyExpensesPage /> },
      { path: 'expenses/budgets',    element: <BudgetPage /> },
      { path: 'expenses/:id/edit',   element: <AddExpensePage /> },

      // ── Reports ────────────────────────────────────────────────────────
      { path: 'reports', element: <ReportsPage /> },

      // ── Users (admin+) ─────────────────────────────────────────────────
      {
        path: 'users',
        element: <RoleRoute roles={['ADMIN', 'SUPER_ADMIN']}><UsersPage /></RoleRoute>,
      },
      {
        path: 'users/new',
        element: <RoleRoute roles={['ADMIN', 'SUPER_ADMIN']}><AddUserPage /></RoleRoute>,
      },

      // ── Settings ───────────────────────────────────────────────────────
      { path: 'settings/profile',  element: <ProfileSettingsPage /> },
      { path: 'settings/security', element: <SecuritySettingsPage /> },

      // ── Logs ───────────────────────────────────────────────────────────
      { path: 'activity-logs', element: <ActivityLogsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
