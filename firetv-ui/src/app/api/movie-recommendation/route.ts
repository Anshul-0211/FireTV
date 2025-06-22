import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, sessionId, conversationHistory } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      )
    }

    // Call the Python Flask service with conversation history
    const response = await fetch('http://localhost:5000/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text, 
        session_id: sessionId,
        conversation_history: conversationHistory || []
      }),
    })

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      singleRecommendation: data.single_recommendation,
      tenRecommendations: data.ten_recommendations,
      input: data.input,
      mood: data.mood,
      conversationCount: data.conversation_count,
      sessionId: data.session_id,
      aiResponse: data.ai_response,
      isAskingQuestion: data.is_asking_question,
      conversationComplete: data.conversation_complete,
      userPreferences: data.user_preferences
    })
    
  } catch (error: any) {
    console.error('Error getting movie recommendation:', error)
    return NextResponse.json(
      { error: 'Failed to get movie recommendation' },
      { status: 500 }
    )
  }
} 