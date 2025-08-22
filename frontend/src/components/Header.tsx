import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Logo from '../../public/Locked-In-Small-Gray.svg'

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Groups', path: '/groups' },
    { label: 'Schedule', path: '/schedule' },
    { label: 'Profile', path: '/profile' },
    { label: 'How to Play', path: '/how-to-play' },
  ];

  return (
    <header className="backdrop-blur-sm bg-black/20 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src={Logo} alt="NFL Locked In Logo" onClick={() => navigate('/dashboard')} className="h-14 w-14 mr-2 cursor-pointer hover:opacity-80 transition" />  
            <h1 className="text-2xl font-bold text-white">
              NFL Locked In
            </h1>
          </div>

          {/* Desktop Navigation - Now shows only on large screens (1024px+) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                variant="ghost"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Button>
            ))}
            <div className="ml-4 pl-4 border-l border-white/20">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-gray-300 hover:text-red-400 hover:bg-red-500/10 font-medium"
              >
                Sign Out
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button - Now shows on medium screens and below */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                mobileMenu?.classList.toggle('hidden');
              }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Now shows on medium screens and below */}
        <div id="mobile-menu" className="hidden lg:hidden pb-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => {
                  handleNavigation(item.path);
                  document.getElementById('mobile-menu')?.classList.add('hidden');
                }}
                variant="ghost"
                className={`w-full justify-start px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Button>
            ))}
            <div className="pt-2 mt-2 border-t border-white/20">
              <Button
                onClick={() => {
                  handleSignOut();
                  document.getElementById('mobile-menu')?.classList.add('hidden');
                }}
                variant="ghost"
                className="w-full justify-start px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 font-medium"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}