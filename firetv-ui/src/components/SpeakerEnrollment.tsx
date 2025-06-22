'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { speakerStorage } from '@/utils/storage';
import { eagleService } from '@/utils/eagle';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { SpeakerProfile, EnrollmentState } from '@/types';
import { Mic, UserPlus, RotateCcw, X } from 'lucide-react';

interface SpeakerEnrollmentProps {
  onEnrollmentComplete?: (profile: SpeakerProfile) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const SpeakerEnrollment: React.FC<SpeakerEnrollmentProps> = ({
  onEnrollmentComplete,
  onError,
  onClose,
}) => {
  const [speakerName, setSpeakerName] = useState('');
  const [enrollmentState, setEnrollmentState] = useState<EnrollmentState>({
    isEnrolling: false,
    isRecording: false,
    progress: 0,
    error: null,
    success: false,
  });

  const handleAudioData = useCallback(async (audioData: Int16Array) => {
    if (!enrollmentState.isEnrolling) {
      console.log('🔇 Ignoring audio data - not enrolling');
      return;
    }
    
    console.log('🎵 Audio data received for enrollment:', {
      length: audioData.length,
      isEnrolling: enrollmentState.isEnrolling,
      hasNonZeroSamples: audioData.some(x => x !== 0),
      audioLevel: audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length,
      maxValue: Math.max(...audioData),
      minValue: Math.min(...audioData)
    });
    
    try {
      console.log('🚀 Calling eagleService.enrollAudio...');
      const result = await eagleService.enrollAudio(audioData);
      
      console.log('📊 Enrollment progress update received:', {
        percentage: result.percentage,
        feedback: result.feedback,
        previousProgress: enrollmentState.progress
      });
      
      setEnrollmentState(prev => ({
        ...prev,
        progress: result.percentage,
        error: null,
      }));

      if (result.percentage >= 100) {
        console.log('🎯 Enrollment complete! Exporting profile...');
        await completeEnrollment();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enrollment failed';
      console.error('💥 Enrollment error:', {
        error: error,
        message: errorMessage,
        audioDataLength: audioData.length
      });
      setEnrollmentState(prev => ({
        ...prev,
        error: errorMessage,
        isEnrolling: false,
        isRecording: false,
      }));
      stopRecording();
      if (onError) onError(errorMessage);
    }
  }, [enrollmentState.isEnrolling, onError]);

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

  const completeEnrollment = useCallback(async () => {
    try {
      const voiceprint = await eagleService.exportProfile();
      
      const profile: SpeakerProfile = {
        id: `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: speakerName,
        voiceprint: voiceprint,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      await speakerStorage.saveSpeakerProfile(profile);

      setEnrollmentState(prev => ({
        ...prev,
        success: true,
        isEnrolling: false,
        isRecording: false,
      }));

      stopRecording();

      if (onEnrollmentComplete) {
        onEnrollmentComplete(profile);
      }

      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      setEnrollmentState(prev => ({
        ...prev,
        error: errorMessage,
        isEnrolling: false,
        isRecording: false,
      }));
      stopRecording();
      if (onError) onError(errorMessage);
    }
  }, [speakerName, stopRecording, onEnrollmentComplete, onError]);

  const startEnrollment = useCallback(async () => {
    if (!speakerName.trim()) {
      setEnrollmentState(prev => ({
        ...prev,
        error: 'Please enter a speaker name',
      }));
      return;
    }

    try {
      const existingProfile = await speakerStorage.getSpeakerByName(speakerName.trim());
      if (existingProfile) {
        setEnrollmentState(prev => ({
          ...prev,
          error: 'A speaker with this name already exists',
        }));
        return;
      }

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setEnrollmentState(prev => ({
          ...prev,
          error: 'Microphone permission is required for enrollment',
        }));
        return;
      }

      console.log('🎬 Starting enrollment process...');
      await eagleService.initializeProfiler();
      
      // Clear any previous audio buffer
      eagleService.clearAudioBuffer();
      
      setEnrollmentState(prev => ({
        ...prev,
        isEnrolling: true,
        isRecording: true,
        progress: 0,
        error: null,
        success: false,
      }));
      
      await startRecording();
      console.log('✅ Enrollment started successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start enrollment';
      console.error('❌ Failed to start enrollment:', error);
      setEnrollmentState(prev => ({
        ...prev,
        error: errorMessage,
        isEnrolling: false,
        isRecording: false,
      }));
      if (onError) onError(errorMessage);
    }
  }, [speakerName, requestPermission, startRecording, onError]);

  const stopEnrollment = useCallback(() => {
    setEnrollmentState(prev => ({
      ...prev,
      isEnrolling: false,
      isRecording: false,
    }));
    stopRecording();
    eagleService.resetProfiler();
  }, [stopRecording]);

  const resetForm = useCallback(() => {
    setSpeakerName('');
    setEnrollmentState({
      isEnrolling: false,
      isRecording: false,
      progress: 0,
      error: null,
      success: false,
    });
    eagleService.resetProfiler();
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
      eagleService.cleanup();
    };
  }, [cleanupAudio]);

  return (
    <div className="max-w-lg mx-auto p-8 bg-gray-900/95 rounded-2xl shadow-2xl border border-cyan-400/30 backdrop-blur-sm">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Voice Enrollment
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

      <div className="mb-6">
        <label htmlFor="speakerName" className="block text-sm font-medium text-cyan-400 mb-2">
          Your Name
        </label>
        <input
          id="speakerName"
          type="text"
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          placeholder="Enter your name"
          disabled={enrollmentState.isEnrolling}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent disabled:bg-gray-700 disabled:cursor-not-allowed text-white placeholder-gray-400 transition-colors"
        />
      </div>

      {/* {enrollmentState.isEnrolling && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-cyan-400 mb-2">
            <span>Enrollment Progress</span>
            <span className="text-orange-400 font-semibold">{enrollmentState.progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-400 to-orange-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${enrollmentState.progress}%` }}
            />
          </div>
        </div>
      )} */}

      {isRecording && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-cyan-400 mb-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Recording</span>
            </div>
            <span className="text-orange-400 font-semibold">{duration.toFixed(1)}s</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-cyan-400 h-3 rounded-full transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        {!enrollmentState.isEnrolling ? (
          <button
            onClick={startEnrollment}
            disabled={!speakerName.trim()}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
          >
            Start Enrollment
          </button>
        ) : (
          <button
            onClick={stopEnrollment}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg hover:from-red-400 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 font-semibold"
          >
            Stop Enrollment
          </button>
        )}
        
        <button
          onClick={resetForm}
          disabled={enrollmentState.isEnrolling}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {enrollmentState.error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg">
          <p className="text-sm">{enrollmentState.error}</p>
        </div>
      )}

      {audioError && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg">
          <p className="text-sm">{audioError}</p>
        </div>
      )}

      {enrollmentState.success && (
        <div className="mb-4 p-4 bg-green-900/50 border border-green-500/50 text-green-300 rounded-lg">
          <p className="text-sm">✅ Voice profile created successfully!</p>
        </div>
      )}

      <div className="text-sm text-gray-400 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <h3 className="font-medium mb-2 text-cyan-400">Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Speak clearly and slowly the below sentence</li>
          <li>Hi, my name is [Your Name], and I’m speaking this sentence so my voice can be recognized by the system. I enjoy reading, exploring new ideas, and learning about how technology works. The quick brown fox jumps over the lazy dog — a sentence that contains every letter of the alphabet. Hopefully, this gives enough variety for accurate voice recognition</li>
        </ul>
      </div>
    </div>
  );
}; 