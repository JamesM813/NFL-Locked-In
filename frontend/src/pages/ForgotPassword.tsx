import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link!');
      }
    } catch (err: unknown) {
      setError(`An unexpected error occurred: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyles =
    'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 h-11';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">
            Enter your email and we’ll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyles}
              />
            </div>

            {error && (
              <div className="text-center p-2 rounded-md text-sm text-red-300 bg-red-500/10">
                {error}
              </div>
            )}
            {message && (
              <div className="text-center p-2 rounded-md text-sm text-green-300 bg-green-500/10">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 h-11 text-base font-semibold rounded-xl"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-400 hover:text-white hover:underline transition"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
