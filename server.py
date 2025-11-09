from flask import Flask, jsonify, render_template, send_from_directory
import os
import re

app = Flask(__name__)

# Load categories from words.txt
def load_categories():
    categories = {}
    if not os.path.exists("words.txt"):
        return categories
    with open("words.txt", "r", encoding="utf-8") as f:
        current_category = None
        for line in f:
            line = line.strip()
            if not line:
                continue
            # Accept uppercase headers like "FRUIT" or "FRUIT h" (h or H)
            if re.match(r'^[A-Z\s]+(?:\s+[hH])?$', line):
                current_category = line
                categories[current_category] = []
            elif line and current_category:
                categories[current_category].append(line)
    return categories

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

# Serve static files (JS/CSS)
@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
