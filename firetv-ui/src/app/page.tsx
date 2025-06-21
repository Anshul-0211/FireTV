'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Mic, UserPlus, Search } from 'lucide-react';
import Link from 'next/link';
import { SpeakerEnrollment } from '@/components/SpeakerEnrollment';
import { SpeakerRecognition } from '@/components/SpeakerRecognition';
import { useRouter } from 'next/navigation';

type ModalType = 'enrollment' | 'recognition' | null;

export default function FireTVHome() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleEnrollmentComplete = (profile: any) => {
    console.log('✅ Voice enrollment completed for:', profile.name);
    // Show success message or update UI as needed
  };

  const handleSpeakerIdentified = (speakerName: string, confidence: number) => {
    console.log(`🎯 Speaker identified: ${speakerName} (${(confidence * 100).toFixed(1)}% confidence)`);
    
    // The SpeakerRecognition component handles redirection automatically
    // This callback is just for additional logging or UI updates if needed
  };

  const handleError = (error: string) => {
    console.error('❌ Voice recognition error:', error);
    // You can add error handling UI here, like showing a toast notification
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
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
        <div className="grid grid-cols-2 gap-16">
          {/* Profile Selection Button */}
          {/* <Link href="/anshul">
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
          </Link> */}

          {/* Voice Recognition Button */}
          <div 
            className="group cursor-pointer"
            onClick={() => setActiveModal('recognition')}
          >
            <div className="w-48 h-48 rounded-full border-4 border-cyan-400 bg-transparent hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
              <div className="text-center">
                <Search className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:text-white transition-colors" />
                <span className="text-orange-400 text-xl font-semibold group-hover:text-white transition-colors">
                  Voice<br />Recognition
                </span>
              </div>
            </div>
          </div>

          {/* Enroll a Voice Button */}
          <div 
            className="group cursor-pointer"
            onClick={() => setActiveModal('enrollment')}
          >
            <div className="w-48 h-48 rounded-full border-4 border-cyan-400 bg-transparent hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
              <div className="text-center">
                <UserPlus className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:text-white transition-colors" />
                <span className="text-orange-400 text-xl font-semibold group-hover:text-white transition-colors">
                  Enroll<br />Voice
                </span>
              </div>
            </div>
          </div>

          {/* Voice Chat Button (Future Feature) */}
          {/* <div className="group cursor-pointer opacity-60">
            <div className="w-48 h-48 rounded-full border-4 border-gray-600 bg-transparent hover:bg-gray-600/10 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
              <div className="text-center">
                <Mic className="w-12 h-12 text-gray-500 mx-auto mb-4 group-hover:text-gray-400 transition-colors" />
                <span className="text-gray-500 text-xl font-semibold group-hover:text-gray-400 transition-colors">
                  Voice Chat<br />
                  <span className="text-sm">(Coming Soon)</span>
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Optional Footer */}
      <footer className="py-4 text-center text-gray-500 text-sm border-t border-cyan-400/20">
        <p>Use voice recognition to access your personalized Fire TV profile</p>
      </footer>

      {/* Modal Overlay */}
      {activeModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {activeModal === 'enrollment' && (
              <SpeakerEnrollment
                onEnrollmentComplete={handleEnrollmentComplete}
                onError={handleError}
                onClose={closeModal}
              />
            )}
            {activeModal === 'recognition' && (
              <SpeakerRecognition
                onSpeakerIdentified={handleSpeakerIdentified}
                onError={handleError}
                onClose={closeModal}
          />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
