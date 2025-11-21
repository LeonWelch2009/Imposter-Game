from flask import Flask, jsonify, render_template, send_from_directory
import os
import random

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
                
            # If line is ALL CAPS, it's a category header
            if line.isupper():
                current_category = line
                categories[current_category] = []
            elif current_category:
                # Split by pipe. First part is Word, rest are Hints.
                parts = line.split('|')
                word = parts[0].strip()
                
                # Get all hints provided. If none, default to Category Name.
                hints = [h.strip() for h in parts[1:]]
                if not hints:
                    hints = [current_category]
                
                categories[current_category].append({
                    "word": word,
                    "hints": hints 
                })
                
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