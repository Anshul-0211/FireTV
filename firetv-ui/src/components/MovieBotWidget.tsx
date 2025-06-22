'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X,
  Bot,
  Mic,
  MicOff,
  Send,
  User,
  Trash2
} from 'lucide-react';
import { ChatBubble } from '@/components/ChatBubble';
import { MovieCard } from '@/components/MovieCard';

interface ConversationMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  singleRecommendation?: string;
  tenRecommendations?: string;
  conversationCount?: number;
  aiResponse?: string;
  isAskingQuestion?: boolean;
  conversationComplete?: boolean;
  userPreferences?: any;
}

interface MovieBotWidgetProps {
  profileName: string;
  profileColor: string; // For theming (e.g., 'blue', 'purple', 'red', 'green')
  onMovieRecommendation?: (movies: string[]) => void;
}

export const MovieBotWidget: React.FC<MovieBotWidgetProps> = ({ 
  profileName, 
  profileColor,
  onMovieRecommendation 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  // All the state from the movie-bot page
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [singleRecommendation, setSingleRecommendation] = useState<string | null>(null);
  const [tenRecommendations, setTenRecommendations] = useState<string | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [conversationCount, setConversationCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentAiResponse, setCurrentAiResponse] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs for speech recognition and scrolling
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedTranscriptionRef = useRef<string>(''); // NEW: track last processed text
  const isProcessingRef = useRef(false); // NEW: prevent race conditions

  // Color mappings for different profiles
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    red: 'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  };

  const colorClass = colorClasses[profileColor as keyof typeof colorClasses] || colorClasses.blue;

  // NEW: getMovieRecommendation function (EXACT COPY FROM WORKING PAGE)
  const getMovieRecommendation = useCallback(async (text: string) => {
    if (!sessionId) return;
    
    setIsLoadingRecommendation(true);
    setRecommendationError(null);
    
    try {
      const historyForApi = conversationHistory.map(msg => ({
        text: msg.text,
        isUser: msg.isUser,
        timestamp: msg.timestamp.toISOString()
      }));

      const response = await fetch('/api/movie-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          sessionId,
          conversationHistory: historyForApi
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendation');
      }

      const data = await response.json();
      
      setSingleRecommendation(data.singleRecommendation);
      setTenRecommendations(data.tenRecommendations);
      setConversationCount(data.conversationCount);
      setCurrentAiResponse(data.aiResponse);
      setIsAskingQuestion(data.isAskingQuestion);
      setConversationComplete(data.conversationComplete);
      setUserPreferences(data.userPreferences);
      
      setTranscription('');
      
    } catch (error) {
      console.error('Error getting movie recommendation:', error);
      setRecommendationError('Failed to get movie recommendation. Please try again.');
      setTranscription('');
    } finally {
      setIsLoadingRecommendation(false);
    }
  }, [sessionId, conversationHistory]);

  const startNewChat = useCallback(async () => {
    console.log('🔄 Starting new chat session...');
    try {
      const response = await fetch('/api/new-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start new chat');
      }

      const data = await response.json();
      console.log('✅ New chat session created:', data.sessionId);
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error('❌ Error starting new chat:', error);
      return null;
    }
  }, []);

  // Initialize session and speech recognition when modal opens
  useEffect(() => {
    if (isModalOpen) {
      startNewChat();
      initializeSpeechRecognition();
    }
  }, [isModalOpen, startNewChat]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Auto-trigger movie recommendation when transcription changes
  useEffect(() => {
    if (transcription && transcription.trim().length > 0 && sessionId && !isLoadingRecommendation) {
      console.log('🔄 useEffect triggered for transcription:', transcription);
      getMovieRecommendation(transcription);
    }
  }, [transcription, sessionId, getMovieRecommendation, isLoadingRecommendation]);

  // Update conversation history when new messages are added (EXACT COPY FROM WORKING PAGE)
  useEffect(() => {
    if (transcription && transcription.trim().length > 0) {
      const newMessage: ConversationMessage = {
        id: Date.now().toString(),
        text: transcription,
        isUser: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, newMessage]);
    }
  }, [transcription]);

  // Add AI response to conversation history (EXACT COPY FROM WORKING PAGE)
  useEffect(() => {
    if (currentAiResponse || singleRecommendation || tenRecommendations || recommendationError) {
      const responseText = recommendationError 
        ? `Sorry, I couldn't get movie recommendations right now. ${recommendationError}`
        : currentAiResponse || `Here are some movie recommendations based on what you said!`;

      const newMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        singleRecommendation: singleRecommendation || undefined,
        tenRecommendations: tenRecommendations || undefined,
        conversationCount,
        aiResponse: currentAiResponse || undefined,
        isAskingQuestion,
        conversationComplete,
        userPreferences
      };
      setConversationHistory(prev => [...prev, newMessage]);
      
      setCurrentAiResponse(null);
      setSingleRecommendation(null);
      setTenRecommendations(null);
      setRecommendationError(null);
    }
  }, [currentAiResponse, singleRecommendation, tenRecommendations, recommendationError, conversationCount, isAskingQuestion, conversationComplete, userPreferences]);

  const initializeSpeechRecognition = () => {
    console.log('🎤 Initializing speech recognition...');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('✅ Speech API is supported');
      setIsSpeechSupported(true);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Enhanced configuration for better speech recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        console.log('🎤 Speech recognized:', finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          console.log('✅ Final transcript:', finalTranscript);
          setTranscription(finalTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected, but continuing...');
          // Don't stop recording for no-speech errors
          return;
        }
        if (event.error === 'audio-capture') {
          console.error('🚫 Microphone access denied or not available');
          alert('Microphone access is required for voice input. Please allow microphone access and try again.');
        }
        if (event.error === 'not-allowed') {
          console.error('🚫 Microphone permission denied');
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
        }
        setIsRecording(false);
        isRecordingRef.current = false;
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        // Auto-restart if still supposed to be recording
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            console.log('🔄 Auto-restarting speech recognition...');
            setTimeout(() => {
              if (recognitionRef.current && isRecordingRef.current) {
                recognitionRef.current.start();
              }
            }, 100);
          } catch (error) {
            console.error('❌ Error restarting speech recognition:', error);
            setIsRecording(false);
            isRecordingRef.current = false;
          }
        } else {
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started successfully');
      };
      
      recognitionRef.current = recognition;
    } else {
      console.error('❌ Web Speech API not supported in this browser');
      setIsSpeechSupported(false);
    }
  };

  const startRecording = useCallback(() => {
    console.log('🎤 Attempting to start recording...', { isRecording, hasRecognition: !!recognitionRef.current });
    
    if (recognitionRef.current && !isRecording) {
      try {
        console.log('🎤 Starting speech recognition...');
        recognitionRef.current.start();
        setIsRecording(true);
        isRecordingRef.current = true;
        console.log('✅ Recording started successfully');
      } catch (error) {
        console.error('❌ Error starting speech recognition:', error);
        setIsRecording(false);
        isRecordingRef.current = false;
        alert('Failed to start voice recording. Please check your microphone permissions.');
      }
    } else {
      console.warn('⚠️ Cannot start recording:', { 
        hasRecognition: !!recognitionRef.current, 
        isRecording 
      });
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    console.log('🎤 Attempting to stop recording...');
    
    if (recognitionRef.current && isRecording) {
      try {
        console.log('🛑 Stopping speech recognition...');
        isRecordingRef.current = false;
        recognitionRef.current.stop();
        setIsRecording(false);
        console.log('✅ Recording stopped successfully');
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
        setIsRecording(false);
        isRecordingRef.current = false;
      }
    } else {
      console.warn('⚠️ Cannot stop recording:', { 
        hasRecognition: !!recognitionRef.current, 
        isRecording 
      });
    }
  }, [isRecording]);

  const handleTranscriptionComplete = useCallback((text: string) => {
    setTranscription(text);
  }, []);

  const handleClearTranscription = useCallback(async () => {
    await startNewChat();
    
    setTranscription('');
    setSingleRecommendation(null);
    setTenRecommendations(null);
    setRecommendationError(null);
    setConversationCount(0);
    setConversationHistory([]);
    setCurrentAiResponse(null);
    setIsAskingQuestion(false);
    setConversationComplete(false);
    setUserPreferences(null);
  }, []);

  const handleSendMessage = async (message: string) => {
    console.log('📤 handleSendMessage called with:', { message, trimmed: message.trim(), sessionId, hasSession: !!sessionId });
    
    if (!message.trim()) {
      console.warn('⚠️ Message not sent because it\'s empty:', { message });
      return;
    }

    // Use the same approach as the working page
    setTranscription(message);
  };

  const clearChat = () => {
    setConversationHistory([]);
    startNewChat();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset state when closing
    handleClearTranscription();
  };

  return (
    <>
      {/* Floating Movie Bot Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={openModal}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${colorClass} text-white border-2 border-white/20`}
          title={`${profileName}'s Movie AI`}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-5xl h-[90vh] max-h-[800px] border border-gray-700 relative flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-700 ${colorClass.replace('hover:', 'bg-')} text-white flex-shrink-0`}>
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6" />
                <h2 className="text-lg font-semibold">{profileName}'s Movie AI Assistant</h2>
              </div>
              <div className="flex items-center gap-2">
                {conversationHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={clearChat}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={closeModal}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              {conversationHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-12 h-12 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start a Conversation</h3>
                  <p className="text-gray-400">
                    Tell me about movies you'd like to watch or describe your mood!
                  </p>
                </div>
              ) : (
                conversationHistory.map((message) => (
                  <div key={message.id} className="space-y-4">
                    {/* Chat Message */}
                    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        {!message.isUser && (
                          <div className={`w-8 h-8 ${colorClass.replace('hover:', 'bg-')} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        )}
                        
                        <div className={`rounded-2xl p-3 ${
                          message.isUser 
                            ? `${colorClass.replace('hover:', 'bg-')} text-white` 
                            : 'bg-gray-800 text-gray-100'
                        }`}>
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        
                        {message.isUser && (
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Indicators */}
                    {!message.isUser && message.isAskingQuestion && (
                      <div className="ml-10 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center text-blue-300 text-sm">
                          <Bot className="w-4 h-4 mr-2" />
                          AI is asking a question - please respond
                        </div>
                      </div>
                    )}
                    
                    {!message.isUser && message.conversationComplete && (
                      <div className="ml-10 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center text-green-300 text-sm">
                          <Bot className="w-4 h-4 mr-2" />
                          Conversation complete - here are your personalized recommendations!
                        </div>
                      </div>
                    )}

                    {/* User Preferences */}
                    {!message.isUser && message.userPreferences && (
                      <div className="ml-10 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
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
                    
                    {/* Movie Recommendations */}
                    {!message.isUser && message.singleRecommendation && (
                      <div className="ml-10">
                        {/* Single Recommendation */}
                        <div className="mb-3">
                          <h3 className="text-base font-semibold text-white mb-2 flex items-center">
                            <span className="text-orange-500 mr-2">⭐</span>
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
                              <span className="text-green-400 mr-2">🎬</span>
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
                <div className="flex items-center space-x-2 p-4 bg-gray-700/50 rounded-xl ml-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  <span className="text-gray-300">
                    {isAskingQuestion ? 'Processing your response...' : 'Finding movies for you...'}
                  </span>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(textInput)}
                    placeholder="Tell me what you want to watch..."
                    className="w-full bg-gray-800 text-white rounded-full px-4 py-3 pr-12 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <Button
                    onClick={() => handleSendMessage(textInput)}
                    disabled={!textInput.trim() || isLoadingRecommendation}
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {isSpeechSupported && (
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant="outline"
                    size="icon"
                    className={`rounded-full w-12 h-12 ${
                      isRecording 
                        ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                    title={`${isRecording ? 'Stop' : 'Start'} voice recording`}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                )}
                
                {!isSpeechSupported && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12 border-gray-600 text-gray-500 cursor-not-allowed"
                    disabled
                    title="Speech recognition not supported in this browser"
                  >
                    <MicOff className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {/* Recording Status */}
              {isRecording && (
                <div className="mt-2 flex items-center justify-center">
                  <div className="bg-red-600/20 rounded-full px-4 py-2">
                    <div className="flex items-center space-x-2 text-red-300">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm">Listening...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Information */}
              <div className="mt-2 text-xs text-gray-500 text-center">
                <div>Speech Support: {isSpeechSupported ? '✅ Yes' : '❌ No'}</div>
                <div>Recording: {isRecording ? '🎤 Active' : '⏸️ Inactive'}</div>
                <div>Session: {sessionId ? '✅ Connected' : '❌ No Session'}</div>
                {!isSpeechSupported && (
                  <div className="text-red-400 mt-1">
                    Try Chrome/Edge for speech recognition
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 