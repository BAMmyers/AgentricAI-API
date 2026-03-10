import os
from ollama import Client
from typing import Optional

# Ollama configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("AGENTRICAI_MODEL", "lacy:latest")
FALLBACK_MODEL = "AgentricAIcody:latest"

client = Client(host=OLLAMA_HOST)
conversation_history = []

def get_available_model() -> str:
    """Check and return the first available model from priority list."""
    models_to_try = [DEFAULT_MODEL, FALLBACK_MODEL]
    
    try:
        response = client.list()
        available_models = [m["name"] for m in response.get("models", [])]
        for model in models_to_try:
            if model in available_models:
                return model
    except Exception as e:
        print(f"Warning: Could not fetch available models: {e}")
    
    return DEFAULT_MODEL

def chat_to_code(user_message: str, model: Optional[str] = None) -> str:
    """Convert chat input to code generation requests using Ollama."""
    if model is None:
        model = get_available_model()
    
    conversation_history.append({
        "role": "user",
        "content": user_message
    })
    
    try:
        response = client.chat(
            model=model,
            messages=conversation_history,
            system="You are a code generation assistant for the AgentricAI ecosystem. Convert user requests into clean, functional Python code. Always provide code in markdown blocks. Focus on scalability, maintainability, and integration with AgentricAI workflows."
        )
        
        assistant_message = response["message"]["content"]
        conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })
        
        return assistant_message
    
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    """Main conversation loop for AgentricAI chat-to-code."""
    print("=" * 60)
    print("AgentricAI Chat to Code Generator (Ollama)")
    print("=" * 60)
    print(f"Ollama Host: {OLLAMA_HOST}")
    
    model = get_available_model()
    print(f"Model: {model}")
    print("Commands: 'exit' to quit, 'clear' to reset conversation")
    print("=" * 60 + "\n")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if not user_input:
                continue
            if user_input.lower() == "exit":
                print("Exiting AgentricAI Chat to Code Generator.")
                break
            if user_input.lower() == "clear":
                conversation_history.clear()
                print("Conversation cleared.\n")
                continue
            
            print(f"\n[Using model: {model}]")
            print("Generating response...\n")
            response = chat_to_code(user_input, model)
            print(f"Assistant:\n{response}\n")
        
        except KeyboardInterrupt:
            print("\n\nExiting AgentricAI Chat to Code Generator.")
            break
        except Exception as e:
            print(f"Error: {str(e)}\n")

if __name__ == "__main__":
    main()