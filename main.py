import streamlit as st
import os
import google.generativeai as genai
from PIL import Image
import io

# Setup page config
st.set_page_config(page_title="ExamZen - Examiner Assistant", layout="wide", initial_sidebar_state="expanded")

# Custom CSS for dark theme styling similar to the React version
st.markdown("""
    <style>
    .main { background-color: #1F1F1F; color: #E8D6D9; }
    .stButton>button { width: 100%; border-radius: 12px; height: 3em; background-color: #A8B5A6; color: #1F1F1F; font-weight: bold; border: none; }
    .stButton>button:hover { background-color: #97a395; }
    .stExpander { border-radius: 12px; background-color: #2A2A2A; border: 1px solid #363636; }
    .css-1offfwp { background-color: #1F1F1F !important; }
    </style>
    """, unsafe_content_html=True)

def initialize_ai():
    api_key = os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        st.error("GOOGLE_API_KEY not found in environment variables.")
        return None
    genai.configure(api_key=api_key)
    # Using gemini-3-flash-preview as requested for speed and multimodal capabilities
    return genai.GenerativeModel('gemini-3-flash-preview')

def main():
    st.title("🎓 ExamZen Student Assistant")
    st.subheader("Analyze Full Chapters with AI Examiner")

    model = initialize_ai()
    if not model:
        return

    # Sidebar for instructions
    with st.sidebar:
        st.header("Instructions")
        st.write("1. Upload sequential pages of your chapter.")
        st.write("2. Ensure images are clear and readable.")
        st.write("3. Click 'Analyze Full Chapter' to get a summary and top questions.")
        st.divider()
        st.info("Uses Gemini 3 Flash for near-instant analysis.")

    # Multi-page upload
    uploaded_files = st.file_uploader(
        "Upload Chapter Pages (10+ images supported)", 
        type=["png", "jpg", "jpeg"], 
        accept_multiple_files=True
    )

    if uploaded_files:
        images = []
        for uploaded_file in uploaded_files:
            image = Image.open(uploaded_file)
            images.append(image)

        # Gallery Expander
        with st.expander(f"Preview Uploaded Pages ({len(uploaded_files)})", expanded=True):
            cols = st.columns(4)
            for i, img in enumerate(images):
                cols[i % 4].image(img, caption=f"Page {i+1}", use_column_width=True)

        # Analyze Button
        if st.button("Analyze Full Chapter"):
            with st.spinner("Analyzing chapter as a strict Exam Examiner..."):
                try:
                    # Preparation of parts: images + prompt
                    prompt = """Act as a strict Exam Examiner. Read these sequential pages of a chapter. 
                    Provide a comprehensive summary of the topics covered. 
                    Then, list the Top 10 Most Likely Exam Questions based on this content."""
                    
                    # Generate content with list of PIL Images + Text
                    response = model.generate_content([prompt] + images)
                    
                    # UI Display
                    st.divider()
                    st.markdown("### 📋 Examiner's Report")
                    st.markdown(response.text)
                    
                    st.success("Analysis complete!")
                except Exception as e:
                    st.error(f"An error occurred: {str(e)}")
    else:
        st.info("👆 Start by uploading your chapter images above.")

if __name__ == "__main__":
    main()
