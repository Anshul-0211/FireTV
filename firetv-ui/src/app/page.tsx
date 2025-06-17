'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Mic } from 'lucide-react';
import Link from 'next/link';

export default function FireTVHome() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center py-8 border-b border-cyan-400/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">🔥</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Fire TV</h1>
        </div>
      </header>

      {/* Main Content - Centered Buttons */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center gap-16">
          {/* Profile Selection Button */}
          <Link href="/anshul">
            <div className="group cursor-pointer">
              <div className="w-48 h-48 rounded-full border-4 border-cyan-400 bg-transparent hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
                <div className="text-center">
                  <Users className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:text-white transition-colors" />
                  <span className="text-orange-400 text-xl font-semibold group-hover:text-white transition-colors">
                    Profile<br />Selection
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Enroll a Voice Button */}
          <div className="group cursor-pointer">
            <div className="w-48 h-48 rounded-full border-4 border-cyan-400 bg-transparent hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
              <div className="text-center">
                <Mic className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:text-white transition-colors" />
                <span className="text-orange-400 text-xl font-semibold group-hover:text-white transition-colors">
                  Enroll<br />a Voice
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Footer */}
      <footer className="py-4 text-center text-gray-500 text-sm border-t border-cyan-400/20">
        <p>Select an option to continue</p>
      </footer>
    </div>
  );
}
