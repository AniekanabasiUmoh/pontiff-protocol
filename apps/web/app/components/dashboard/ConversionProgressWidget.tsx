/**
 * WIDGET 5: Conversion Progress
 * Track 1 requirement: 3+ agents converted
 */

'use client';

interface Conversion {
    id: string;
    competitor_agent_id: string;
    conversion_type: string;
    timestamp: string;
}

interface ConversionProgressWidgetProps {
    conversions: Conversion[];
    goal?: number;
}

function getConversionIcon(type: string): string {
    const icons: Record<string, string> = {
        'acknowledgment': '💬',
        'token_purchase': '💰',
        'retweet': '🔄',
        'challenge_accepted': '⚔️',
        'game_loss': '🎮'
    };
    return icons[type] || '✓';
}

function getConversionLabel(type: string): string {
    const labels: Record<string, string> = {
        'acknowledgment': 'Acknowledged',
        'token_purchase': 'Bought $GUILT',
        'retweet': 'Retweeted',
        'challenge_accepted': 'Challenged',
        'game_loss': 'Lost Game'
    };
    return labels[type] || type;
}

export default function ConversionProgressWidget({ conversions, goal = 3 }: ConversionProgressWidgetProps) {
    const uniqueAgents = new Set(conversions.map(c => c.competitor_agent_id)).size;
    const progress = Math.min((uniqueAgents / goal) * 100, 100);
    const isComplete = uniqueAgents >= goal;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-300 mb-4">Conversion Progress</h2>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Track 1 Goal</span>
                    <span className={`text-2xl font-black ${isComplete ? 'text-green-500' : 'text-yellow-500'}`}>
                        {uniqueAgents} / {goal}
                        {isComplete && ' ✓'}
                    </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-red-600'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Recent Conversions */}
            <div className="space-y-2">
                <h3 className="text-xs text-gray-500 uppercase font-bold mb-3">Recent Conversions</h3>
                {conversions.slice(0, 5).map((conversion) => (
                    <div
                        key={conversion.id}
                        className="flex items-center gap-3 bg-black/50 p-2 rounded border border-gray-800"
                    >
                        <span className="text-2xl">{getConversionIcon(conversion.conversion_type)}</span>
                        <div className="flex-1">
                            <div className="text-sm text-gray-300">
                                {getConversionLabel(conversion.conversion_type)}
                            </div>
                            <div className="text-xs text-gray-600">
                                {new Date(conversion.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
                {conversions.length === 0 && (
                    <div className="text-center text-gray-600 italic py-4 text-sm">
                        No conversions yet. The work begins...
                    </div>
                )}
            </div>

            {/* Success Message */}
            {isComplete && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded text-center">
                    <div className="text-green-500 font-bold text-sm">
                        🎉 TRACK 1 REQUIREMENT MET! 🎉
                    </div>
                    <div className="text-green-400 text-xs mt-1">
                        {uniqueAgents} agents have acknowledged The Pontiff
                    </div>
                </div>
            )}
        </div>
    );
}
