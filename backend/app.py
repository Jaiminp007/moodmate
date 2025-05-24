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
        {"role": "system", "content": "You are MoodMate, a warm, empathetic AI companion. "},
        # Optionally add user preferences to the system message
        # Example: {"role": "system", "content": f"User preferences: {user_preferences}. You are MoodMate..."},
        {"role": "user", "content": user_transcript}
    ]
    
    # --- Call OpenAI API ---
    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4o-mini", # Or "gpt-3.5-turbo" based on your preference/access
            messages=messages
        )
        ai_response = chat_completion.choices[0].message.content
        return jsonify({'response': ai_response})

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return jsonify({'error': 'Failed to get response from AI'}), 500

if __name__ == '__main__':
    # In production, use a production-ready WSGI server like Gunicorn or uWSGI
    # For local development:
    app.run(debug=True) 