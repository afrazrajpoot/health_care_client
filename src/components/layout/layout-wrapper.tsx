"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/navigation/sidebar';
import { cn } from '@/lib/utils';

interface LayoutWrapperProps {
    children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname();

    // Pages that should not have the sidebar
    const authPages = ['/auth/sign-in', '/auth/sign-up'];
    const isAuthPage = authPages.includes(pathname);
    const isHomePage = pathname === '/';

    // Don't show sidebar on auth pages or home page
    if (isAuthPage || isHomePage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <main className={cn(
                "flex-1 overflow-auto transition-all duration-300 bg-slate-50",
                "lg:ml-0" // Sidebar handles its own positioning
            )}>
                <div className="p-6 lg:p-8 pt-16 lg:pt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}