'use client'

import { ChatBubble } from './ChatBubble'
import { MovieCard } from './MovieCard'

interface MovieRecommendationProps {
  singleRecommendation: string | null
  tenRecommendations: string | null
  isLoading: boolean
  error: string | null
  conversationCount: number
}

export function MovieRecommendation({ 
  singleRecommendation, 
  tenRecommendations, 
  isLoading, 
  error, 
  conversationCount 
}: MovieRecommendationProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Finding perfect movies for you</p>
            <p className="text-sm text-gray-500 mt-2 loading-dots">Analyzing your preferences</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-400">Recommendation Error</h3>
              <p className="text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!singleRecommendation && !tenRecommendations) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Ready for Recommendations</h3>
          <p className="text-gray-400 text-lg">
            Start speaking to get personalized movie suggestions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Single Top Recommendation */}
      {singleRecommendation && (
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Top Recommendation
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            <MovieCard 
              title={singleRecommendation} 
              index={1} 
              isTopRecommendation={true}
            />
          </div>
          
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <p className="text-orange-300 text-sm">
              Based on your mood (3/5) and conversation context
            </p>
          </div>
        </div>
      )}

      {/* Ten Movie Recommendations */}
      {tenRecommendations && (
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Top 10 Recommendations
            </div>
            {conversationCount > 1 && (
              <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                {conversationCount} conversations
              </span>
            )}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tenRecommendations.split(',').map((movie, index) => (
              <MovieCard 
                key={index}
                title={movie.trim()} 
                index={index + 1}
              />
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-300 text-sm">
              Personalized recommendations based on your conversation history
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 