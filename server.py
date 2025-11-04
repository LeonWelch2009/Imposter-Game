from flask import Flask, render_template, jsonify
import os
from datetime import datetime
import random

app = Flask(__name__)

# File paths
script_dir = os.path.dirname(os.path.abspath(__file__))
words_file_path = os.path.join(script_dir, "words.txt")
audit_file_path = os.path.join(script_dir, "audit.txt")

# Load categories and words
def load_words():
    categories = {}
    current_category = None
    try:
        with open(words_file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.isupper():
                    current_category = line.capitalize()
                    categories[current_category] = []
                elif current_category:
                    categories[current_category].append(line.lower())
    except FileNotFoundError:
        categories = {}
    return categories

# Record game in audit.txt
def record_game(players, category, word, imposter):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(audit_file_path, 'a') as f:
            f.write(f"=== GAME STARTED ===\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write(f"Players: {', '.join(players)}\n")
            f.write(f"Selected Category: {category}\n")
            f.write(f"Selected Word: {word}\n")
            f.write(f"Imposter: {imposter}\n")
            f.write("="*40 + "\n\n")
    except Exception as e:
        print(f"Error writing to audit file: {e}")

# ---------------- Routes ----------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_words")
def get_words():
    return jsonify(load_words())

@app.route("/audit")
def get_audit():
    if not os.path.exists(audit_file_path):
        return jsonify({"audit": "No games recorded yet."})
    with open(audit_file_path, 'r') as f:
        return jsonify({"audit": f.read()})

# Run the server
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
