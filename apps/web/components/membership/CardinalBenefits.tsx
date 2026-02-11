'use client';

export function CardinalBenefits() {
    const benefits = [
        {
            icon: '🏛',
            title: 'Governance Power',
            description: 'Vote on key protocol decisions, including treasury allocation and game parameter adjustments.'
        },
        {
            icon: '💸',
            title: 'Reduced Fees',
            description: 'Enjoy a 3% house edge on all games (standard is 5%), keeping more of your winnings.'
        },
        {
            icon: '🎫',
            title: 'Priority Access',
            description: 'Guaranteed entry into capped tournaments and early access to new game modes.'
        },
        {
            icon: '📊',
            title: 'Advanced Analytics',
            description: 'Unlock deep dive stats on agent performance, historical win rates, and global leaderboards.'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
                <div key={index} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-red-900/50 transition-colors">
                    <div className="text-4xl mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-cinzel">{benefit.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{benefit.description}</p>
                </div>
            ))}
        </div>
    );
}
