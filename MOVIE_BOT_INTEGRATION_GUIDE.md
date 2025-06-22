# 🤖 AI Movie Bot Integration Guide

## Overview

The **AI Movie Bot** is a powerful conversational AI feature integrated into your Fire TV application that provides personalized movie recommendations through natural language conversations. Users can speak or type their movie preferences and receive intelligent, contextual recommendations.

## ✨ Features

### 🎯 **Intelligent Conversations**
- **Natural Language Processing**: Understands conversational movie requests
- **Context Awareness**: Remembers conversation history for better recommendations
- **Multi-turn Dialogues**: Engages in back-and-forth conversations to refine preferences

### 🎬 **Smart Recommendations**
- **Single Top Pick**: Provides the best recommendation based on user input
- **10 Movie List**: Offers diverse options to choose from
- **Real-time Analysis**: Uses Google Gemini AI for dynamic response generation

### 🎙️ **Voice & Text Input**
- **Speech Recognition**: Built-in Web Speech API support
- **Text Input**: Type your preferences directly
- **Cross-platform Compatibility**: Works on modern browsers

### 🎨 **Profile-Specific Theming**
- **Anshul**: Blue theme (Action & Thriller preferences)
- **Priyanshu**: Purple theme (Comedy & Drama preferences)
- **Shaurya**: Red theme (Horror & Sci-Fi preferences)
- **Shikhar**: Green theme (Comedy & Family preferences)

## 🚀 Quick Start

### 1. **Start the Services**

#### Start the AI Recommendation Server:
```bash
cd firetv-ui
python movie_recommender.py
```
*Server runs on: http://localhost:5000*

#### Start the Next.js Development Server:
```bash
cd firetv-ui
npm run dev
```
*Frontend runs on: http://localhost:3000*

### 2. **Access the Movie Bot**

1. Navigate to any profile page (e.g., `/anshul`, `/priyanshu`, `/shaurya`, `/shikhar`)
2. Look for the floating **chat bubble** in the bottom-right corner
3. Click the chat bubble to open the Movie Bot

### 3. **Start Conversing**

**Example Conversations:**

```
🧑 User: "I want something funny to watch tonight"
🤖 Bot: "I'd love to help you find something hilarious! What kind of comedy do you prefer - romantic comedies, action comedies, or maybe something with your favorite actors?"

🧑 User: "Something like Marvel movies but funny"
🤖 Bot: Here are some great action-comedy recommendations:
🌟 Top Pick: Guardians of the Galaxy (2014)
🎬 Recommendations: Deadpool, Thor: Ragnarok, Ant-Man, Spider-Man: Homecoming...
```

## 🛠️ Technical Architecture

### **Backend Components**

#### **1. Flask AI Service** (`movie_recommender.py`)
- **Google Gemini Integration**: Powers conversational AI
- **Session Management**: Maintains conversation context
- **Preference Analysis**: Extracts movie preferences from natural language
- **Dynamic Response Generation**: Creates contextual recommendations

#### **2. API Routes** (`/api/`)
- **`/api/movie-recommendation`**: Main recommendation endpoint
- **`/api/new-chat`**: Initialize new conversation sessions

#### **3. Core AI Features**
```python
# Key Components:
- ConversationSession: Manages user context
- analyze_user_input(): Extracts preferences
- generate_ai_response(): Creates intelligent responses
- preference detection: Genre, mood, actors, years
```

### **Frontend Components**

#### **1. MovieBotWidget** (`/components/MovieBotWidget.tsx`)
- **Floating Chat Interface**: Minimizable chat window
- **Speech Recognition**: Web Speech API integration
- **Real-time Messaging**: Instant AI responses
- **Profile Theming**: Color-coded per user

#### **2. Supporting Components**
- **ChatBubble.tsx**: Individual message display
- **ChatWindow.tsx**: Full conversation interface
- **MovieRecommendation.tsx**: Recommendation display
- **SpeechDebugger.tsx**: Development debugging tool

## 📱 User Interface

### **Collapsed State**
- Floating button in bottom-right corner
- Profile-specific color theming
- Subtle hover animations

### **Expanded State**
- **Header**: Profile name and bot identification
- **Chat Area**: Conversation history with bot/user avatars
- **Input Area**: Text input with send button
- **Voice Button**: Speech recognition toggle
- **Clear Button**: Reset conversation

