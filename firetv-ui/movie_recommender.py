from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import uuid
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Configure Gemini API
genai.configure(api_key='AIzaSyC_EuRoyilmZakNX60DS0x3uORa2AY6LdU')
model = genai.GenerativeModel('gemini-1.5-flash')

# Session storage (in-memory, no persistence)
sessions = {}

class ConversationSession:
    def __init__(self, session_id):
        self.session_id = session_id
        self.conversation_history = []
        self.user_preferences = {}
        self.conversation_stage = "initial"  # initial, asking_genre, asking_mood, asking_actors, complete
        self.questions_asked = []
        
    def add_message(self, text, is_user=True):
        self.conversation_history.append({
            "text": text,
            "is_user": is_user,
            "timestamp": datetime.now().isoformat()
        })
    
    def update_preferences(self, preferences):
        self.user_preferences.update(preferences)
    
    def get_conversation_context(self):
        return {
            "history": self.conversation_history,
            "preferences": self.user_preferences,
            "stage": self.conversation_stage,
            "questions_asked": self.questions_asked
        }

def analyze_user_input(text, session):
    """Analyze user input to extract preferences and determine next action"""
    
    # Check if user is providing preferences
    text_lower = text.lower()
    
    # Genre detection
    genres = ["action", "comedy", "drama", "horror", "romance", "sci-fi", "thriller", "documentary", "animation", "fantasy"]
    detected_genre = None
    for genre in genres:
        if genre in text_lower:
            detected_genre = genre
            break
    
    # Mood detection
    moods = ["happy", "sad", "excited", "relaxed", "stressed", "romantic", "adventurous", "mysterious", "funny", "serious"]
    detected_mood = None
    for mood in moods:
        if mood in text_lower:
            detected_mood = mood
            break
    
    # Year detection
    import re
    year_match = re.search(r'\b(19|20)\d{2}\b', text)
    detected_year = year_match.group() if year_match else None
    
    # Actor detection (simple keyword matching)
    actors = ["tom hanks", "leonardo dicaprio", "meryl streep", "brad pitt", "jennifer lawrence", "ryan reynolds"]
    detected_actors = []
    for actor in actors:
        if actor in text_lower:
            detected_actors.append(actor)
    
    return {
        "genre": detected_genre,
        "mood": detected_mood,
        "year": detected_year,
        "actors": detected_actors if detected_actors else None
    }

def generate_ai_response(text, session):
    """Generate AI response based on conversation stage and user input"""
    
    # Analyze user input for preferences
    detected_prefs = analyze_user_input(text, session)
    
    # Update session preferences if detected
    if any(detected_prefs.values()):
        session.update_preferences({k: v for k, v in detected_prefs.items() if v})
    
    # Build conversation context
    conversation_context = build_conversation_context(session)
    
    # Generate AI response using Gemini
    ai_response = generate_dynamic_response(text, session, conversation_context)
    
    return ai_response

def build_conversation_context(session):
    """Build conversation context for AI"""
    context = {
        "user_preferences": session.user_preferences,
        "conversation_history": session.conversation_history,
        "questions_asked": session.questions_asked,
        "conversation_stage": session.conversation_stage
    }
    return context

def generate_dynamic_response(user_input, session, context):
    """Generate dynamic AI response using Gemini"""
    
    # Build the prompt for dynamic conversation
    prompt = f"""
    You are an intelligent movie recommendation assistant. You're having a conversation with a user to understand their movie preferences and provide personalized recommendations.

    Current conversation context:
    - User preferences learned so far: {context['user_preferences']}
    - Conversation history: {len(context['conversation_history'])} messages
    - Questions already asked: {context['questions_asked']}
    - Current stage: {context['conversation_stage']}

    User's latest input: "{user_input}"

    Your task:
    1. If the user mentions ANY movie preferences (genre, mood, actors, year, etc.), provide recommendations immediately
    2. If the user asks for movie suggestions, provide them right away
    3. Only ask ONE follow-up question if you have NO information at all
    4. Be decisive and provide recommendations when you have enough context
    5. Don't be overly cautious - if you can make reasonable recommendations, do so

    IMPORTANT: If the user mentions any preference or asks for movies, provide recommendations immediately. Don't keep asking questions.

    If you're providing recommendations, format as JSON:
    {{
        "ai_response": "Your conversational response with recommendations",
        "is_asking_question": false,
        "conversation_complete": true,
        "single_recommendation": "Top Movie (Year) - Brief explanation",
        "ten_recommendations": "Movie1, Movie2, Movie3, Movie4, Movie5, Movie6, Movie7, Movie8, Movie9, Movie10"
    }}

    If you're asking a question, format as JSON:
    {{
        "ai_response": "Your conversational question",
        "is_asking_question": true,
        "conversation_complete": false
    }}

    Be decisive and helpful. Provide recommendations when possible.
    """
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Try to parse JSON response
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                ai_data = json.loads(json_match.group())
                
                # Update session stage
                if ai_data.get("conversation_complete"):
                    session.conversation_stage = "complete"
                
                return ai_data
            except json.JSONDecodeError:
                pass
        
        # Fallback: treat as conversational response
        return {
            "ai_response": response_text,
            "is_asking_question": "?" in response_text,
            "conversation_complete": False
        }
        
    except Exception as e:
        print(f"Error generating dynamic response: {e}")
        # Fallback to static response
        return generate_fallback_response(session)

