import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BroadsheetSpinner from './components/common/BroadsheetSpinner';

// Core Fast Eager Pages
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Heavy Lazy-Loaded Pages & Consoles (Task 126)
const CategoryArchive = lazy(() => import('./pages/CategoryArchive'));
const TagArchive = lazy(() => import('./pages/TagArchive'));
const DepartmentDirectory = lazy(() => import('./pages/DepartmentDirectory'));
const DepartmentDetail = lazy(() => import('./pages/DepartmentDetail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CircularsExplorer = lazy(() => import('./pages/CircularsExplorer'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Ethics = lazy(() => import('./pages/Ethics'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));
const CampusMap = lazy(() => import('./pages/CampusMap'));
const SubmitStory = lazy(() => import('./pages/SubmitStory'));
const Archives = lazy(() => import('./pages/Archives'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<BroadsheetSpinner />}>
        <Routes>
        {/* Public Broadsheet Routes */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        <Route
          path="/article/:slug"
          element={
            <Layout>
              <ArticleDetail />
            </Layout>
          }
        />

        <Route
          path="/news"
          element={
            <Layout>
              <CategoryArchive defaultCategory="campus-news" />
            </Layout>
          }
        />

        <Route
          path="/category/:slug"
          element={
            <Layout>
              <CategoryArchive />
            </Layout>
          }
        />

        <Route
          path="/tag/:slug"
          element={
            <Layout>
              <TagArchive />
            </Layout>
          }
        />

        <Route
          path="/departments"
          element={
            <Layout>
              <DepartmentDirectory />
            </Layout>
          }
        />

        <Route
          path="/departments/:slug"
          element={
            <Layout>
              <DepartmentDetail />
            </Layout>
          }
        />

        <Route
          path="/search"
          element={
            <Layout>
              <SearchResults />
            </Layout>
          }
        />

        <Route
          path="/circulars"
          element={
            <Layout>
              <CircularsExplorer />
            </Layout>
          }
        />

        <Route
          path="/gallery"
          element={
            <Layout>
              <Gallery />
            </Layout>
          }
        />

        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />

        <Route
          path="/about"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />

        <Route
          path="/ethics"
          element={
            <Layout>
              <Ethics />
            </Layout>
          }
        />

        <Route
          path="/unsubscribe/:token"
          element={
            <Layout>
              <Unsubscribe />
            </Layout>
          }
        />

        <Route
          path="/map"
          element={
            <Layout>
              <CampusMap />
            </Layout>
          }
        />

        <Route
          path="/submit-story"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'editor', 'reporter', 'faculty']}>
              <Layout>
                <SubmitStory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/archives"
          element={
            <Layout>
              <Archives />
            </Layout>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/superadmin/login" element={<Login />} />

        <Route
          path="/unauthorized"
          element={
            <Layout>
              <Unauthorized />
            </Layout>
          }
        />

        {/* 1. Unified Shared Admin Console (/admin): Accessible to editors & departmental staff */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'editor', 'reporter', 'faculty']}>
              <Dashboard isSuperAdmin={false} />
            </ProtectedRoute>
          }
        />

        {/* 2. Super Admin Master Governance Console (/superadmin): Exclusively for super_admin */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Dashboard isSuperAdmin={true} />
            </ProtectedRoute>
          }
        />

        {/* Legacy /dashboard alias */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'editor', 'reporter', 'faculty']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All Page */}
        <Route
          path="*"
          element={
            <Layout>
              <div className="text-center py-20 space-y-4 animate-in fade-in duration-300">
                <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold">
                  Gazette Registry Notice
                </span>
                <h2 className="text-6xl font-serif font-black text-mcc-maroon">404</h2>
                <h3 className="text-2xl font-serif font-bold text-gray-900">
                  Page Not Found in Broadsheet Archives
                </h3>
                <p className="text-sm font-serif text-gray-600 max-w-md mx-auto leading-relaxed">
                  The article, dispatch, or section you requested is either moved, archived, or does not exist in this edition of The MCC Chronicles.
                </p>
                <div className="pt-4">
                  <Link
                    to="/"
                    className="inline-block px-6 py-2.5 bg-mcc-maroon text-white font-serif uppercase tracking-wider text-xs font-bold rounded hover:bg-mcc-maroon-dark transition-colors shadow-xs"
                  >
                    Return to Front Page
                  </Link>
                </div>
              </div>
            </Layout>
          }
        />
      </Routes>
    </Suspense>
  </AuthProvider>
);
}
