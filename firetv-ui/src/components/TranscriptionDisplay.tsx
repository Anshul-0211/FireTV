
'use client'

import { ChatBubble } from './ChatBubble'

interface TranscriptionDisplayProps {
  transcription: string
  onClear: () => void
}

export function TranscriptionDisplay({ transcription, onClear }: TranscriptionDisplayProps) {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Conversation
        </h2>
        {transcription && (
          <button
            onClick={onClear}
            className="btn btn-secondary text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Chat
          </button>
        )}
      </div>
      
      <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 bg-gray-900 rounded-xl border border-gray-600">
        {transcription ? (
          <div className="space-y-4">
            <ChatBubble 
              message={transcription} 
              isUser={true}
              timestamp={new Date().toLocaleTimeString()}
            />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Speaking</h3>
            <p className="text-gray-400">
              Your conversation will appear here as you speak
            </p>
          </div>
        )}
      </div>
      
      {transcription && (
        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-300">
              Word count: {transcription.split(/\s+/).filter(word => word.length > 0).length}
            </span>
            <span className="text-gray-400">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 