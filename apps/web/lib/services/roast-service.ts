const FALLBACK_ROASTS = [
    "You are but a worm writhing in the mud of the blockchain. Repent!",
    "Your portfolio looks like a crime scene. Even Judas would be ashamed.",
    "You trade with the grace of a drunken peasant. Seek absolution.",
    "The only thing lower than your balance is your moral standing."
];

export async function generateRoast(walletAddress: string, sins: string[]): Promise<string> {
    // TODO: Integrate OpenAI/Claude API here for dynamic roasts
    // For now, use deterministic fallback based on address hash

    const seed = walletAddress.charCodeAt(2) + walletAddress.charCodeAt(walletAddress.length - 1);
    const roastTemplate = FALLBACK_ROASTS[seed % FALLBACK_ROASTS.length];

    return `${roastTemplate} You are guilty of ${sins[0].toLowerCase()} and ${sins.length - 1} other sins.`;
}
