import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Compass,
  Database,
  FileSpreadsheet,
  History,
  Info,
  LogIn,
  LogOut,
  Menu,
  Radar,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PageId } from '../types/monitoring';

interface LayoutShellProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  user: User | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  isFirestoreSynced: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'map', label: 'Explore India Map', icon: Compass },
  { id: 'directory', label: 'Waterbody Directory', icon: Database },
  { id: 'historical', label: 'Historical Monitoring', icon: History },
  { id: 'satellite', label: 'Satellite Analysis', icon: Radar },
  { id: 'alerts', label: 'Drought Alerts', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'about', label: 'About', icon: BookOpen },
];

export function LayoutShell({
  activePage,
  onNavigate,
  user,
  authLoading,
  onSignIn,
  onSignOut,
  isFirestoreSynced,
  children,
}: LayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectPage = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070D17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 h-14 bg-[#0B1322]/95 backdrop-blur border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPage('dashboard')}
            className="text-base sm:text-lg font-display font-bold tracking-tight text-slate-100 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            GHOST SHORELINE
          </button>
        </div>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => handleSelectPage('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activePage === 'dashboard'
                ? 'text-cyan-300 underline underline-offset-8 decoration-cyan-400'
                : 'hover:text-slate-100'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => handleSelectPage('map')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activePage === 'map'
                ? 'text-cyan-300 underline underline-offset-8 decoration-cyan-400'
                : 'hover:text-slate-100'
            }`}
          >
            India Map
          </button>
          <button
            type="button"
            onClick={() => handleSelectPage('directory')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activePage === 'directory'
                ? 'text-cyan-300 underline underline-offset-8 decoration-cyan-400'
                : 'hover:text-slate-100'
            }`}
          >
            Directory
          </button>
          <button
            type="button"
            onClick={() => handleSelectPage('alerts')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activePage === 'alerts'
                ? 'text-cyan-300 underline underline-offset-8 decoration-cyan-400'
                : 'hover:text-slate-100'
            }`}
          >
            Drought Alerts
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {authLoading ? (
            <span className="text-xs text-slate-400 whitespace-nowrap">Checking session...</span>
          ) : user ? (
            <button
              type="button"
              onClick={onSignOut}
              title={`Signed in as ${user.email || user.displayName}`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-[#0F1A2E] text-xs font-medium text-slate-200 hover:border-cyan-500/60 hover:text-cyan-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="max-w-[140px] truncate">{user.displayName || user.email}</span>
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 bg-[#0B1322] border-r border-slate-800/80 py-5 px-3 justify-between">
          <div className="space-y-1">
            <p className="px-3 pb-2 text-xs font-medium text-slate-400">
              Monitoring Modules
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-3 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
            <p className="font-medium text-slate-300">Data Transparency</p>
            <p className="leading-relaxed">
              {isFirestoreSynced
                ? 'Cloud workspace active via Firebase Firestore. Sample records remain labeled DEMO.'
                : 'Viewing curated DEMO reference dataset. Satellite APIs are not connected.'}
            </p>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/75"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-[#0B1322] border-r border-slate-800 p-4 flex flex-col justify-between z-10">
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                  <span className="font-display font-bold text-sm text-slate-100">
                    GHOST SHORELINE
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 pt-4 border-t border-slate-800">
                India&apos;s Vanishing Lakes &amp; Ponds Monitoring System · DEMO DATA
              </p>
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Honest Scientific Notice Subheader */}
          <div className="bg-[#0B1322] border-b border-slate-800/80 px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong className="font-semibold text-cyan-300">DEMO DATA:</strong> Initial statistics, charts, and shoreline extents are sample reference values. Live satellite APIs are not connected yet.
              </span>
            </div>
            <span className="font-mono text-slate-400">
              {isFirestoreSynced ? 'Firestore Workspace Synced' : 'Local Reference Mode'}
            </span>
          </div>

          <div className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto">
            {children}
          </div>

          <footer className="border-t border-slate-800/80 px-4 lg:px-8 py-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <span>
              GHOST SHORELINE — India&apos;s Vanishing Lakes &amp; Ponds Monitoring System
            </span>
            <span>
              Periodic satellite monitoring reference platform · Sample figures labeled DEMO
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
