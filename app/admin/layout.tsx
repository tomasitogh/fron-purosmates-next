import type { Metadata } from 'next';
import OneSignalSetup from '@/components/OneSignalSetup';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OneSignalSetup />
      {children}
    </>
  );
}
