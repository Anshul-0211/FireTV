'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface WebSpeechRecorderProps {
  onTranscription: (text: string) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
}

export function WebSpeechRecorder({
  onTranscription,
  isRecording,
  setIsRecording,
}: WebSpeechRecorderProps) {
  const recognitionRef = useRef<any>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true)
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          onTranscription(finalTranscript)
        }
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }
      
      recognition.onend = () => {
        setIsRecording(false)
      }
      
      recognitionRef.current = recognition
    }
  }, [onTranscription, setIsRecording])

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }, [isRecording, setIsRecording])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording, setIsRecording])

  if (!isSupported) {
    return (
      <div className="text-center">
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-300 text-lg font-semibold mb-2">
            Browser Not Supported
          </p>
          <p className="text-red-200">
            Web Speech API is not supported in your browser.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <div 
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
            isRecording 
              ? 'bg-orange-500/20 border-4 border-orange-500 pulse-animation shadow-2xl shadow-orange-500/50' 
              : 'bg-gray-700 border-4 border-gray-600 hover:border-orange-500 hover:bg-gray-600'
          }`}
        >
          <svg 
            className={`w-16 h-16 transition-colors duration-300 ${
              isRecording ? 'text-orange-400' : 'text-gray-300'
            }`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`btn text-xl px-8 py-4 ${
          isRecording 
            ? 'btn-danger' 
            : 'btn-primary'
        }`}
      >
        <svg className={`w-6 h-6 mr-3 ${isRecording ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isRecording ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          )}
        </svg>
        {isRecording ? 'Stop Listening' : 'Start Listening'}
      </button>

      {isRecording && (
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-orange-300 font-semibold">
              Listening... Speak now!
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 