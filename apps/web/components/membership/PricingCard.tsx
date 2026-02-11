'use client';

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
        <div className={`relative bg-neutral-900 border ${isPopular ? 'border-red-600' : 'border-neutral-800'} rounded-xl p-8 overflow-hidden`}>
            {isPopular && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST HOLY
                </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-2 font-cinzel">{title}</h3>
            <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-white">{price}</span>
                <span className="text-neutral-400 ml-2">GUILT / {period}</span>
            </div>

            <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-neutral-300 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onButtonClick}
                disabled={disabled}
                className={`w-full py-3 rounded-lg font-bold transition-all
          ${disabled
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-red-700 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(220,20,60,0.4)]'}`}
            >
                {buttonText}
            </button>
        </div>
    );
}
