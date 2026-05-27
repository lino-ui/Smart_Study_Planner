import google.generativeai as genai
from typing import List, Dict

class LLMClient:
    def __init__(self):
        # Directly use the provided Gemini API key as requested
        self.api_key = "AIzaSyCrbvdklOMhF4Fm7f9_KjmNLRw_pxzSiEg"
        self.is_configured = True
        
        try:
            # Configure the Gemini client
            genai.configure(api_key=self.api_key)
            # Use gemini-1.5-flash-latest to avoid 404 model-not-found issues
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        except Exception as e:
            print(f"Error configuring Google Generative AI with gemini-2.5-flash: {e}")
            try:
                # Fallback to robust legacy gemini-pro if flash-latest throws an initialization error
                self.model = genai.GenerativeModel('gemini-flash-latest')
            except Exception as fallback_err:
                print(f"Failed to load fallback gemini-flash-latest: {fallback_err}")
                self.is_configured = False

    async def generate_response(self, system_prompt: str, history: List[Dict[str, str]], new_message: str) -> str:
        """
        Generates a response using the official Gemini API with the hardcoded active API key.
        """
        if not self.is_configured:
            return (
                "😔 I apologize, but my Gemini AI brain is not fully configured yet.\n\n"
                "Please verify that your Google Generative AI dependencies are correctly installed."
            )

        try:
            # Format history for Gemini API
            # Gemini expects format: [{"role": "user", "parts": ["text"]}, {"role": "model", "parts": ["text"]}]
            formatted_history = []
            
            # Incorporate system prompt into the first user message or context for early grounding
            first_user_msg = f"System Context:\n{system_prompt}\n\nUser Message: "
            
            for i, msg in enumerate(history):
                role = "model" if msg["role"] == "assistant" else "user"
                content = msg["content"]
                
                # Ground the conversation with system prompt context on the first prompt
                if i == 0 and role == "user":
                    content = first_user_msg + content
                
                formatted_history.append({
                    "role": role,
                    "parts": [content]
                })

            # Start chat with configured history
            chat = self.model.start_chat(history=formatted_history)
            
            # Send message and get response
            if not history:
                response = chat.send_message(f"System Context:\n{system_prompt}\n\nUser Message: {new_message}")
            else:
                response = chat.send_message(new_message)
                
            return response.text
        except Exception as e:
            print(f"LLM Generative AI Error: {e}")
            
            # If a 404 error was returned, try to call a standard gemini-pro instance on-the-fly
            if "404" in str(e):
                try:
                    fallback_model = genai.GenerativeModel('gemini-pro')
                    chat = fallback_model.start_chat(history=formatted_history)
                    if not history:
                        response = chat.send_message(f"System Context:\n{system_prompt}\n\nUser Message: {new_message}")
                    else:
                        response = chat.send_message(new_message)
                    return response.text
                except Exception as inner_e:
                    return (
                        "😔 I apologize, but I encountered a model-not-found error communicating with the model.\n\n"
                        f"*Technical Detail:* `{str(inner_e)}`"
                    )

            return (
                "😔 I apologize, but I encountered an error communicating with my AI model.\n\n"
                f"*Technical Detail:* `{str(e)}`"
            )

llm_client = LLMClient()
