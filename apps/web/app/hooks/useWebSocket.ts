'use client'

import { useEffect, useState, useRef } from 'react'

interface WebSocketMessage {
    type: string
    [key: string]: any
}

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false)
    const [betrayalPercentage, setBetrayalPercentage] = useState<number | null>(null)
    const [lastBetrayalEvent, setLastBetrayalEvent] = useState<{
        user: string
        timestamp: number
    } | null>(null)

    const socketRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        // Only connect if WebSocket URL is configured
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL
        if (!wsUrl) {
            console.log('WebSocket URL not configured, skipping connection')
            return
        }

        const connect = () => {
            try {
                const ws = new WebSocket(wsUrl)

                ws.onopen = () => {
                    console.log('WebSocket connected')
                    setIsConnected(true)
                }

                ws.onmessage = (event) => {
                    try {
                        const data: WebSocketMessage = JSON.parse(event.data)

                        switch (data.type) {
                            case 'BETRAYAL_UPDATE':
                                setBetrayalPercentage(data.percentage)
                                if (data.user && data.timestamp) {
                                    setLastBetrayalEvent({
                                        user: data.user,
                                        timestamp: data.timestamp,
                                    })
                                }
                                break

                            case 'EPOCH_END':
                                // Handle epoch end event
                                console.log('Epoch ended:', data)
                                break

                            default:
                                console.log('Unknown WebSocket message type:', data.type)
                        }
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error)
                    }
                }

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                }

                ws.onclose = () => {
                    console.log('WebSocket disconnected')
                    setIsConnected(false)

                    // Attempt to reconnect after 5 seconds
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...')
                        connect()
                    }, 5000)
                }

                socketRef.current = ws
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error)
            }
        }

        connect()

        // Cleanup
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (socketRef.current) {
                socketRef.current.close()
            }
        }
    }, [])

    return {
        isConnected,
        betrayalPercentage,
        lastBetrayalEvent,
    }
}
