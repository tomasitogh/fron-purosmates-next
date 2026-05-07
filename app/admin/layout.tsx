import OneSignalSetup from '@/components/OneSignalSetup';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <OneSignalSetup />
            {children}
        </div>
    );
}
