import { isAddress } from 'viem';

export const VALIDATION_LIMITS = {
    MAX_CONFESSION_LENGTH: 500,
    MAX_WAGER: 1_000_000,
    MIN_WAGER: 0.1,
    MAX_STRATEGY_LENGTH: 50,
    UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const validators = {
    wallet: (address: any, fieldName = 'walletAddress'): string => {
        if (!address || typeof address !== 'string') {
            throw new ValidationError('Wallet address is missing or invalid type', fieldName);
        }
        if (!isAddress(address)) {
            throw new ValidationError('Invalid Ethereum address format', fieldName);
        }
        return address.toLowerCase();
    },

    uuid: (id: any, fieldName = 'id'): string => {
        if (!id || typeof id !== 'string') {
            throw new ValidationError('ID is missing or invalid type', fieldName);
        }
        if (!VALIDATION_LIMITS.UUID_REGEX.test(id)) {
            throw new ValidationError('Invalid UUID format', fieldName);
        }
        return id;
    },

    amount: (amount: any, fieldName = 'amount', min = 0, max = Infinity): string => {
        if (amount === undefined || amount === null) {
            throw new ValidationError('Amount is required', fieldName);
        }
        const num = Number(amount);
        if (isNaN(num)) {
            throw new ValidationError('Amount must be a valid number', fieldName);
        }
        if (num < min) {
            throw new ValidationError(`Amount must be at least ${min}`, fieldName);
        }
        if (num > max) {
            throw new ValidationError(`Amount cannot exceed ${max}`, fieldName);
        }
        // Return as approved number string for consistency or number? 
        // Most of our app uses strings for token amounts, but let's keep it flexible.
        // Returning string to match common input types.
        return amount.toString();
    },

    string: (text: any, fieldName = 'text', maxLength = 1000, required = true): string => {
        if (!text && required) {
            throw new ValidationError(`${fieldName} is required`, fieldName);
        }
        if (!text) return '';

        const sanitized = String(text).trim();
        if (sanitized.length > maxLength) {
            throw new ValidationError(`${fieldName} exceeds maximum length of ${maxLength}`, fieldName);
        }
        return sanitized;
    }
};
