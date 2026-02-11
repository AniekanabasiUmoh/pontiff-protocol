export function CardinalBenefits() {
    return (
        <div className="bg-neutral-900/50 border border-red-900/30 rounded-xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-red-500 mb-6 font-cinzel">Cardinal Benefits</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Benefit
                    icon="🎰"
                    title="Reduced House Edge"
                    description="Pay only 3% fees on all games instead of the standard 5%."
                />
                <Benefit
                    icon="🏆"
                    title="Priority Tournament Access"
                    description="Guaranteed entry slots in high-stakes tournaments."
                />
                <Benefit
                    icon="👁️"
                    title="God Mode Analytics"
                    description="See detailed agent performance metrics and historical data."
                />
                <Benefit
                    icon="🗳️"
                    title="Governance Rights"
                    description="Vote on protocol upgrades and new game types."
                />
                <Benefit
                    icon="💫"
                    title="Exclusive Badge"
                    description="Golden Cardinal badge on your profile and leaderboard."
                />
                <Benefit
                    icon="🎁"
                    title="Monthly Airdrops"
                    description="Receive bonus GUILT tokens based on protocol revenue."
                />
            </div>
        </div>
    );
}

function Benefit({ icon, title, description }: { icon: string, title: string, description: string }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="bg-red-900/20 p-3 rounded-lg text-2xl border border-red-900/50">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
