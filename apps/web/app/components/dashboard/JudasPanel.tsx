'use client'

import { DoomsdayClock } from './DoomsdayClock'
import { BetrayButton } from './BetrayButton'

interface JudasPanelProps {
    epochEndTime: number
    userHasBetrayed: boolean
    betrayalPercentage: number
    onBetray: () => Promise<void>
    onRecordOutcome: (action: 'STAKE' | 'BETRAY' | 'WITHDRAW', amount: number, tx: string) => Promise<void>
}

export function JudasPanel({
    epochEndTime,
    userHasBetrayed,
    betrayalPercentage,
    onBetray,
    onRecordOutcome,
}: JudasPanelProps) {
    const getBetrayalStatus = () => {
        if (betrayalPercentage < 33) {
            return { text: 'FAITHFUL MAJORITY', color: 'text-[#00ff00]' }
        } else if (betrayalPercentage < 66) {
            return { text: 'WAVERING FAITH', color: 'text-yellow-500' }
        } else {
            return { text: 'MASS BETRAYAL', color: 'text-red-500' }
        }
    }

    const status = getBetrayalStatus()

    return (
        <div className="bg-[#1a1a1a] border-2 border-[#8B0000] rounded-lg p-6 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
            {/* Title */}
            <h2 className="text-2xl font-bold text-[#8B0000] mb-6 font-cinzel">
                JUDAS PROTOCOL
            </h2>

            {/* Doomsday Clock */}
            <div className="mb-6">
                <DoomsdayClock epochEndTime={epochEndTime} />
            </div>

            {/* Betrayal Stats */}
            <div className="mb-6 p-4 bg-[#0a0a0a] rounded border border-[#8B0000]/30">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[#e0e0e0]/50 text-sm font-inter">Betrayal Rate</span>
                    <span className={`font-bold font-orbitron ${status.color}`}>
                        {betrayalPercentage.toFixed(1)}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#1a1a1a] rounded-full h-3 overflow-hidden border border-[#8B0000]/30">
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: `${betrayalPercentage}%`,
                            background:
                                betrayalPercentage < 33
                                    ? '#00ff00'
                                    : betrayalPercentage < 66
                                        ? '#fbbf24'
                                        : '#ff0000',
                        }}
                    />
                </div>

                {/* Status Text */}
                <p className={`text-center mt-2 font-cinzel text-sm ${status.color}`}>
                    {status.text}
                </p>
            </div>

            {/* User Status */}
            <div className="mb-6 p-4 bg-[#0a0a0a] rounded border border-[#8B0000]/30 text-center">
                <p className="text-[#e0e0e0]/50 text-xs mb-1 font-inter">Your Status</p>
                <p className={`font-bold font-cinzel ${userHasBetrayed ? 'text-red-500' : 'text-[#00ff00]'}`}>
                    {userHasBetrayed ? '💀 BETRAYER' : '🙏 FAITHFUL'}
                </p>
            </div>

            {/* Betray Button */}
            <BetrayButton
                userHasBetrayed={userHasBetrayed}
                onBetray={async () => {
                    await onBetray();
                    // In a real scenario, we'd get the tx hash from the hook, but for now we rely on the hook managing state 
                    // or we can optimistically record.
                    // Ideally the hook provides the tx hash.
                    // For MVP, we'll trigger a 'BETRAY' record on click success.
                    await onRecordOutcome('BETRAY', 0, '0x...');
                }}
            />

            {/* Info Text */}
            <div className="mt-4 p-3 bg-[#0a0a0a] rounded border border-[#8B0000]/30">
                <p className="text-[#e0e0e0]/50 text-xs font-inter leading-relaxed">
                    {userHasBetrayed ? (
                        <>
                            You have joined the betrayers. If &gt;66% betray, all stakers will suffer the{' '}
                            <span className="text-red-500 font-bold">20% Sin Tax</span>.
                        </>
                    ) : (
                        <>
                            Betray your faith to withdraw early. But beware: if &gt;66% betray, all will suffer
                            the <span className="text-red-500 font-bold">20% Sin Tax</span>.
                        </>
                    )}
                </p>
            </div>
        </div>
    )
}