### **Message Types**
- **User Messages**: Blue bubbles on the right
- **AI Messages**: Gray bubbles on the left with bot avatar
- **Recommendations**: Special formatted sections with movie lists
- **Loading States**: Animated indicators during processing

## 🎯 Integration with Existing System

### **Data Flow**
```
User Input → MovieBotWidget → API Route → Flask AI Service → Gemini AI
     ↓
Response ← Frontend Display ← API Response ← AI Processing ← TMDB Data
```

### **Session Management**
- Each chat session gets a unique ID
- Conversation history is maintained
- User preferences are tracked across messages
- Context-aware recommendations improve over time

### **Recommendation Enhancement**
- AI recommendations can optionally integrate with existing recommendation system
- Movies discovered through AI chat can influence profile recommendations
- Cross-platform learning opportunities

## 🔧 Configuration

### **Environment Variables**
```env
# Google AI API Key (Required)
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=true
```

### **Customization Options**

#### **Profile Colors** (in MovieBotWidget.tsx):
```typescript
const colorClasses = {
  blue: 'bg-blue-500 text-blue-100 border-blue-400',     // Anshul
  purple: 'bg-purple-500 text-purple-100 border-purple-400', // Priyanshu
  red: 'bg-red-500 text-red-100 border-red-400',        // Shaurya
  green: 'bg-green-500 text-green-100 border-green-400' // Shikhar
};
```

#### **AI Behavior** (in movie_recommender.py):
```python
# Conversation stages
conversation_stage = "initial"  # initial, asking_genre, complete

# Response format
{
    "ai_response": "Conversational response",
    "single_recommendation": "Top Movie Title",
    "ten_recommendations": "Movie1, Movie2, Movie3...",
    "conversation_complete": true/false
}
```

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Speech Recognition Not Working**
```javascript
// Check browser support
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  // Supported
} else {
  // Show fallback UI
}
```

#### **2. Flask Server Connection Issues**
```bash
# Check if server is running
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "active_sessions": 0
}
```

#### **3. Missing Google AI API Key**
```python
# In movie_recommender.py, line 13:
genai.configure(api_key='YOUR_API_KEY_HERE')
```

### **Error Handling**
- **Network failures**: Graceful fallback messages
- **API rate limits**: Retry logic with exponential backoff
- **Speech errors**: Automatic recovery and user feedback
- **Session timeouts**: Automatic session renewal

## 🔮 Future Enhancements

### **Planned Features**
1. **Voice Responses**: Text-to-speech for AI replies
2. **Movie Trailers**: Embedded trailer playback
3. **Advanced Filters**: Year, rating, duration preferences
4. **Social Features**: Share recommendations with other profiles
5. **Learning System**: Improve recommendations based on watch history

### **Integration Opportunities**
1. **TMDB Enhanced Data**: Richer movie metadata
2. **Streaming Availability**: Real-time platform checking
3. **Calendar Integration**: "Movies for tonight" type queries
4. **Mood-based Recommendations**: Emotional context understanding

## 📊 Analytics & Monitoring

### **Key Metrics**
- Conversation completion rates
- Recommendation acceptance rates
- Average session duration
- User satisfaction scores
- Voice vs text input usage

### **Logging**
```python
# Session activity logging
logging.info(f"New conversation started for profile: {profile_name}")
logging.info(f"Generated recommendations for: {user_input}")
logging.warning(f"API timeout for session: {session_id}")
```

## 🎬 Demo Scenarios

### **Scenario 1: Quick Comedy Recommendation**
```
User: "Something funny for tonight"
Bot: "Perfect! Here's a hilarious pick..."
Result: Single recommendation with brief explanation
```

### **Scenario 2: Mood-based Discovery**
```
User: "I'm feeling sad, need something uplifting"
Bot: "I understand. Here are some feel-good movies..."
Result: Curated list of uplifting films
```

### **Scenario 3: Actor-specific Request**
```
User: "Movies with Ryan Reynolds"
Bot: "Great choice! Ryan Reynolds has some amazing films..."
Result: Actor-specific recommendations
```

---

## 🏁 Conclusion

The AI Movie Bot enhances your Fire TV application with intelligent, conversational movie discovery. It bridges the gap between complex recommendation algorithms and natural human conversation, making movie selection more intuitive and personalized.

**Ready to start? Just click that chat bubble and ask for your perfect movie!** 🍿🎬 