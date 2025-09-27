'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '~/contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1030] bg-gradient-to-b from-black/95 to-black/85 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.3),0_0_60px_rgba(138,43,226,0.2)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand and Main Nav */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-[1.6rem] font-[900] bg-gradient-to-r from-cyan-300 via-purple-500 to-pink-500 bg-clip-text text-transparent no-underline hover:scale-110 transition-all duration-300 bg-[length:400%_400%] animate-gradient hover:drop-shadow-[0_0_25px_rgba(0,240,255,0.8)]"
              >
                NexusJED
              </Link>
              
              {/* Desktop Navigation - Forum and Terminal */}
              <div className="hidden md:flex items-center">
                <ul className="flex items-center space-x-2 list-none m-0 p-0">
                  <li>
                    <Link 
                      href="/forum" 
                      className="relative block px-2 py-2.5 text-gray-300 font-medium tracking-wider text-sm no-underline transition-all duration-300 hover:text-cyan-300 hover:scale-105 hover:translate-y-[-2px] after:content-[''] after:absolute after:left-[10%] after:bottom-0 after:w-[80%] after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-cyan-400 after:to-transparent after:scale-x-0 after:transition-transform after:duration-500 hover:after:scale-x-100 hover:drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]"
                    >
                      Forum
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terminal" 
                      className="relative block px-2 py-2.5 text-gray-300 font-medium tracking-wider text-sm no-underline transition-all duration-300 hover:text-cyan-300 hover:scale-105 hover:translate-y-[-2px] after:content-[''] after:absolute after:left-[10%] after:bottom-0 after:w-[80%] after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-cyan-400 after:to-transparent after:scale-x-0 after:transition-transform after:duration-500 hover:after:scale-x-100 hover:drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]"
                    >
                      Terminal
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex flex-col gap-1.5 p-2 bg-transparent border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-all duration-300"
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
            >
              <span className={`block w-6 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_#00ffff] transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[8px]' : ''}`} />
              <span className={`block w-6 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_#00ffff] transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block w-6 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_#00ffff] transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[8px]' : ''}`} />
            </button>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center">
              <ul className="flex items-center space-x-2 list-none m-0 p-0">
                {!user ? (
                  <>
                    <li>
                      <Link
                        href="/register"
                        className="relative ml-4 px-6 py-2.5 text-cyan-300 font-medium tracking-wider text-sm no-underline border border-cyan-500/50 rounded-full bg-gradient-to-r from-cyan-900/20 to-purple-900/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 hover:scale-105 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.5),inset_0_0_20px_rgba(0,240,255,0.1)]"
                      >
                        <i className="fas fa-user-plus mr-2"></i>Register
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/login"
                        className="relative px-6 py-2.5 text-black font-bold tracking-wider text-sm no-underline rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,240,255,0.7),0_0_60px_rgba(138,43,226,0.5)] hover:from-cyan-300 hover:to-purple-400"
                      >
                        <i className="fas fa-sign-in-alt mr-2"></i>Login
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center space-x-3 px-4 py-2">
                      <span className="text-cyan-300 font-medium">
                        <i className="fas fa-user mr-2"></i>{user.username}
                      </span>
                      {user.isAdmin && (
                        <span className="px-2 py-1 text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded-full">
                          ADMIN
                        </span>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="relative px-6 py-2.5 text-red-300 font-medium tracking-wider text-sm border border-red-500/50 rounded-full bg-gradient-to-r from-red-900/20 to-red-900/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:scale-105 hover:border-red-400 hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>Logout
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={`${isOpen ? 'block opacity-100' : 'hidden opacity-0'} md:hidden pb-4 transition-all duration-300`}>
            <hr className="border-cyan-500/30 my-3 shadow-[0_0_10px_rgba(0,240,255,0.3)]" />
            <ul className="list-none p-0 m-0 space-y-1">
              <li>
                <Link 
                  href="/forum" 
                  className="block px-4 py-3 text-gray-300 font-medium uppercase tracking-wide text-sm no-underline transition-all duration-300 hover:text-cyan-300 hover:bg-cyan-500/10 hover:pl-6 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Forum
                </Link>
              </li>
              <li>
                <Link 
                  href="/terminal" 
                  className="block px-4 py-3 text-gray-300 font-medium uppercase tracking-wide text-sm no-underline transition-all duration-300 hover:text-cyan-300 hover:bg-cyan-500/10 hover:pl-6 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Terminal
                </Link>
              </li>
              {!user ? (
                <>
                  <li>
                    <Link
                      href="/register"
                      className="block px-4 py-3 mt-3 text-cyan-300 font-medium uppercase tracking-wide text-sm no-underline transition-all duration-300 hover:bg-cyan-500/10 hover:pl-6 rounded-lg border border-cyan-500/30"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-user-plus pr-3"></i>Register
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="block px-4 py-3 text-black font-bold uppercase tracking-wide text-sm no-underline transition-all duration-300 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-sign-in-alt pr-3"></i>Login
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="px-4 py-3 mt-3 text-cyan-300 font-medium text-sm border border-cyan-500/30 rounded-lg">
                    <i className="fas fa-user pr-3"></i>{user.username}
                    {user.isAdmin && (
                      <span className="ml-2 px-2 py-1 text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded-full">
                        ADMIN
                      </span>
                    )}
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-red-300 font-medium uppercase tracking-wide text-sm transition-all duration-300 hover:bg-red-500/10 hover:pl-6 rounded-lg border border-red-500/30"
                    >
                      <i className="fas fa-sign-out-alt pr-3"></i>Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </>
  );
};

export default Navbar;