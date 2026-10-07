import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import CategoryArchive from './pages/CategoryArchive';
import TagArchive from './pages/TagArchive';
import SearchResults from './pages/SearchResults';
import CircularsExplorer from './pages/CircularsExplorer';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import About from './pages/About';
import Ethics from './pages/Ethics';
import Unsubscribe from './pages/Unsubscribe';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
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

        <Route path="/login" element={<Login />} />

        <Route
          path="/unauthorized"
          element={
            <Layout>
              <Unauthorized />
            </Layout>
          }
        />

        {/* Protected Editorial Desk / Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'editor', 'reporter', 'faculty']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'editor', 'reporter', 'faculty']}>
              <Layout>
                <Dashboard />
              </Layout>
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
    </AuthProvider>
  );
}
