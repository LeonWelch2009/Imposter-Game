from flask import Flask, render_template, request, jsonify
import os
import random
from datetime import datetime

app = Flask(__name__)

WORDS_FILE = "words.txt"
AUDIT_FILE = "audit.txt"


# -------------------------------
# Load categories from words.txt
# -------------------------------
def load_words():
    categories = {}
    if not os.path.exists(WORDS_FILE):
        return categories

    current_category = None
    with open(WORDS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue  # skip blank lines

            # If line is all uppercase letters, treat as a category
            if line.isupper():
                current_category = line
                categories[current_category] = []
            elif current_category:
                categories[current_category].append(line)
    return categories


# -------------------------------
# Log completed games to audit.txt
# -------------------------------
def log_audit(players, imposters, category, word):
    with open(AUDIT_FILE, "a", encoding="utf-8") as f:
        f.write(
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
            f"Players: {', '.join(players)} | Imposters: {', '.join(imposters)} | "
            f"Category: {category} | Word: {word}\n"
        )


# -------------------------------
# Routes
# -------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/get_words")
def get_words():
    categories = load_words()
    return jsonify(categories)


@app.route("/audit", methods=["POST"])
def audit():
    data = request.get_json()
    players = data.get("players", [])
    imposters = data.get("imposters", [])
    category = data.get("category", "")
    word = data.get("word", "")
    log_audit(players, imposters, category, word)
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
