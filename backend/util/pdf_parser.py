import re
import fitz  # PyMuPDF

# Common non-medicine keywords to filter out
COMMON_NON_MED_FIELDS = [
    "patient", "name", "date", "age", "gender", "dr", "doctor",
    "rx", "prescription", "diagnosis", "signature", "advice", "review", "address"
]

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text


def clean_extracted_text(text: str) -> str:
    # Remove non-informative characters and multiple spaces
    cleaned = re.sub(r'[^\x00-\x7F]+', ' ', text)  # remove non-ASCII
    cleaned = re.sub(r'\s+', ' ', cleaned)         # collapse whitespace
    return cleaned.strip()


def extract_medicine_and_qty(text: str) -> list[dict]:
    medicines = []
    seen = set()

    print("🧾 Cleaned Text:\n", text)

    for line in text.split('\n'):
        original = line.strip().lower()
        print("🔍 Line:", original)

        # Allow lines even with metadata if they also contain valid patterns
        med_matches = re.findall(r"([a-zA-Z\s]+)[-:\s]*(\d+\s*(mg|ml|mcg|g))", original)

        for match in med_matches:
            name = match[0].strip()
            qty = match[1].strip()

            name = name.replace("tab", "").replace("capsule", "").replace("tablet", "")
            name = re.sub(r'\s+', ' ', name).strip()

            key = f"{name}_{qty}"
            if name and key not in seen:
                seen.add(key)
                print(f"✅ Matched: {name} - {qty}")
                medicines.append({"medicine": name, "quantity": qty})

    print("📦 Extracted Medicines:", medicines)
    return medicines
