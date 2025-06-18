import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try{
      if(isSignUp){
        if(password !== confirmPassword){
          throw new Error("Passwords do not match! Please re-enter and try again.")
        }
        const {data, error} = await supabase.auth.signUp({ 
          email,
          password
        })
        if (error) throw error
        setMessage('Successfully signed up! Please log in.')
        setIsSignUp(false)
      } else {
        const {data, error} = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        setMessage('Login in success!')
        navigate("/dashboard")
      }
    } catch (error: any){
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-green-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏈</div>
          <h1 className="text-3xl font-bold text-white mb-2">NFL Pick 'Em</h1>
          <p className="text-blue-100">Sign in to make your picks</p>

        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Create a new account' : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div>{isSignUp ? 
              <div className="space-y-2">
                <Label htmlFor='confirm-password' className='test-sm font-medium'>
                  Confirm Password
                </Label>
                <Input 
                  id='confirm-password'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Please confirm your password"
                  className='h-11'
                  required
                  />
              </div> : (<div></div>)}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a 
                href="#" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            
            <div>
              {message}
            </div>
            {/* Login Button */}
            <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={loading} onClick={handleAuth}>
              {loading ? 'Loading...': (isSignUp ? 'Sign Up' : 'Login')}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>

              <Button variant="outline" className="h-11">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.365 1.43c0 1.14-.44 2.072-1.095 2.843-.768.908-1.773 1.61-2.897 1.509-.077-1.23.395-2.34 1.05-3.094.745-.849 1.934-1.413 2.942-1.258zm5.46 17.72c-.676 1.58-1.49 3.06-2.61 4.358-1.105 1.292-2.49 2.482-4.248 2.487-1.476.005-1.947-.95-3.66-.944-1.713.006-2.22.958-3.692.952-1.757-.005-3.23-1.445-4.335-2.737C2.78 21.374.85 17.493 1.02 13.775c.104-2.257.86-4.565 2.296-6.295 1.47-1.771 3.41-2.838 5.354-2.785 1.267.032 2.468.898 3.66.91 1.165.012 2.27-.902 3.76-.884 1.308.017 2.74.688 3.775 1.856-1.473.923-2.44 2.283-2.342 4.18.108 2.144 1.442 3.414 2.486 4.056-.206.554-.432 1.097-.667 1.633z"/>
                </svg>
                Apple
              </Button>

            </div>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <Button type="button" onClick={() => setIsSignUp(!isSignUp)} className='text-sm text-white hover:underline'>
            {isSignUp ? 'Already have an account? Login' : "Don't have an account yet? Sign up"}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-200 text-sm">
          <p>This project is an independent, personal work and is not affiliated with, endorsed by, or associated with the National Football League (NFL) or any of its teams. All NFL-related names, logos, and trademarks are the property of their respective owners. This project does not use these assets for commercial purposes and is intended for educational and non-commercial use only.</p>
        </div>
      </div>
    </div>
  )
}