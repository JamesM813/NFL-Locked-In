// components/Header.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Trophy, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  ChevronDown 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-green-800 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏈</div>
            <div>
              <h1 className="text-xl font-bold">NFL Pick 'Em</h1>
              <p className="text-xs text-blue-200 hidden sm:block">Dominate Your League</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </a>
              )
            })}
          </nav>

          {/* Desktop Sign Out */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                variant="ghost"
                className="text-white hover:bg-white/10 flex items-center space-x-2"
              >
                <User size={18} />
                <span className="hidden lg:block">Account</span>
                <ChevronDown size={16} />
              </Button>
              
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-800">
                  <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span>Profile Settings</span>
                    </div>
                  </a>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    <div className="flex items-center space-x-2">
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            className="md:hidden text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </a>
                )
              })}
              <hr className="border-white/20 my-2" />
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors duration-200 text-red-300 w-full text-left"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}