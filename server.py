from flask import Flask, render_template, jsonify, request
import os
from datetime import datetime
import random

app = Flask(__name__)

# Absolute paths to your files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORDS_FILE = os.path.join(BASE_DIR, "words.txt")
AUDIT_FILE = os.path.join(BASE_DIR, "audit.txt")

# Load words into a dict: {category: [words]}
def load_categories():
    categories = {}
    current_category = None
    try:
        with open(WORDS_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.isupper():
                    current_category = line.capitalize()
                    categories[current_category] = []
                elif current_category is not None:
                    categories[current_category].append(line)
        return categories
    except FileNotFoundError:
        return {}

# Routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_categories")
def get_categories():
    return jsonify(load_categories())

@app.route("/record_start", methods=["POST"])
def record_start():
    data = request.get_json()
    try:
        with open(AUDIT_FILE, "a") as f:
            f.write(f"=== GAME STARTED ===\n")
            f.write(f"Timestamp: {datetime.now()}\n")
            f.write(f"Players: {', '.join(data['players'])}\n")
            f.write(f"Available Categories: {', '.join(data['availableCategories'])}\n")
            f.write(f"Selected Category: {data['currentCategory']}\n")
            f.write(f"Selected Word: {data['currentWord']}\n")
            f.write(f"Imposter: {data['imposter']}\n")
            f.write("-" * 50 + "\n")
        return "Recorded start", 200
    except Exception as e:
        return str(e), 500

@app.route("/record_end", methods=["POST"])
def record_end():
    data = request.get_json()
    try:
        with open(AUDIT_FILE, "a") as f:
            f.write(f"=== GAME ENDED ===\n")
            f.write(f"Timestamp: {datetime.now()}\n")
            f.write(f"Imposter was: {data['imposter']}\n")
            f.write(f"Word was: {data['word']}\n")
            f.write("=" * 50 + "\n\n")
        return "Recorded end", 200
    except Exception as e:
        return str(e), 500

@app.route("/audit")
def audit():
    if os.path.exists(AUDIT_FILE):
        with open(AUDIT_FILE, "r") as f:
            content = f.read()
        return f"<pre>{content}</pre>"
    return "<pre>No audit data found.</pre>"

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
