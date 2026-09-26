from translate import detect_and_translate

samples = [
    "बिजली की सप्लाई बंद किए बिना कर्मचारी ने काम शुरू किया।",       # Hindi
    "மின்சாரம் துண்டிக்கப்பட்டதை உறுதி செய்யாமல் பராமரிப்பு பணி தொடங்கப்பட்டது.",  # Tamil
    "विद्युत पुरवठा बंद असल्याची खात्री न करता देखभाल सुरू करण्यात आली.",  # Marathi
    "The worker did not lock out the machine before maintenance.",  # English
]

for text in samples:
    print("Original:", text)
    result = detect_and_translate(text)
    print("Detected language:", result.get("detected_language"))
    print("Detection method:", result.get("detection_method"))
    print("English translation:", result.get("english_translation"))
    print("-" * 60)