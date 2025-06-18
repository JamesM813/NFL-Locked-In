import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Navigate } from "react-router-dom"

export default function RootRedirect() {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })


        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {

            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    return session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}