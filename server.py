from flask import Flask, render_template, jsonify, request
import random, datetime, os

app = Flask(__name__)

WORDS_FILE = "words.txt"
AUDIT_FILE = "audit.txt"

def load_words():
    categories = {}
    current = None
    with open(WORDS_FILE) as f:
        for line in f:
            line = line.strip()
            if not line: continue
            if line.isupper():
                current = line.capitalize()
                categories[current] = []
            else:
                categories[current].append(line)
    return categories

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_words")
def get_words():
    return jsonify(load_words())

@app.route("/log_game", methods=["POST"])
def log_game():
    data = request.json
    with open(AUDIT_FILE, "a") as f:
        f.write(f"{datetime.datetime.now()} — {data}\n")
    return jsonify(success=True)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
