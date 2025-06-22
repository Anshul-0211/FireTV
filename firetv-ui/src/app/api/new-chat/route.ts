import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Call the Python Flask service to start a new chat
    const response = await fetch('http://localhost:5000/new-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      sessionId: data.session_id,
      message: data.message
    })
    
  } catch (error: any) {
    console.error('Error starting new chat:', error)
    return NextResponse.json(
      { error: 'Failed to start new chat' },
      { status: 500 }
    )
  }
} 