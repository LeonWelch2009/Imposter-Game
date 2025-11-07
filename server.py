from flask import Flask, render_template, jsonify, request
import random, os, datetime

app = Flask(__name__)

WORDS_FILE = "words.txt"
AUDIT_FILE = "audit_log.txt"

def load_categories():
    categories = {}
    current_category = None
    if os.path.exists(WORDS_FILE):
        with open(WORDS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                if line.isupper():  # category
                    current_category = line
                    categories[current_category] = []
                elif current_category:
                    categories[current_category].append(line)
    return categories

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

@app.route("/audit", methods=["POST"])
def audit_log():
    data = request.json
    entry = f"{datetime.datetime.now()} - {data.get('message')}\n"
    with open(AUDIT_FILE, "a", encoding="utf-8") as f:
        f.write(entry)
    return jsonify({"status": "logged"})

if __name__ == "__main__":
    app.run(debug=True)
