/*eslist-disable*/
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Logo from '../../public/Locked-In-Small-Gray.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const processingAuth = useRef(false);

  useEffect(() => {
    //eslint-disable-next-line
    const handleAuthChange = async (session: any) => {
      // Prevent duplicate processing
      if (processingAuth.current || !session?.user) return;
      
      processingAuth.current = true;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // User doesn't exist in profiles table - new OAuth user
          console.log('Creating new profile for OAuth user');
          
          // Generate a unique username
          const baseUsername = session.user.email?.split('@')[0] || 'user';
          let uniqueUsername = baseUsername;
          let counter = 1;
          
          // Check if username exists and make it unique
          while (true) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', uniqueUsername)
              .single();
            
            if (!existingUser) break;
            uniqueUsername = `${baseUsername}${counter}`;
            counter++;
          }
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              username: uniqueUsername,
              email: session.user.email
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast.error('Error setting up your account. Please try again.');
            return;
          }
          
          console.log('Profile created successfully');
          navigate('/dashboard');
        } else if (profile) {
          // Existing user with profile
          console.log('Existing user found, navigating to dashboard');
          navigate('/dashboard');
        } else if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Error accessing your account. Please try again.');
        }
      } catch (err) {
        console.error('Auth change handling error:', err);
        toast.error('Authentication error. Please try again.');
      } finally {
        processingAuth.current = false;
      }
    };

    // Check initial session
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuthChange(session);
      }
    };

    checkInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleAuthChange(session);
        } else if (event === 'SIGNED_OUT') {
          processingAuth.current = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      processingAuth.current = false;
    };
  }, [navigate]);

  //eslint-disable-next-line
  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match!');
        }
        
        const passwordError = validatePassword(password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        // Check if username already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        if (existingUser) {
          throw new Error('Username is already taken. Please choose another.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });

        if (error) {
          console.error('Signup error:', error);
          throw new Error('Sign up failed. Please check your email and try again.');
        }

        // If user is immediately confirmed (no email verification needed)
        if (data.user && !data.user.email_confirmed_at) {
          setMessage('Successfully signed up! Check your email for a confirmation link. Be sure to check your spam folder as well.');
        }
        
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Login error:', error);
          throw new Error('Invalid email or password. Please try again.');
        }
        
        // Navigation will be handled by the auth state change listener
      }
      //eslint-disable-next-line
    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage(error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase || !hasLowerCase) {
      return "Password must contain both uppercase and lowercase letters";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };
  //eslint-disable-next-line
  const handleSocialLogin = async (provider: any) => {
    if (loading || processingAuth.current) return;
    
    try {
      setLoading(true);
      processingAuth.current = false; // Reset before OAuth
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Social login error:', err);
      toast.error('Social login failed. Please try again.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #374151',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 h-11';
  const labelStyles = 'block text-sm font-medium text-gray-300';

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 text-white">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-8">
            <img src={Logo} alt="NFL Locked In Logo" className="h-20 w-20 mb-2" />  
            <h1 className="text-3xl font-bold text-white mb-2">NFL Locked In</h1>
            <p className="text-gray-400">Sign in to make your picks</p>
          </div>

        <Card className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-white text-2xl font-semibold">{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
            <CardDescription className="text-gray-400">
              {isSignUp ? 'Create an account to get started' : 'Enter your credentials to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="email" className={labelStyles}>Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} required />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username" className={labelStyles}>Username</Label>
                  <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose your username" className={inputStyles} required />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className={labelStyles}>Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={inputStyles} required />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className={labelStyles}>Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Please confirm your password" className={inputStyles} required />
                </div>
              )}

              {!isSignUp && (
                <div className="text-right">
                  <a href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                    Forgot your password?
                  </a>
                </div>
              )}

              {message && (
                <div className={`text-center p-2 rounded-md text-sm ${message.includes('Success') ? 'text-green-300 bg-green-500/10' : 'text-red-300 bg-red-500/10'}`}>
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 h-11 text-base font-semibold rounded-xl">
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="relative top-[15px] bg-gray-900/0 px-2 text-gray-400 ">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="text-gray-400 h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-xl"
                onClick={() => handleSocialLogin('google')}
                type="button"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Loading...' : 'Google'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} className="text-sm text-gray-400 hover:text-white hover:underline bg-transparent hover:bg-transparent transition-colors">
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="text-center mt-8 text-gray-500 text-xs px-4">
          <p>This project is an independent, personal work and is not affiliated with, endorsed by, or associated with the National Football League (NFL) or any of its teams. All NFL-related names, logos, and trademarks are the property of their respective owners. This project does not use these assets for commercial purposes and is intended for educational and non-commercial use only.</p>
        </div>
      </div>
    </div>
  );
}