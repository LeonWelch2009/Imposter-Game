from flask import Flask, jsonify, render_template, send_from_directory
import os
import re

app = Flask(__name__)

# Load categories from words.txt
def load_categories():
    categories = {}
    if not os.path.exists("words.txt"):
        return categories
    current_category = None
    with open("words.txt", "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line:
                continue
            # Category header lines like "FRUIT" or "FRUIT h"
            # Accept uppercase words and optional trailing "h" marker (case-insensitive)
            if re.match(r'^[A-Z\s]+(?:\s+[hH])?$', line):
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

# Serve static files (JS/CSS)
@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
