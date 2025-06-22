'use client'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  timestamp?: string
}

export function ChatBubble({ message, isUser, timestamp }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
      <div className="flex items-start space-x-3">
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
          </div>
        )}
        
        <div className="flex-1">
          <p className="text-lg leading-relaxed">{message}</p>
          {timestamp && (
            <p className="text-xs opacity-70 mt-2">
              {timestamp}
            </p>
          )}
        </div>
        
        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 