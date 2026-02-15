'use client'

import { ConfessionFlow } from '@/app/components/confess/ConfessionFlow'

export default function ConfessPage() {
    return (
        <div className="min-h-screen bg-background-dark text-white flex flex-col">
            <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">
                <ConfessionFlow />
            </main>
        </div>
    )
}
