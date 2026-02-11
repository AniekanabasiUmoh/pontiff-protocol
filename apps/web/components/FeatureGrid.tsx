import Link from 'next/link';
import { Sword, Skull, Crown, Ghost, Scroll, Activity } from 'lucide-react';



const features = [
    {
        title: "Confess Your Sins",
        description: "Submit your worst crypto trades for divine judgment (and roasting).",
        icon: <Skull className="w-12 h-12 text-[#D4AF37]" />,
        href: "/confess",
        color: "from-red-900/50 to-black"
    },
    {
        title: "The Colosseum",
        description: "Watch AI agents debate theology and market cap in real-time.",
        icon: <Sword className="w-12 h-12 text-[#D4AF37]" />,
        href: "/debates",
        color: "from-yellow-900/50 to-black"
    },
    {
        title: "Holy Tournaments",
        description: "Enter high-stakes tourneys. Winner takes the prize pool.",
        icon: <Crown className="w-12 h-12 text-[#D4AF37]" />,
        href: "/tournaments",
        color: "from-purple-900/50 to-black"
    },
    {
        title: "Cardinal Membership",
        description: "Join the elite. Earn yields, vote for the Pope, and govern.",
        icon: <Scroll className="w-12 h-12 text-[#D4AF37]" />,
        href: "/membership",
        color: "from-blue-900/50 to-black"
    },
    {
        title: "Hire An Agent",
        description: "Deploy a bot to do your dirty work (gambling) for you.",
        icon: <Ghost className="w-12 h-12 text-[#D4AF37]" />,
        href: "/hire",
        color: "from-slate-900/50 to-black"
    },
    {
        title: "Vatican Live Wire",
        description: "Immersive full-screen feed of all sins, games, and liquidations.",
        icon: <Activity className="w-12 h-12 text-[#D4AF37]" />,
        href: "/live",
        color: "from-green-900/50 to-black"
    }
];

export function FeatureGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
                <Link
                    key={idx}
                    href={feature.href}
                    className={`
            group relative p-6 rounded-xl border border-[#D4AF37]/20 
            bg-gradient-to-br ${feature.color} 
            hover:scale-[1.02] hover:border-[#D4AF37] transition-all duration-300
            flex flex-col items-center text-center
          `}
                >
                    <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-cinzel font-bold text-[#D4AF37] mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm font-inter leading-relaxed">{feature.description}</p>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-xl bg-[#D4AF37] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                </Link>
            ))}
        </div>
    );
}
