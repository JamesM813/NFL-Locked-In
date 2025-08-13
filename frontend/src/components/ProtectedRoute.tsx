import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { Navigate, Outlet } from "react-router-dom"
import { LoadingSpinner } from "./LoadingSpinner"

export default function ProtectedRoute(){
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getUser().then(( {data: {user}}) => {
            setUser(user)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return <LoadingSpinner />
    }
    return user ? <Outlet /> : <Navigate to='/login' />
}