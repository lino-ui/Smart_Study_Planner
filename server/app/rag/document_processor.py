import io
import PyPDF2

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from a given file payload based on its extension.
    """
    filename_lower = filename.lower()
    text = ""
    
    if filename_lower.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
                
    elif filename_lower.endswith('.txt'):
        text = file_bytes.decode('utf-8', errors='ignore')
        
    else:
        raise ValueError("Unsupported file type. Only PDF and TXT are currently supported.")
        
    return text

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """
    Splits text into chunks of `chunk_size` characters with `chunk_overlap`.
    """
    if not text:
        return []
        
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - chunk_overlap)
        
    return chunks
