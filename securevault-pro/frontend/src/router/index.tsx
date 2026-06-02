import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';

function RouteErrorBoundary() {
  const err = useRouteError() as any;
  const msg =
    typeof err?.message    === 'string' ? err.message    :
    typeof err?.statusText === 'string' ? err.statusText :
    'An unexpected error occurred.';
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl select-none">⚠️</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 mb-6">{msg}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Refresh page
          </button>
          <button onClick={() => { window.location.href = '/login'; }}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
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
import NotificationsPage from '../pages/NotificationsPage';

export const router = createBrowserRouter([
  { path: '/login',           element: <LoginPage />,          errorElement: <RouteErrorBoundary /> },
  { path: '/register',        element: <RegisterPage />,       errorElement: <RouteErrorBoundary /> },
  { path: '/forgot-password', element: <ForgotPasswordPage />, errorElement: <RouteErrorBoundary /> },
  { path: '/reset-password',  element: <ResetPasswordPage />,  errorElement: <RouteErrorBoundary /> },
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
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

      // ── Logs / Notifications ───────────────────────────────────────────
      { path: 'activity-logs', element: <ActivityLogsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
