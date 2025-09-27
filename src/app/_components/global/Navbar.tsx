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
      <nav className="fixed top-0 left-0 right-0 z-[1030] bg-black/85 border-b border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.6),0_0_30px_rgba(138,43,226,0.4)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-[1.6rem] font-[900] bg-gradient-to-r from-[#0ff] via-[#8a2be2] to-[#ff2a6d] bg-clip-text text-transparent bg-[length:400%_400%] animate-[gradientShift_6s_ease_infinite] drop-shadow-[0_0_15px_rgba(0,240,255,0.7)] hover:scale-105 hover:drop-shadow-[0_0_25px_rgba(0,240,255,0.9)] transition-all duration-300 no-underline"
              >
                NexusJED
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center">
                <ul className="flex items-center space-x-1 list-none m-0 p-0">
                  <li>
                    <Link
                      href="/forum"
                      className="relative inline-block px-3 py-2 text-[#bbb] font-medium text-sm no-underline transition-all duration-300 hover:text-[#0ff] hover:scale-105 hover:[text-shadow:0_0_8px_#0ff,0_0_20px_#8a2be2] after:content-[''] after:absolute after:left-0 after:bottom-[2px] after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#0ff] after:to-[#8a2be2] after:transition-[width] after:duration-[0.4s] after:ease hover:after:w-full"
                    >
                      <i className="fas fa-comments mr-2"></i>Forum
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terminal"
                      className="relative inline-block px-3 py-2 text-[#bbb] font-medium text-sm no-underline transition-all duration-300 hover:text-[#0ff] hover:scale-105 hover:[text-shadow:0_0_8px_#0ff,0_0_20px_#8a2be2] after:content-[''] after:absolute after:left-0 after:bottom-[2px] after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#0ff] after:to-[#8a2be2] after:transition-[width] after:duration-[0.4s] after:ease hover:after:w-full"
                    >
                      <i className="fas fa-terminal mr-2"></i>Terminal
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://nexusctf.usydcyber.com/challenges"
                      className="relative inline-block px-3 py-2 text-[#bbb] font-medium text-sm no-underline transition-all duration-300 hover:text-[#0ff] hover:scale-105 hover:[text-shadow:0_0_8px_#0ff,0_0_20px_#8a2be2] after:content-[''] after:absolute after:left-0 after:bottom-[2px] after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#0ff] after:to-[#8a2be2] after:transition-[width] after:duration-[0.4s] after:ease hover:after:w-full"
                      target="_blank"
                    >
                      <i className="fas fa-flag mr-2"></i>Challenges
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex flex-col gap-1 p-1.5 bg-transparent border-none"
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
            >
              <span className={`w-6 h-[3px] bg-[#0ff] shadow-[0_0_8px_#0ff] transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></span>
              <span className={`w-6 h-[3px] bg-[#0ff] shadow-[0_0_8px_#0ff] transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-[3px] bg-[#0ff] shadow-[0_0_8px_#0ff] transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[8px]' : ''}`}></span>
            </button>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center">
              <ul className="flex items-center space-x-2 list-none m-0 p-0">
                {!user ? (
                  <>
                    <li>
                      <Link
                        href="/register"
                        className="relative inline-block px-4 py-2 ml-2 text-[#bbb] font-medium text-sm no-underline border border-[rgba(0,240,255,0.5)] rounded-full bg-[rgba(0,240,255,0.1)] transition-all duration-300 hover:text-[#0ff] hover:bg-[rgba(0,240,255,0.2)] hover:border-[#0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:scale-105"
                      >
                        <i className="fas fa-user-plus mr-2"></i>Register
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/login"
                        className="relative inline-block px-4 py-2 text-black font-bold text-sm no-underline border border-[#8a2be2] rounded-full bg-gradient-to-r from-[#0ff] to-[#8a2be2] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,240,255,0.7),0_0_60px_rgba(138,43,226,0.5)]"
                      >
                        <i className="fas fa-sign-in-alt mr-2"></i>Login
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center space-x-3 px-4 py-2">
                      <span className="text-[#0ff] font-medium">
                        <i className="fas fa-user mr-2"></i>{user.username}
                      </span>
                      {user.isAdmin && (
                        <span className="px-2 py-1 text-xs font-bold text-[#8a2be2] bg-[rgba(138,43,226,0.2)] border border-[rgba(138,43,226,0.5)] rounded-full">
                          ADMIN
                        </span>
                      )}
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="relative inline-block px-4 py-2 text-[#ff2a6d] font-medium text-sm border border-[rgba(255,42,109,0.5)] rounded-full bg-[rgba(255,42,109,0.1)] transition-all duration-300 hover:bg-[rgba(255,42,109,0.2)] hover:border-[#ff2a6d] hover:shadow-[0_0_20px_rgba(255,42,109,0.5)] hover:scale-105"
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
          <div className={`${isOpen ? 'block' : 'hidden'} md:hidden pb-4`}>
            <hr className="border-white/20 my-3" />
            <ul className="list-none p-0 m-0 space-y-1">
              <li>
                <Link
                  href="/forum"
                  className="block px-4 py-3 mx-1 text-[#bbb] font-medium text-sm no-underline rounded-lg transition-all duration-300 hover:text-[#0ff] hover:bg-[rgba(0,240,255,0.1)] hover:pl-6"
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-comments mr-2"></i>Forum
                </Link>
              </li>
              <li>
                <Link
                  href="/terminal"
                  className="block px-4 py-3 mx-1 text-[#bbb] font-medium text-sm no-underline rounded-lg transition-all duration-300 hover:text-[#0ff] hover:bg-[rgba(0,240,255,0.1)] hover:pl-6"
                  onClick={() => setIsOpen(false)}
                >
                  <i className="fas fa-terminal mr-2"></i>Terminal
                </Link>
              </li>
              <li>
                <Link
                  href="https://nexusctf.usydcyber.com/challenges"
                  className="block px-4 py-3 mx-1 text-[#bbb] font-medium text-sm no-underline rounded-lg transition-all duration-300 hover:text-[#0ff] hover:bg-[rgba(0,240,255,0.1)] hover:pl-6"
                  onClick={() => setIsOpen(false)}
                  target="_blank"
                >
                  <i className="fas fa-flag mr-2"></i>Challenges
                </Link>
              </li>
              {!user ? (
                <>
                  <li>
                    <Link
                      href="/register"
                      className="block px-4 py-3 mx-1 mt-3 text-[#0ff] font-medium text-sm no-underline border border-[rgba(0,240,255,0.5)] rounded-lg bg-[rgba(0,240,255,0.1)] transition-all duration-300 hover:bg-[rgba(0,240,255,0.2)] hover:pl-6"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-user-plus mr-2"></i>Register
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="block px-4 py-3 mx-1 text-black font-bold text-sm no-underline rounded-lg bg-gradient-to-r from-[#0ff] to-[#8a2be2] transition-all duration-300"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-sign-in-alt mr-2"></i>Login
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="px-4 py-3 mx-1 mt-3 text-[#0ff] font-medium text-sm border border-white/20 rounded-lg">
                    <i className="fas fa-user mr-2"></i>{user.username}
                    {user.isAdmin && (
                      <span className="ml-2 px-2 py-1 text-xs font-bold text-[#8a2be2] bg-[rgba(138,43,226,0.2)] border border-[rgba(138,43,226,0.5)] rounded-full">
                        ADMIN
                      </span>
                    )}
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 mx-1 text-[#ff2a6d] font-medium text-sm border border-[rgba(255,42,109,0.5)] rounded-lg bg-[rgba(255,42,109,0.1)] transition-all duration-300 hover:bg-[rgba(255,42,109,0.2)] hover:pl-6"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
};

export default Navbar;