def generate_fallback_response(session):
    """Generate fallback response when AI fails"""
    preferences = session.user_preferences
    
    if len(preferences) >= 2:  # If we have enough preferences
        return generate_final_recommendations(session)
    else:
        return {
            "ai_response": "I'd love to help you find the perfect movie! What kind of movies do you usually enjoy?",
            "is_asking_question": True,
            "conversation_complete": False
        }

def generate_final_recommendations(session):
    """Generate final movie recommendations based on learned preferences"""
    
    # Build prompt for Gemini
    preferences = session.user_preferences
    genre = preferences.get("genre", "general")
    mood = preferences.get("mood", "entertaining")
    actors = preferences.get("actors", "")
    year = preferences.get("year", "")
    
    prompt = f"""
    You are a movie recommendation expert. Based on the following user preferences, provide exactly 10 movie recommendations:
    
    User Preferences:
    - Genre: {genre}
    - Mood: {mood}
    - Preferred actors: {actors if actors else 'Any'}
    - Preferred year: {year if year else 'Any'}
    
    Please provide:
    1. A single top recommendation with a brief explanation of why it's perfect for this user
    2. A list of exactly 10 movies (including the top recommendation) that match their preferences
    
    Format your response as JSON only:
    {{
        "single_recommendation": "Movie Title (Year) - Brief explanation of why it's perfect",
        "ten_recommendations": "Movie1, Movie2, Movie3, Movie4, Movie5, Movie6, Movie7, Movie8, Movie9, Movie10"
    }}
    
    Requirements:
    - Choose well-known, highly-rated movies that match the user's preferences
    - Ensure diversity in the recommendations
    - Make sure the movies are appropriate for the specified mood
    - Include a mix of classic and modern films
    - Return only the JSON response, no additional text
    """
    
    try:
        response = model.generate_content(prompt)
        # Parse the response to extract JSON
        response_text = response.text
        
        # Try to extract JSON from the response
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            recommendations = json.loads(json_match.group())
        else:
            # Fallback if JSON parsing fails
            recommendations = {
                "single_recommendation": f"Great {genre} movie for a {mood} mood",
                "ten_recommendations": "The Shawshank Redemption, The Godfather, Pulp Fiction, Forrest Gump, Inception, The Dark Knight, Fight Club, Goodfellas, The Matrix, Interstellar"
            }
        
        return {
            "ai_response": f"Perfect! Based on your preferences for {genre} movies and your {mood} mood, here are some great recommendations for you!",
            "is_asking_question": False,
            "conversation_complete": True,
            "single_recommendation": recommendations["single_recommendation"],
            "ten_recommendations": recommendations["ten_recommendations"]
        }
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        # Fallback recommendations based on preferences
        fallback_movies = get_fallback_recommendations(preferences)
        return {
            "ai_response": f"Based on your preferences for {genre} movies and your {mood} mood, here are some great recommendations!",
            "is_asking_question": False,
            "conversation_complete": True,
            "single_recommendation": fallback_movies["single_recommendation"],
            "ten_recommendations": fallback_movies["ten_recommendations"]
        }

