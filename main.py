import streamlit as st
import os
import time
import google.generativeai as genai
from PIL import Image

# --- 1. App Configuration ---
st.set_page_config(page_title="ExamZen", page_icon="🎓", layout="wide")

# --- 2. API Setup & Error Handling ---
def configure_genai():
    """
    Configures the Gemini API.
    Checks os.environ first, then st.secrets.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    
    # Check Streamlit secrets if env var is missing (common in Streamlit Cloud)
    if not api_key:
        try:
            if "GOOGLE_API_KEY" in st.secrets:
                api_key = st.secrets["GOOGLE_API_KEY"]
        except FileNotFoundError:
            pass # No secrets file found

    if not api_key:
        st.error("⚠️ API Key not found in Environment Variables or Secrets.")
        st.warning("Please set GOOGLE_API_KEY in your .env file or Streamlit secrets.")
        st.stop() # Stop execution here
        return False
    
    try:
        genai.configure(api_key=api_key)
        return True
    except Exception as e:
        st.error(f"⚠️ Failed to configure Gemini API: {e}")
        return False

# Run configuration once at the start
if configure_genai():
    # Model Initialization
    # using gemini-1.5-flash as requested for stability and speed
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# --- Helper: Retry Logic for Quota Errors ---
def retry_api_call(call_function, retries=10, delay=5):
    """
    Retries the API call with exponential backoff if a quota error (429) occurs.
    """
    last_exception = None
    for attempt in range(retries):
        try:
            return call_function()
        except Exception as e:
            last_exception = e
            error_message = str(e).lower()
            # Check for standard 429 or Quota keywords in the exception message
            if "429" in error_message or "quota" in error_message or "resource_exhausted" in error_message:
                if attempt < retries - 1:
                    time.sleep(delay)
                    delay = min(delay * 2, 60) # Exponential backoff capped at 60s
                    continue
            # If it's not a quota error, raise immediately
            raise e
    # If max retries reached, raise the last exception
    raise last_exception

# --- 3. Feature Functions ---

def analyze_image(image):
    """Scanner: Analyze image in Bengali with Error Handling."""
    if not model: return
    
    prompt = """
    You are an expert student assistant and teacher. 
    Analyze the provided image (textbook page or exam paper).
    
    Tasks:
    1. Summarize the key concepts found in the image.
    2. If there are questions, provide the solutions.
    
    CRITICAL: The entire output must be in BENGALI (Bangla) language.
    """
    try:
        with st.spinner("Analyzing document in Bengali..."):
            # Wraps the generation call in retry logic
            response = retry_api_call(lambda: model.generate_content([prompt, image]))
            return response.text
    except Exception as e:
        st.error(f"Error calling Gemini API: {e}")
        return None

def generate_quiz(topic):
    """Quiz: Generate MCQs with Error Handling."""
    if not model: return

    prompt = f"""
    Create a detailed 5-question Multiple Choice Quiz (MCQ) about: "{topic}".
    For each question, provide:
    1. The Question
    2. 4 Options
    3. The Correct Answer
    4. A brief explanation.
    
    CRITICAL: The entire output must be in BENGALI (Bangla).
    """
    try:
        with st.spinner("Generating Quiz..."):
            response = retry_api_call(lambda: model.generate_content(prompt))
            return response.text
    except Exception as e:
        st.error(f"Error calling Gemini API: {e}")
        return None

def translate_content(text, target_lang):
    """Translator: Translate text with Error Handling."""
    if not model: return

    prompt = f"""
    Translate the following academic text into {target_lang}.
    Maintain a formal, educational tone suitable for students.
    
    Text to translate:
    {text}
    """
    try:
        with st.spinner("Translating..."):
            response = retry_api_call(lambda: model.generate_content(prompt))
            return response.text
    except Exception as e:
        st.error(f"Error calling Gemini API: {e}")
        return None

# --- 4. Main Application Interface ---
def main():
    # --- Sidebar Navigation ---
    with st.sidebar:
        st.title("🎓 ExamZen")
        st.write("Student AI Assistant")
        
        # Navigation Menu
        menu = st.radio(
            "Navigation", 
            ["📸 Question Scanner", "🧠 Interactive Quiz", "📝 Smart Notes", "🌐 Translator"]
        )
        
        st.markdown("---")
        st.info("✅ System Status: Active")

    # --- View: Question Scanner ---
    if menu == "📸 Question Scanner":
        st.header("📸 Question Scanner")
        st.write("Upload a photo of your note or question paper for instant analysis in Bengali.")
        
        uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])
        
        if uploaded_file is not None:
            try:
                image = Image.open(uploaded_file)
                col1, col2 = st.columns([1, 2])
                
                with col1:
                    st.image(image, caption='Uploaded Document', use_column_width=True)
                
                with col2:
                    if st.button("🔍 Analyze with AI", type="primary"):
                        result = analyze_image(image)
                        if result:
                            st.markdown("### 📝 Analysis Result")
                            st.markdown(result)
            except Exception as img_err:
                 st.error(f"Error processing image file: {img_err}")

    # --- View: Interactive Quiz ---
    elif menu == "🧠 Interactive Quiz":
        st.header("🧠 Interactive Quiz Generator")
        st.write("Enter a topic to generate a practice quiz.")
        
        topic = st.text_input("Enter Topic (e.g., Physics Motion, History of Bengal)")
        
        if st.button("Generate Quiz") and topic:
            quiz_content = generate_quiz(topic)
            if quiz_content:
                st.markdown("---")
                st.markdown(quiz_content)

    # --- View: Smart Notes ---
    elif menu == "📝 Smart Notes":
        st.header("📝 Quick Notes")
        st.write("Jot down your thoughts. (Notes are saved for this session only).")
        
        if 'notes' not in st.session_state:
            st.session_state['notes'] = ""
            
        st.session_state['notes'] = st.text_area(
            "Your Study Notes", 
            value=st.session_state['notes'], 
            height=400
        )
        if st.button("Save Note"):
            st.success("Notes updated in session.")

    # --- View: Translator ---
    elif menu == "🌐 Translator":
        st.header("🌐 Smart Translator")
        st.write("Translate study materials instantly.")
        
        col1, col2 = st.columns(2)
        with col1:
            text_input = st.text_area("Enter text to translate", height=200)
        with col2:
            target_lang = st.selectbox("Target Language", ["Bengali", "English", "Spanish", "Hindi", "Arabic"])
            if st.button("Translate Now", type="primary") and text_input:
                translation = translate_content(text_input, target_lang)
                if translation:
                    st.markdown("### Output:")
                    st.info(translation)

if __name__ == '__main__':
    main()
