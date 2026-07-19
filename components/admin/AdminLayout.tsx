'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, Settings, LayoutDashboard, ArrowLeft } from 'lucide-react';

type AdminTab = 'products' | 'orders' | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: 'products' as AdminTab, label: 'Productos', icon: Package },
  { id: 'orders' as AdminTab, label: 'Pedidos', icon: ShoppingBag },
  { id: 'settings' as AdminTab, label: 'Ajustes', icon: Settings },
];

export default function AdminLayout({ activeTab, onTabChange, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#254642]/60 hover:text-[#254642] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Tienda
          </Link>
          <span className="text-[#254642]/30">/</span>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#254642] font-semibold tracking-wide">
              Panel de administración
            </span>
          </div>
        </div>

        {/* Panel con pestañas tipo carpeta */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
          {/* Tabs bar */}
          <nav
            className="flex items-end gap-1 px-3 sm:px-5 pt-3 border-b border-gray-300"
            role="tablist"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    relative flex shrink-0 items-center gap-2 px-3 sm:px-5 py-2.5 -mb-px
                    text-sm font-medium whitespace-nowrap rounded-t-lg rounded-b-none border transition
                    ${isActive
                      ? 'bg-white text-[#254642] border-gray-300 border-b-white z-10'
                      : 'bg-transparent text-gray-400 border-transparent hover:text-[#254642] hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 hidden min-[420px]:inline ${isActive ? 'text-[#D4AF37]' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <main className="p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
