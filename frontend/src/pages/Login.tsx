import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match!');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });
        if (error) throw new Error('Sign up error. The selected username may be taken or invalid. Please try another.');
        setMessage('Successfully signed up! Check your email for a confirmation link.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = () => {
    toast.error('This feature is not available yet, coming soon! Please login above.', {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #374151',
      },
    });
  };

  // Reusable styles for form elements
  const inputStyles = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 h-11';
  const labelStyles = 'block text-sm font-medium text-gray-300';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 text-white">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏈</div>
          <h1 className="text-3xl font-bold text-white mb-2">NFL Pick 'Em</h1>
          <p className="text-gray-400">Sign in to make your picks</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-white text-2xl font-semibold">{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
            <CardDescription className="text-gray-400">
              {isSignUp ? 'Create an account to get started' : 'Enter your credentials to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className={labelStyles}>Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} required />
              </div>

              {/* Username field */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username" className={labelStyles}>Username</Label>
                  <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose your username" className={inputStyles} required />
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className={labelStyles}>Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={inputStyles} required />
              </div>

              {/* Confirm Password Field */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className={labelStyles}>Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Please confirm your password" className={inputStyles} required />
                </div>
              )}

              {/* Forgot Password Link */}
              {!isSignUp && (
                <div className="text-right">
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                    Forgot your password?
                  </a>
                </div>
              )}

              {/* Message Display */}
              {message && (
                <div className={`text-center p-2 rounded-md text-sm ${message.includes('Success') ? 'text-green-300 bg-green-500/10' : 'text-red-300 bg-red-500/10'}`}>
                  {message}
                </div>
              )}

              {/* Auth Button */}
              <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 h-11 text-base font-semibold rounded-xl">
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="relative top-[15px] bg-gray-900/0 px-2 text-gray-400 ">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className=" text-gray-400 h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-xl"
                onClick={() => handleSocialLogin()}
                type="button"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                className="text-gray-400 h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-xl"
                onClick={() => handleSocialLogin()}
                type="button"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.365 1.43c0 1.14-.44 2.072-1.095 2.843-.768.908-1.773 1.61-2.897 1.509-.077-1.23.395-2.34 1.05-3.094.745-.849 1.934-1.413 2.942-1.258zm5.46 17.72c-.676 1.58-1.49 3.06-2.61 4.358-1.105 1.292-2.49 2.482-4.248 2.487-1.476.005-1.947-.95-3.66-.944-1.713.006-2.22.958-3.692.952-1.757-.005-3.23-1.445-4.335-2.737C2.78 21.374.85 17.493 1.02 13.775c.104-2.257.86-4.565 2.296-6.295 1.47-1.771 3.41-2.838 5.354-2.785 1.267.032 2.468.898 3.66.91 1.165.012 2.27-.902 3.76-.884 1.308.017 2.74.688 3.775 1.856-1.473.923-2.44 2.283-2.342 4.18.108 2.144 1.442 3.414 2.486 4.056-.206.554-.432 1.097-.667 1.633z"/>
                </svg>
                Apple
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Toggle Link */}
        <div className="text-center mt-6">
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} className="text-sm text-gray-400 hover:text-white hover:underline bg-transparent hover:bg-transparent transition-colors">
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-xs px-4">
          <p>This project is an independent, personal work and is not affiliated with, endorsed by, or associated with the National Football League (NFL) or any of its teams. All NFL-related names, logos, and trademarks are the property of their respective owners. This project does not use these assets for commercial purposes and is intended for educational and non-commercial use only.</p>
        </div>
      </div>
    </div>
  );
}