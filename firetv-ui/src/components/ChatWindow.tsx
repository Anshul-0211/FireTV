'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChatBubble } from './ChatBubble'
import { MovieCard } from './MovieCard'

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  singleRecommendation?: string
  tenRecommendations?: string
  conversationCount?: number
  aiResponse?: string
  isAskingQuestion?: boolean
  conversationComplete?: boolean
  userPreferences?: any
}

interface ChatWindowProps {
  onTranscription: (text: string) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
  transcription: string
  singleRecommendation: string | null
  tenRecommendations: string | null
  isLoadingRecommendation: boolean
  recommendationError: string | null
  conversationCount: number
  onClear: () => void
  conversationHistory: ChatMessage[]
  isAskingQuestion: boolean
  conversationComplete: boolean
  userPreferences: any
}

export function ChatWindow({
  onTranscription,
  isRecording,
  setIsRecording,
  transcription,
  singleRecommendation,
  tenRecommendations,
  isLoadingRecommendation,
  recommendationError,
  conversationCount,
  onClear,
  conversationHistory,
  isAskingQuestion,
  conversationComplete,
  userPreferences
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const isRecordingRef = useRef(false)
  const [isSupported, setIsSupported] = useState(false)

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true)
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // Enhanced configuration for better speech recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        console.log('Speech recognized:', finalTranscript || interimTranscript)
        
        if (finalTranscript) {
          onTranscription(finalTranscript)
        }
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          console.log('No speech detected, but continuing...')
          // Don't stop recording for no-speech errors
          return
        }
        if (event.error === 'audio-capture') {
          console.error('Microphone access denied or not available')
        }
        setIsRecording(false)
      }
      
      recognition.onend = () => {
        console.log('Speech recognition ended')
        // Auto-restart if still supposed to be recording
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            console.log('Auto-restarting speech recognition...')
            setTimeout(() => {
              if (recognitionRef.current && isRecordingRef.current) {
                recognitionRef.current.start()
              }
            }, 100)
          } catch (error) {
            console.error('Error restarting speech recognition:', error)
            setIsRecording(false)
            isRecordingRef.current = false
          }
        } else {
          setIsRecording(false)
          isRecordingRef.current = false
        }
      }
      
      recognition.onstart = () => {
        console.log('Speech recognition started')
      }
      
      recognitionRef.current = recognition
    } else {
      console.error('Web Speech API not supported')
      setIsSupported(false)
    }
  }, [onTranscription, setIsRecording])

  // Update messages when conversation history changes
  useEffect(() => {
    setMessages(conversationHistory)
  }, [conversationHistory])

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      try {
        console.log('Starting speech recognition...')
        recognitionRef.current.start()
        setIsRecording(true)
        isRecordingRef.current = true
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsRecording(false)
        isRecordingRef.current = false
      }
    }
  }, [isRecording, setIsRecording])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        console.log('Stopping speech recognition...')
        isRecordingRef.current = false
        recognitionRef.current.stop()
        setIsRecording(false)
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
        setIsRecording(false)
        isRecordingRef.current = false
      }
    }
  }, [isRecording, setIsRecording])

  const handleClear = useCallback(() => {
    setMessages([])
    onClear()
  }, [onClear])

  if (!isSupported) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex-1 flex items-center justify-center">
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
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Header - 50% Translucent and Floating */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-blue/50 backdrop-blur-sm">
        <div className="flex items-center justify-center relative">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Fire Buddy</h1>
              <p className="text-sm text-gray-400">Your Assistant for best movie recommendation. 😉</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="btn btn-secondary text-sm absolute right-0"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages - Full Height */}
      <div className="h-full overflow-y-auto p-4 pt-20 space-y-4 pb-20">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Start a Conversation</h3>
            <p className="text-gray-400">
              Tap the microphone below and tell me about movies or your mood
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              <ChatBubble 
                message={message.text} 
                isUser={message.isUser}
                timestamp={message.timestamp.toLocaleTimeString()}
              />
              
              {/* Show conversation status indicators */}
              {!message.isUser && message.isAskingQuestion && (
                <div className="mt-2 ml-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center text-blue-300 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI is asking a question - please respond
                  </div>
                </div>
              )}
              
              {!message.isUser && message.conversationComplete && (
                <div className="mt-2 ml-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center text-green-300 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Conversation complete - here are your personalized recommendations!
                  </div>
                </div>
              )}
              
              {/* Show user preferences if available */}
              {!message.isUser && message.userPreferences && (
                <div className="mt-2 ml-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-purple-300 text-sm">
                    <div className="font-semibold mb-1">Learned Preferences:</div>
                    <div className="space-y-1">
                      {message.userPreferences.genre && (
                        <div>🎭 Genre: {message.userPreferences.genre}</div>
                      )}
                      {message.userPreferences.mood && (
                        <div>😊 Mood: {message.userPreferences.mood}</div>
                      )}
                      {message.userPreferences.actors && (
                        <div>🎬 Actors: {message.userPreferences.actors}</div>
                      )}
                      {message.userPreferences.year && (
                        <div>📅 Year: {message.userPreferences.year}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show movie recommendations for AI messages */}
              {!message.isUser && message.singleRecommendation && (
                <div className="mt-4 ml-4">
                  {/* Single Recommendation - Compact */}
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                      <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Top Pick
                    </h3>
                    <div className="max-w-[200px]">
                      <MovieCard 
                        title={message.singleRecommendation} 
                        index={1} 
                        isTopRecommendation={true}
                      />
                    </div>
                  </div>
                  
                  {/* Ten Recommendations */}
                  {message.tenRecommendations && (
                    <div>
                      <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                        <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        More Recommendations
                        {message.conversationCount && message.conversationCount > 1 && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({message.conversationCount} conversations)
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-5 gap-2">
                        {message.tenRecommendations.split(',').map((movie, index) => (
                          <MovieCard 
                            key={index}
                            title={movie.trim()} 
                            index={index + 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoadingRecommendation && (
          <div className="flex items-center space-x-2 p-4 bg-gray-700/50 rounded-xl ml-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="text-gray-300">
              {isAskingQuestion ? 'Processing your response...' : 'Finding movies for you...'}
            </span>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Floating Microphone Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50 animate-pulse' 
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/50 hover:scale-110'
          }`}
        >
          <svg 
            className={`w-7 h-7 text-white ${isRecording ? 'animate-pulse' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isRecording ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>
      </div>

      {/* Status Indicators - Floating */}
      {isRecording && (
        <div className="fixed bottom-24 right-6 z-40">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-orange-300 font-medium text-sm">
                Listening...
              </p>
            </div>
          </div>
        </div>
      )}

      {isAskingQuestion && !isRecording && (
        <div className="fixed bottom-24 right-6 z-40">
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-3 py-1.5">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-blue-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-300 text-xs font-medium">
                AI asking...
              </span>
            </div>
          </div>
        </div>
      )}

      {conversationComplete && !isRecording && !isAskingQuestion && (
        <div className="fixed bottom-24 right-6 z-40">
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-3 py-1.5">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-green-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-300 text-xs font-medium">
                Complete!
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 