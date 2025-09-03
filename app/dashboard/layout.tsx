'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  LayoutDashboard,
  FileText,
  Brain,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume Management', href: '/dashboard/resumes', icon: FileText },
  { name: 'AI Analysis', href: '/dashboard/analysis', icon: Brain },
  { name: 'Job Applications', href: '/dashboard/jobs', icon: Briefcase },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">ATS Resume Generator</h1>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-l-lg transition-colors`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5 flex-shrink-0`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="inline-block h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4">
                <h1 className="text-lg font-bold text-gray-900">ATS Resume Generator</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5 flex-shrink-0`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="inline-block h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
              <div className="w-6" /> {/* Spacer */}
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}