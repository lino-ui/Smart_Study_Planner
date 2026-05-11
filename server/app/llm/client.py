import os
import google.generativeai as genai
from typing import List, Dict

# Configure the Gemini API key from environment variables
# Note: Users must set GEMINI_API_KEY in their .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class LLMClient:
    def __init__(self):
        self.is_configured = bool(GEMINI_API_KEY)
        if self.is_configured:
            # Initialize the model (Gemini 1.5 Pro or standard depending on access, fallback to gemini-pro)
            self.model = genai.GenerativeModel('gemini-1.5-pro-latest')

    async def generate_response(self, system_prompt: str, history: List[Dict[str, str]], new_message: str) -> str:
        """
        Generates a response using Gemini API.
        If API key is missing, returns a mock response for development.
        """
        if not self.is_configured:
            return "This is a mock response from your Smart Study Assistant. To enable real AI responses, please set the `GEMINI_API_KEY` in your backend `.env` file."

        try:
            # Format history for Gemini
            # Gemini expects format: [{"role": "user", "parts": ["hello"]}, {"role": "model", "parts": ["hi"]}]
            formatted_history = []
            
            # Inject system prompt as the first message or context
            # Gemini 1.5 supports system instructions natively, but for broader compatibility we can inject it into the first prompt
            first_user_msg = f"System Context:\n{system_prompt}\n\nUser Message: "
            
            for i, msg in enumerate(history):
                role = "model" if msg["role"] == "assistant" else "user"
                content = msg["content"]
                
                if i == 0 and role == "user":
                    content = first_user_msg + content
                
                formatted_history.append({
                    "role": role,
                    "parts": [content]
                })

            chat = self.model.start_chat(history=formatted_history)
            
            # Send the new message
            # If history was empty, we need to inject system prompt here
            if not history:
                response = chat.send_message(f"System Context:\n{system_prompt}\n\nUser Message: {new_message}")
            else:
                response = chat.send_message(new_message)
                
            return response.text
        except Exception as e:
            print(f"LLM Error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again later."

llm_client = LLMClient()
