import { useCallback, useEffect, useRef } from 'react';

/**
 * Module 15: Sound Effects Hook
 *
 * Provides audio feedback for game events
 * - Preloads sound files
 * - Volume control
 * - Mute/unmute functionality
 */

type SoundEffect =
    | 'win'
    | 'loss'
    | 'draw'
    | 'coin'
    | 'chant'
    | 'bell'
    | 'card-flip'
    | 'dice-roll';

interface SoundConfig {
    volume?: number;
    muted?: boolean;
}

// Sound file paths (relative to /public/sounds/)
const SOUND_PATHS: Record<SoundEffect, string> = {
    win: '/sounds/win.mp3',
    loss: '/sounds/loss.mp3',
    draw: '/sounds/draw.mp3',
    coin: '/sounds/coin.mp3',
    chant: '/sounds/latin-chant.mp3',
    bell: '/sounds/church-bell.mp3',
    'card-flip': '/sounds/card-flip.mp3',
    'dice-roll': '/sounds/dice-roll.mp3'
};

export function useSoundEffects(config: SoundConfig = {}) {
    const { volume = 0.5, muted = false } = config;

    const audioCache = useRef<Map<SoundEffect, HTMLAudioElement>>(new Map());
    const volumeRef = useRef(volume);
    const mutedRef = useRef(muted);

    // Preload all sound effects
    useEffect(() => {
        Object.entries(SOUND_PATHS).forEach(([effect, path]) => {
            if (!audioCache.current.has(effect as SoundEffect)) {
                const audio = new Audio(path);
                audio.volume = volumeRef.current;
                audio.preload = 'auto';
                audioCache.current.set(effect as SoundEffect, audio);
            }
        });
    }, []);

    // Update volume when config changes
    useEffect(() => {
        volumeRef.current = volume;
        audioCache.current.forEach(audio => {
            audio.volume = volume;
        });
    }, [volume]);

    // Update muted state
    useEffect(() => {
        mutedRef.current = muted;
    }, [muted]);

    /**
     * Play a sound effect
     */
    const play = useCallback((effect: SoundEffect, options?: { volume?: number; loop?: boolean }) => {
        if (mutedRef.current) return;

        const audio = audioCache.current.get(effect);
        if (!audio) {
            console.warn(`Sound effect "${effect}" not found`);
            return;
        }

        // Clone audio for overlapping sounds
        const audioClone = audio.cloneNode() as HTMLAudioElement;
        audioClone.volume = options?.volume ?? volumeRef.current;
        audioClone.loop = options?.loop ?? false;

        audioClone.play().catch(error => {
            console.warn(`Failed to play sound "${effect}":`, error);
        });

        // Clean up after playback
        if (!audioClone.loop) {
            audioClone.addEventListener('ended', () => {
                audioClone.remove();
            });
        }

        return audioClone;
    }, []);

    /**
     * Stop all playing sounds
     */
    const stopAll = useCallback(() => {
        audioCache.current.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }, []);

    /**
     * Preload a specific sound
     */
    const preload = useCallback((effect: SoundEffect) => {
        const audio = audioCache.current.get(effect);
        if (audio) {
            audio.load();
        }
    }, []);

    return {
        play,
        stopAll,
        preload,
        sounds: {
            win: () => play('win'),
            loss: () => play('loss'),
            draw: () => play('draw'),
            coin: () => play('coin'),
            chant: (loop = false) => play('chant', { loop }),
            bell: () => play('bell'),
            cardFlip: () => play('card-flip'),
            diceRoll: () => play('dice-roll')
        }
    };
}

/**
 * Example usage:
 *
 * const { sounds } = useSoundEffects({ volume: 0.7 });
 *
 * // Play win sound
 * sounds.win();
 *
 * // Play looping chant
 * const chantAudio = sounds.chant(true);
 * // Stop it later
 * chantAudio?.pause();
 */
