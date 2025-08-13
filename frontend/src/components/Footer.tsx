import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="backdrop-blur-sm bg-black/20 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white">NFL Pick 'Em</h2>
            <p className="text-gray-400 text-sm">
              The friendly competition where football knowledge meets bragging rights.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Game</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                Dashboard
              </Link>
              <Link to="/groups" className="text-gray-400 hover:text-white text-sm transition-colors">
                My Groups
              </Link>
              <Link to="/schedule" className="text-gray-400 hover:text-white text-sm transition-colors">
                NFL Schedule
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/how-to-play#faqs" className="text-gray-400 hover:text-white text-sm transition-colors">
                FAQ / Help
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact Support
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-500 text-xs">
            {currentYear} NFL Pick 'Em. Not affiliated with the NFL. Used only for non-commercial purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}