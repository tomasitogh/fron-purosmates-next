'use client';

import React from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Settings,
  LayoutDashboard,
  ArrowLeft,
  Warehouse,
  Briefcase,
} from 'lucide-react';

type AdminTab = 'products' | 'orders' | 'settings' | 'stock' | 'mayorista';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: 'products' as AdminTab, label: 'Productos', icon: Package },
  { id: 'orders' as AdminTab, label: 'Pedidos', icon: ShoppingBag },
  { id: 'stock' as AdminTab, label: 'Stock', icon: Warehouse },
  { id: 'mayorista' as AdminTab, label: 'Mayorista', icon: Briefcase },
  { id: 'settings' as AdminTab, label: 'Ajustes', icon: Settings },
];

export default function AdminLayout({ activeTab, onTabChange, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#254642]/60 transition hover:text-[#254642]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tienda
          </Link>
          <span className="text-[#254642]/30">/</span>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-[#D4AF37]" />
            <span className="font-semibold tracking-wide text-[#254642]">
              Panel de administración
            </span>
          </div>
        </div>

        {/* Panel con pestañas tipo carpeta */}
        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
          {/* Tabs bar */}
          <nav
            className="flex items-end gap-1 border-b border-gray-300 px-3 pt-3 sm:px-5"
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
                  className={`relative -mb-px flex shrink-0 items-center gap-2 rounded-t-lg rounded-b-none border px-3 py-2.5 text-sm font-medium whitespace-nowrap transition sm:px-5 ${
                    isActive
                      ? 'z-10 border-gray-300 border-b-white bg-white text-[#254642]'
                      : 'border-transparent bg-transparent text-gray-400 hover:bg-gray-50 hover:text-[#254642]'
                  } `}
                >
                  <Icon
                    className={`hidden h-4 w-4 min-[420px]:inline ${isActive ? 'text-[#D4AF37]' : ''}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
