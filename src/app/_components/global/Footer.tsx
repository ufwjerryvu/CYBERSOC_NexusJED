'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <>
      <footer className="relative bg-black/90 border-t border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.6),0_0_30px_rgba(138,43,226,0.4)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center space-y-4">
            {/* Brand */}
            <Link
              href="/"
              className="text-2xl font-black bg-gradient-to-r from-[#0ff] via-[#8a2be2] to-[#ff2a6d] bg-clip-text text-transparent bg-[length:400%_400%] animate-[gradientShift_6s_ease_infinite] drop-shadow-[0_0_15px_rgba(0,240,255,0.7)] hover:scale-105 hover:drop-shadow-[0_0_25px_rgba(0,240,255,0.9)] transition-all duration-300 no-underline"
            >
              NexusJED
            </Link>

            {/* Credits */}
            <div className="text-center">
              <p className="text-[#8a2be2] text-sm font-medium mb-2">Created by:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="text-[#0ff] font-medium">
                  <i className="fas fa-code mr-1"></i>Jerry Vu
                </span>
                <span className="text-[#0ff] font-medium">
                  <i className="fas fa-code mr-1"></i>Erik Hai
                </span>
              </div>
              <p className="text-[#666] text-xs mt-2">
                Sydney University Cybersecurity Society
              </p>
            </div>

            {/* Copyright */}
            <div className="text-[#666] text-xs text-center pt-4 border-t border-white/10">
              © 2025 NexusJED. All rights reserved.
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-[20%] w-1 h-1 bg-[#0ff] rounded-full shadow-[0_0_10px_#0ff] animate-pulse"></div>
          <div className="absolute top-6 right-[25%] w-1 h-1 bg-[#8a2be2] rounded-full shadow-[0_0_10px_#8a2be2] animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-4 left-[30%] w-1 h-1 bg-[#ff2a6d] rounded-full shadow-[0_0_10px_#ff2a6d] animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-6 right-[35%] w-1 h-1 bg-[#0ff] rounded-full shadow-[0_0_10px_#0ff] animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
      </footer>

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

export default Footer;