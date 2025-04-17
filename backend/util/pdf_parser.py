import re
import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_medicine_names(text: str) -> list[str]:
    lines = text.lower().splitlines()
    medicines = []

    for line in lines:
        line = line.strip()
        if len(line) < 3:
            continue

        
        match = re.match(r"^\d+\.\s*([a-zA-Z\s]+)", line)
        if match:
            name = match.group(1).strip()
            if name:
                
                clean_name = re.split(r"\d+mg|\d+ml|\d+mcg|\d+g", name)[0].strip()
                medicines.append(clean_name)

    return list(set(medicines))  
