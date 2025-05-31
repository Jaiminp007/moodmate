import os
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
import httpx
from flask_cors import CORS

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
    messages = [
        {"role": "system", "content": """You are MoodMate, a warm, empathetic AI companion. 
        Your responses should be supportive and helpful. After each response, suggest 3 personalized mood boost activities 
        based on the conversation context. Format your response as follows:
        
        Main response: [Your empathetic response here]
        
        Analysis:
        - Feeling: [Detected emotion: happy/sad/angry/fearful/disgusted/surprised/neutral]
        - Tone: [Response tone: supportive/calm/encouraging/reassuring]
        - Activities: [List of 3 personalized mood boost activities]"""},
        {"role": "user", "content": user_transcript}
    ]
    
    # --- Call OpenAI API ---
    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4", # Or "gpt-3.5-turbo" based on your preference/access
            messages=messages
        )
        ai_response = chat_completion.choices[0].message.content

        # Parse the response to extract main response and analysis
        response_parts = ai_response.split('\n\nAnalysis:')
        main_response = response_parts[0].replace('Main response:', '').strip()
        
        analysis = {}
        if len(response_parts) > 1:
            analysis_text = response_parts[1].strip()
            for line in analysis_text.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip('- ').lower()
                    value = value.strip()
                    if key == 'activities':
                        value = [activity.strip() for activity in value.split('\n') if activity.strip()]
                    analysis[key] = value

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