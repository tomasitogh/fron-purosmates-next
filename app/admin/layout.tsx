import OneSignalSetup from '@/components/OneSignalSetup';

export default function AdminRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <OneSignalSetup />
            {children}
        </>
    );
}