def get_fallback_recommendations(preferences):
    """Get fallback movie recommendations based on preferences"""
    genre = preferences.get("genre", "general")
    mood = preferences.get("mood", "entertaining")
    
    # Genre-specific movie lists
    genre_movies = {
        "action": {
            "single": "Die Hard (1988) - Classic action thriller with Bruce Willis",
            "list": "Die Hard, Mad Max: Fury Road, John Wick, The Dark Knight, Mission: Impossible, Top Gun: Maverick, The Matrix, Gladiator, Speed, Terminator 2"
        },
        "comedy": {
            "single": "The Grand Budapest Hotel (2014) - Quirky comedy by Wes Anderson",
            "list": "The Grand Budapest Hotel, Superbad, The Hangover, Bridesmaids, Shaun of the Dead, Hot Fuzz, The Big Lebowski, Groundhog Day, Office Space, Anchorman"
        },
        "drama": {
            "single": "The Shawshank Redemption (1994) - Powerful story of hope and friendship",
            "list": "The Shawshank Redemption, Forrest Gump, The Green Mile, Schindler's List, Goodfellas, The Godfather, Pulp Fiction, Fight Club, American Beauty, The Silence of the Lambs"
        },
        "horror": {
            "single": "The Shining (1980) - Psychological horror masterpiece",
            "list": "The Shining, A Quiet Place, Get Out, The Conjuring, Halloween, The Exorcist, Hereditary, It Follows, The Babadook, Scream"
        },
        "romance": {
            "single": "The Notebook (2004) - Classic romantic drama",
            "list": "The Notebook, La La Land, Titanic, Before Sunrise, Eternal Sunshine of the Spotless Mind, 500 Days of Summer, The Princess Bride, About Time, Crazy Rich Asians, A Star Is Born"
        },
        "sci-fi": {
            "single": "Inception (2010) - Mind-bending sci-fi thriller",
            "list": "Inception, Blade Runner, The Matrix, Interstellar, Arrival, Ex Machina, Her, District 9, Edge of Tomorrow, Looper"
        },
        "thriller": {
            "single": "Gone Girl (2014) - Psychological thriller with twists",
            "list": "Gone Girl, The Silence of the Lambs, Se7en, Zodiac, Prisoners, Shutter Island, Memento, The Usual Suspects, Oldboy, Parasite"
        },
        "documentary": {
            "single": "Planet Earth (2006) - Stunning nature documentary series",
            "list": "Planet Earth, The Last Dance, Making a Murderer, The Act of Killing, Man on Wire, Jiro Dreams of Sushi, Won't You Be My Neighbor?, Free Solo, 13th, The Cove"
        },
        "animation": {
            "single": "Spirited Away (2001) - Magical animated adventure",
            "list": "Spirited Away, Toy Story, Up, Inside Out, Coco, The Lion King, Spider-Man: Into the Spider-Verse, Wall-E, Finding Nemo, Zootopia"
        },
        "fantasy": {
            "single": "The Lord of the Rings: The Fellowship of the Ring (2001) - Epic fantasy adventure",
            "list": "The Lord of the Rings: The Fellowship of the Ring, Harry Potter and the Sorcerer's Stone, Pan's Labyrinth, The Princess Bride, Stardust, The NeverEnding Story, Labyrinth, Willow, The Dark Crystal, Big Fish"
        }
    }
    
    # Get movies for the detected genre, or general movies if not found
    if genre in genre_movies:
        movies = genre_movies[genre]
    else:
        # General recommendations
        movies = {
            "single": "The Shawshank Redemption (1994) - Timeless story of hope and redemption",
            "list": "The Shawshank Redemption, The Godfather, Pulp Fiction, Forrest Gump, Inception, The Dark Knight, Fight Club, Goodfellas, The Matrix, Interstellar"
        }
    
    return {
        "single_recommendation": movies["single"],
        "ten_recommendations": movies["list"]
    }

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        text = data.get('text', '')
        session_id = data.get('session_id', '')
        conversation_history = data.get('conversation_history', [])
        
        if not text or not session_id:
            return jsonify({'error': 'Missing text or session_id'}), 400
        
        # Get or create session
        if session_id not in sessions:
            sessions[session_id] = ConversationSession(session_id)
        
        session = sessions[session_id]
        
        # Add user message to session
        session.add_message(text, is_user=True)
        
        # Generate AI response
        ai_response_data = generate_ai_response(text, session)
        
        # Add AI response to session
        session.add_message(ai_response_data["ai_response"], is_user=False)
        
        return jsonify({
            'input': text,
            'session_id': session_id,
            'conversation_count': len(session.conversation_history) // 2,  # Count conversation pairs
            'ai_response': ai_response_data["ai_response"],
            'is_asking_question': ai_response_data["is_asking_question"],
            'conversation_complete': ai_response_data["conversation_complete"],
            'user_preferences': session.user_preferences,
            'single_recommendation': ai_response_data.get("single_recommendation"),
            'ten_recommendations': ai_response_data.get("ten_recommendations")
        })
        
    except Exception as e:
        print(f"Error in recommend endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/new-chat', methods=['POST'])
def new_chat():
    try:
        # Generate new session ID
        session_id = str(uuid.uuid4())
        
        # Create new session
        sessions[session_id] = ConversationSession(session_id)
        
        return jsonify({
            'session_id': session_id,
            'message': 'New chat session started'
        })
        
    except Exception as e:
        print(f"Error in new-chat endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'active_sessions': len(sessions)})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 