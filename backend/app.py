import os
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import httpx
from flask_cors import CORS
import re

# Load environment variables from .env file (if it exists)
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Get OpenAI API key from environment variables
# IMPORTANT: Use a .env file for local development, and your hosting provider's
# secure configuration for production.
openai_api_key = os.getenv('OPENAI_API_KEY')

# Ensure API key is available
if not openai_api_key:
    print("Error: OPENAI_API_KEY environment variable not set.")
    # In a production app, you might want to handle this more gracefully,
    # perhaps by not starting the app or returning a specific error.

client = OpenAI(
    api_key=openai_api_key,
    http_client=httpx.Client(trust_env=False) # Explicitly disable loading proxy settings from env vars
)

@app.route('/api/chat', methods=['POST'])
def chat():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 415

    data = request.get_json()
    user_transcript = data.get('transcript')
    user_preferences = data.get('preferences', {}) # Get preferences, default to empty dict

    if not user_transcript:
        return jsonify({'error': "'transcript' field is required'"}), 400

    # Construct messages for OpenAI API
    system_message = """You are MoodMate, an empathetic AI therapist. Your role is to:
    1. Provide supportive, empathetic responses to the user's concerns
    2. Analyze the user's emotional state and tone
    3. Suggest 3 personalized mood boost activities based on the conversation context
    4. Format your response as follows:
    
    MAIN_RESPONSE: [Your empathetic response here]
    
    ANALYSIS:
    - Feeling: [detected emotion: happy/sad/angry/fearful/disgusted/surprised/neutral]
    - Tone: [response tone: empathetic/supportive/encouraging/calming]
    - Activities: [List exactly 3 personalized activities based on the conversation context]
    
    Example activities format:
    - Take a 10-minute walk outside to clear your mind
    - Practice deep breathing exercises for 5 minutes
    - Write down three things you're grateful for today
    
    Always provide exactly 3 activities that are relevant to the user's situation and emotional state."""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": f"User preferences: {user_preferences}\n\nUser message: {user_transcript}"}
    ]
    
    # --- Call OpenAI API ---
    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4", # Or "gpt-3.5-turbo" based on your preference/access
            messages=messages
        )
        ai_response = chat_completion.choices[0].message.content
        print(f"Raw AI response from OpenAI: {ai_response}") # Debug log

        # Parse the response to separate main response and analysis
        response_parts = ai_response.split('\n\nANALYSIS:')
        main_response = response_parts[0].replace('MAIN_RESPONSE:', '').strip()
        
        analysis = {}
        if len(response_parts) > 1:
            analysis_text = response_parts[1].strip()
            
            # Extract feeling
            feeling_match = re.search(r'Feeling:\s*([^\n]+)', analysis_text)
            if feeling_match:
                analysis['feeling'] = feeling_match.group(1).strip()
            
            # Extract tone
            tone_match = re.search(r'Tone:\s*([^\n]+)', analysis_text)
            if tone_match:
                analysis['tone'] = tone_match.group(1).strip()
            
            # Extract activities
            activities_match = re.search(r'Activities:\s*([^-]+(?:-[^-]+)*)', analysis_text, re.DOTALL)
            if activities_match:
                activities_text = activities_match.group(1).strip()
                # Split by newline and clean up each activity
                activities = [act.strip('- ').strip() for act in activities_text.split('\n') if act.strip()]
                analysis['activities'] = activities[:3]  # Ensure we only take the first 3 activities
        
        print(f"Parsed analysis data: {analysis}") # Debug log
        return jsonify({
            'response': main_response,
            'analysis': analysis
        })

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return jsonify({'error': 'Failed to get response from AI'}), 500

if __name__ == '__main__':
    # In production, use a production-ready WSGI server like Gunicorn or uWSGI
    # For local development:
    app.run(debug=True) 