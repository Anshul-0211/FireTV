'use client'

import { useState, useEffect } from 'react'

interface SpeechDebuggerProps {
  isRecording: boolean
  transcription: string
}

export function SpeechDebugger({ isRecording, transcription }: SpeechDebuggerProps) {
  const [permissions, setPermissions] = useState<string>('unknown')
  const [browserSupport, setBrowserSupport] = useState(false)

  useEffect(() => {
    // Check browser support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setBrowserSupport(true)
    }

    // Check microphone permissions
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setPermissions(result.state)
      })
      .catch(() => {
        setPermissions('unavailable')
      })
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm max-w-xs">
      <h4 className="font-bold mb-2">Speech Debug Info</h4>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Browser Support:</span>{' '}
          <span className={browserSupport ? 'text-green-400' : 'text-red-400'}>
            {browserSupport ? '✓' : '✗'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Microphone:</span>{' '}
          <span className={permissions === 'granted' ? 'text-green-400' : 'text-yellow-400'}>
            {permissions}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Recording:</span>{' '}
          <span className={isRecording ? 'text-green-400' : 'text-gray-400'}>
            {isRecording ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Last Transcription:</span>
          <div className="text-xs text-blue-300 mt-1 break-words">
            {transcription || 'None'}
          </div>
        </div>
      </div>
    </div>
  )
} 