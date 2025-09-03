'use client'

import React, { createContext, useContext } from 'react'
import type { SessionData } from '@lib/session'

export const SessionContext = createContext<SessionData | null>(null)

export function useSession() {
    return useContext(SessionContext)
}

export default function SessionProvider({ value, children }: { value: SessionData; children: React.ReactNode }) {
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
