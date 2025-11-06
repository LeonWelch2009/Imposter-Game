from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

WORDS_FILE = "words.txt"
AUDIT_FILE = "audit.txt"

def load_categories():
    categories = {}
    current_category = None
    if os.path.exists(WORDS_FILE):
        with open(WORDS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.isupper():  # category line
                    current_category = line.capitalize()
                    categories[current_category] = []
                elif current_category:
                    categories[current_category].append(line.capitalize())
    return categories

def load_audit():
    logs = []
    if os.path.exists(AUDIT_FILE):
        with open(AUDIT_FILE, "r", encoding="utf-8") as f:
            logs = f.read().splitlines()
    return logs

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

@app.route("/audit")
def get_audit():
    return jsonify(load_audit())

if __name__ == "__main__":
    app.run(debug=True)
