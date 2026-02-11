interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
    onButtonClick: () => void;
    disabled?: boolean;
}

export function PricingCard({
    title,
    price,
    period,
    features,
    isPopular,
    buttonText,
    onButtonClick,
    disabled
}: PricingCardProps) {
    return (
        <div className={`relative p-8 rounded-xl border-2 flex flex-col h-full transition-transform hover:-translate-y-1
            ${isPopular
                ? 'bg-black/80 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.15)]'
                : 'bg-neutral-900/50 border-neutral-800'}`}>

            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-500 text-black font-bold text-xs uppercase tracking-widest rounded-full">
                    Most Popular
                </div>
            )}

            <div className="mb-6 text-center">
                <h3 className={`text-xl font-bold font-cinzel mb-2 ${isPopular ? 'text-yellow-500' : 'text-neutral-300'}`}>
                    {title}
                </h3>
                <div className="flex justify-center items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{price}</span>
                    <span className="text-neutral-500 text-sm">/{period}</span>
                </div>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                        <span className={`text-lg ${isPopular ? 'text-yellow-500' : 'text-neutral-500'}`}>✓</span>
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                onClick={onButtonClick}
                disabled={disabled}
                className={`w-full py-4 rounded-lg font-bold font-cinzel transition-all
                    ${isPopular
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400 shadow-lg shadow-yellow-500/20'
                        : 'bg-neutral-800 text-white hover:bg-neutral-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {buttonText}
            </button>
        </div>
    );
}
