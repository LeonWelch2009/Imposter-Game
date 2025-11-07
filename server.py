from flask import Flask, render_template, jsonify, request
import os
from datetime import datetime

app = Flask(__name__)

WORDS_FILE = "words.txt"
AUDIT_FILE = "audit.txt"

# === Load categories with hint detection ===
def load_categories():
    categories = {}
    current_category = None
    current_hint = False

    if os.path.exists(WORDS_FILE):
        with open(WORDS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.isupper():  # category line
                    hint = line.endswith("H")
                    clean_name = line.rstrip("H").strip().capitalize()
                    categories[clean_name] = {"words": [], "hint": hint}
                    current_category = clean_name
                    current_hint = hint
                elif current_category:
                    categories[current_category]["words"].append(line.capitalize())
    return categories

# === Audit handling ===
def load_audit():
    logs = []
    if os.path.exists(AUDIT_FILE):
        with open(AUDIT_FILE, "r", encoding="utf-8") as f:
            logs = f.read().splitlines()
    return logs

def append_audit(entry):
    with open(AUDIT_FILE, "a", encoding="utf-8") as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"[{timestamp}] {entry}\n")

# === Routes ===
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

@app.route("/audit")
def get_audit():
    return jsonify(load_audit())

@app.route("/log_game", methods=["POST"])
def log_game():
    data = request.json
    players = data.get("players", [])
    imposters = data.get("imposters", [])
    category = data.get("category", "")
    word = data.get("word", "")
    entry = f"Players: {players}, Imposters: {imposters}, Category: {category}, Word: {word}"
    append_audit(entry)
    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)
