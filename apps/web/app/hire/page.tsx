'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HireRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/agents?tab=deploy'); }, [router]);
    return null;
}
