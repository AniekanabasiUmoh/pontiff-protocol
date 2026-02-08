import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    environment: process.env.NODE_ENV,

    // Filter out errors we don't care about
    beforeSend(event, hint) {
        // Filter out network errors from wallet connections
        if (event.exception?.values?.[0]?.value?.includes('User rejected')) {
            return null
        }
        return event
    },

    // Add custom tags
    initialScope: {
        tags: {
            'app.name': 'pontiff-web',
            'app.version': process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        },
    },
})
