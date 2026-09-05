'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Settings,
  LayoutDashboard,
  ArrowLeft,
  Warehouse,
  Briefcase,
  Menu,
  X,
  CalendarDays,
} from 'lucide-react';

type AdminTab = 'products' | 'orders' | 'settings' | 'stock' | 'mayorista' | 'calendar';

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
  { id: 'calendar' as AdminTab, label: 'Calendario', icon: CalendarDays },
  { id: 'settings' as AdminTab, label: 'Ajustes', icon: Settings },
];

export default function AdminLayout({ activeTab, onTabChange, children }: AdminLayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const activeTabInfo = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const handleSelectTab = (tab: AdminTab) => {
    onTabChange(tab);
    setIsNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Barra superior mobile con acceso al menú lateral */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm md:hidden">
        <div className="flex h-14 items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            className="rounded-lg p-2 text-[#254642] transition hover:bg-gray-100"
            aria-label="Abrir menú de administración"
            aria-expanded={isNavOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4 shrink-0 text-[#D4AF37]" />
            <span className="truncate text-sm font-semibold tracking-wide text-[#254642]">
              {activeTabInfo.label}
            </span>
          </div>
        </div>
      </header>

      {/* Fondo oscurecido del drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsNavOpen(false)}
        aria-hidden="true"
      />

      {/* Menú lateral mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col bg-[#254642] shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isNavOpen}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-sm font-bold tracking-wide text-[#F5F5DC]">
              Panel de administración
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="rounded-lg p-1.5 text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-[#F5F5DC] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 text-[#D4AF37]" />
            Volver a la tienda
          </Link>
        </div>
      </aside>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* Breadcrumb desktop */}
        <div className="mb-4 hidden items-center gap-2 text-sm md:flex">
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

        {/* Tabs tipo carpeta desktop */}
        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
          <nav
            className="hidden items-end gap-1 overflow-x-auto border-b border-gray-300 px-3 pt-3 sm:px-5 md:flex"
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
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Contenido */}
          <main className="p-3 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
