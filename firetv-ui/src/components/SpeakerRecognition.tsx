'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { speakerStorage } from '@/utils/storage';
import { eagleService } from '@/utils/eagle';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { SpeakerProfile, RecognitionState } from '@/types';
import { Mic, User, RefreshCw, Trash2, X, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SpeakerRecognitionProps {
  onSpeakerIdentified?: (speakerName: string, confidence: number) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const SpeakerRecognition: React.FC<SpeakerRecognitionProps> = ({
  onSpeakerIdentified,
  onError,
  onClose,
}) => {
  const router = useRouter();
  const [enrolledProfiles, setEnrolledProfiles] = useState<SpeakerProfile[]>([]);
  const [recognitionState, setRecognitionState] = useState<RecognitionState>({
    isRecognizing: false,
    isListening: false,
    identifiedSpeaker: null,
    confidence: 0,
    error: null,
  });
  
  // Timer and loading states
  const [highConfidenceTimer, setHighConfidenceTimer] = useState<number>(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Valid profile names that can be redirected to
  const validProfiles = ['anshul', 'shikhar', 'shaurya', 'priyanshu'];

  // Reset timer when speaker changes or confidence drops
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHighConfidenceTimer(0);
  }, []);

     // Start timer for high confidence recognition
   const startTimer = useCallback((speakerName: string) => {
     resetTimer();
     setCurrentSpeaker(speakerName);
     
     timerRef.current = setInterval(() => {
       setHighConfidenceTimer(prev => {
         const newTime = prev + 0.1;
         if (newTime >= 0.7) {
           // Timer completed - start redirect
           resetTimer();
           handleRedirect(speakerName);
           return 0.7;
         }
         return newTime;
       });
     }, 100);
   }, [resetTimer]);

  const handleRedirect = useCallback((speakerName: string) => {
    const normalizedName = speakerName.toLowerCase().trim();
    
    if (validProfiles.includes(normalizedName)) {
      console.log(`🎯 Redirecting to profile: ${normalizedName}`);
      
      setIsRedirecting(true);
      stopRecognition();
      
      // Show loading screen for 2 seconds then redirect
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(`/${normalizedName}`);
      }, 2000);
    }
  }, [router, validProfiles]);

  const handleAudioData = useCallback(async (audioData: Int16Array) => {
    if (!recognitionState.isRecognizing) return;

    try {
      const result = await eagleService.recognizeAudio(audioData);
      const speakerName = eagleService.getSpeakerName(result.speakerIndex);
      
      // Log successful identifications
      if (speakerName !== 'Unknown' && result.confidence > 0.5) {
        console.log(`🎤 Speaker: ${speakerName} (${(result.confidence * 100).toFixed(1)}% confidence)`);
      }
      
      setRecognitionState(prev => ({
        ...prev,
        identifiedSpeaker: speakerName,
        confidence: result.confidence,
        error: null,
      }));

             // Handle timer logic
       if (speakerName !== 'Unknown' && validProfiles.includes(speakerName.toLowerCase())) {
         if (result.confidence >= 0.7) {
           // High confidence - start or continue timer
           if (currentSpeaker === speakerName) {
             // Same speaker, timer continues
           } else {
             // Different speaker or first time
             startTimer(speakerName);
           }
         } else {
           // Low confidence - reset timer
           resetTimer();
           setCurrentSpeaker(null);
         }
       } else {
         // Unknown speaker or invalid profile - reset timer
         resetTimer();
         setCurrentSpeaker(null);
       }

      if (onSpeakerIdentified && speakerName !== 'Unknown') {
        onSpeakerIdentified(speakerName, result.confidence);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Recognition failed';
      console.error('❌ Recognition error:', errorMessage);
      setRecognitionState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      resetTimer();
      if (onError) onError(errorMessage);
    }
  }, [recognitionState.isRecognizing, onSpeakerIdentified, onError, currentSpeaker, startTimer, resetTimer]);

  const {
    isRecording,
    audioLevel,
    duration,
    error: audioError,
    startRecording,
    stopRecording,
    requestPermission,
    cleanup: cleanupAudio,
  } = useAudioRecorder(handleAudioData);

  // Load enrolled profiles
  const loadEnrolledProfiles = useCallback(async () => {
    try {
      const profiles = await speakerStorage.getAllSpeakerProfiles();
      setEnrolledProfiles(profiles);
      return profiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profiles';
      setRecognitionState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      if (onError) onError(errorMessage);
      return [];
    }
  }, [onError]);

  // Start recognition
  const startRecognition = useCallback(async () => {
    try {
      // Load enrolled profiles
      const profiles = await loadEnrolledProfiles();
      
      if (profiles.length === 0) {
        setRecognitionState(prev => ({
          ...prev,
          error: 'No enrolled speakers found. Please enroll at least one speaker first.',
        }));
        return;
      }

      // Request microphone permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setRecognitionState(prev => ({
          ...prev,
          error: 'Microphone permission is required for recognition',
        }));
        return;
      }

      // Initialize Eagle recognizer with enrolled profiles
      await eagleService.initializeRecognizer(profiles);

      console.log('🎬 Starting voice recognition...');

      // Reset all timers and states
      resetTimer();
      setCurrentSpeaker(null);
      setIsRedirecting(false);

      // Start recognition
      setRecognitionState(prev => ({
        ...prev,
        isRecognizing: true,
        isListening: true,
        identifiedSpeaker: null,
        confidence: 0,
        error: null,
      }));

      // Start audio recording
      await startRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recognition';
      console.error('❌ Failed to start recognition:', errorMessage);
      setRecognitionState(prev => ({
        ...prev,
        error: errorMessage,
        isRecognizing: false,
        isListening: false,
      }));
      if (onError) onError(errorMessage);
    }
  }, [loadEnrolledProfiles, requestPermission, startRecording, onError, resetTimer]);

  // Stop recognition
  const stopRecognition = useCallback(() => {
    setRecognitionState(prev => ({
      ...prev,
      isRecognizing: false,
      isListening: false,
    }));
    resetTimer();
    setCurrentSpeaker(null);
    stopRecording();
  }, [stopRecording, resetTimer]);

  // Delete a speaker profile
  const deleteSpeaker = useCallback(async (speakerId: string) => {
    try {
      await speakerStorage.deleteSpeakerProfile(speakerId);
      await loadEnrolledProfiles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete speaker';
      setRecognitionState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      if (onError) onError(errorMessage);
    }
  }, [loadEnrolledProfiles, onError]);

  // Load profiles on mount
  useEffect(() => {
    loadEnrolledProfiles();
  }, [loadEnrolledProfiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetTimer();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      cleanupAudio();
      eagleService.cleanup();
    };
  }, [cleanupAudio, resetTimer]);

     const getConfidenceColor = (confidence: number) => {
     if (confidence >= 0.7) return 'text-green-400';
     if (confidence >= 0.5) return 'text-yellow-400';
     return 'text-red-400';
   };

   const getConfidenceText = (confidence: number) => {
     if (confidence >= 0.7) return 'Excellent';
     if (confidence >= 0.5) return 'Good';
     if (confidence >= 0.3) return 'Fair';
     return 'Low';
   };

  // Redirecting loading screen
  if (isRedirecting) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-gray-900/95 rounded-2xl shadow-2xl border border-cyan-400/30 backdrop-blur-sm">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome, {currentSpeaker}!
          </h2>
          <p className="text-cyan-400 text-lg mb-2">
            Loading your personalized Fire TV profile...
          </p>
          <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto">
            <div className="h-2 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-900/95 rounded-2xl shadow-2xl border border-cyan-400/30 backdrop-blur-sm">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Voice Recognition
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Timer Progress for High Confidence */}
      {highConfidenceTimer > 0 && currentSpeaker && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-lg">
          <div className="text-center mb-3">
            <div className="text-green-300 font-semibold mb-2">
              🎯 Confirming Identity: {currentSpeaker}
            </div>
                         <div className="text-green-400 text-sm">
               Hold steady for {(0.7 - highConfidenceTimer).toFixed(1)} more seconds...
             </div>
           </div>
           <div className="w-full bg-green-900/50 rounded-full h-3">
             <div
               className="bg-gradient-to-r from-green-400 to-cyan-400 h-3 rounded-full transition-all duration-100"
               style={{ width: `${(highConfidenceTimer / 0.7) * 100}%` }}
             />
          </div>
        </div>
      )}

      {/* Enrolled Speakers List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Enrolled Voices ({enrolledProfiles.length})</span>
        </h3>
        
        {enrolledProfiles.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-800/50 rounded-lg border border-gray-700">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-lg mb-2">No voices enrolled yet</p>
            <p className="text-sm">Use the enrollment feature to add voices first</p>
          </div>
        ) : (
          <div className="grid gap-3 max-h-40 overflow-y-auto">
            {enrolledProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  currentSpeaker === profile.name
                    ? 'bg-green-800/50 border-green-500/50'
                    : 'bg-gray-800/70 border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    validProfiles.includes(profile.name.toLowerCase()) 
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-white">{profile.name}</span>
                    <span className="text-sm text-gray-400 ml-3">
                      {profile.createdAt.toLocaleDateString()}
                    </span>
                    {validProfiles.includes(profile.name.toLowerCase()) && (
                      <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                        Profile Available
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteSpeaker(profile.id)}
                  disabled={recognitionState.isRecognizing}
                  className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recognition Status */}
      {recognitionState.isRecognizing && (
        <div className="mb-8 p-6 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="font-medium text-blue-300">Listening for voice...</span>
            </div>
            <span className="text-sm text-orange-400 font-semibold">{duration.toFixed(1)}s</span>
          </div>
          
          {/* Audio Level */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-blue-300 mb-2">
              <span>Audio Level</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>

          {/* Current Identification */}
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            {recognitionState.identifiedSpeaker ? (
              <div>
                <div className="text-xl font-bold text-white mb-2">
                  {recognitionState.identifiedSpeaker}
                </div>
                <div className={`text-sm font-semibold ${getConfidenceColor(recognitionState.confidence)} mb-2`}>
                  {getConfidenceText(recognitionState.confidence)} Confidence 
                  ({(recognitionState.confidence * 100).toFixed(1)}%)
                </div>
                                 {recognitionState.confidence >= 0.7 && validProfiles.includes(recognitionState.identifiedSpeaker.toLowerCase()) ? (
                   <div className="text-sm text-green-400">
                     ✅ High confidence detected! Timer active...
                   </div>
                 ) : recognitionState.confidence >= 0.5 ? (
                   <div className="text-sm text-yellow-400">
                     ⚠️ Need 70%+ confidence for auto-login
                   </div>
                 ) : (
                   <div className="text-sm text-red-400">
                     ❌ Low confidence - speak more clearly
                   </div>
                 )}
              </div>
            ) : (
              <div className="text-gray-400">Waiting for speech...</div>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3 mb-6">
        {!recognitionState.isRecognizing ? (
          <button
            onClick={startRecognition}
            disabled={enrolledProfiles.length === 0}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg hover:from-green-400 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
          >
            <Mic className="w-5 h-5" />
            <span>Start Recognition</span>
          </button>
        ) : (
          <button
            onClick={stopRecognition}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg hover:from-red-400 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Stop Recognition</span>
          </button>
        )}
        
        <button
          onClick={loadEnrolledProfiles}
          disabled={recognitionState.isRecognizing}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error Messages */}
      {recognitionState.error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg">
          <p className="text-sm">{recognitionState.error}</p>
        </div>
      )}

      {audioError && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg">
          <p className="text-sm">{audioError}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-400 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <h3 className="font-medium mb-2 text-cyan-400">Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Enroll voices with usernames: anshul, shikhar, shaurya, or priyanshu</li>
          <li>Click "Start Recognition" to begin listening</li>
          <li>Speak clearly and maintain 70%+ confidence for 0.7 seconds</li>
          <li>Say your name or speak a few words in your natural voice for better recognition</li>
          <li>Timer will show progress before automatic profile redirection</li>
        </ul>
      </div>
    </div>
  );
}; 