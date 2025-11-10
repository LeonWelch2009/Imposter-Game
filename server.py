from flask import Flask, jsonify, render_template, send_from_directory
import os

app = Flask(__name__)

# Load categories from words.txt
def load_categories():
    categories = {}
    if not os.path.exists("words.txt"):
        return categories
    with open("words.txt", "r", encoding="utf-8") as f:
        current_category = None
        hidden_hint = False
        for line in f:
            line = line.strip()
            if line and line[0].isupper():
                parts = line.split()
                current_category = parts[0]
                hidden_hint = len(parts) > 1 and parts[1].lower() == 'h'
                categories[current_category] = {"words": [], "hidden_hint": hidden_hint}
            elif line and current_category:
                categories[current_category]["words"].append(line)
    return categories

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

# Serve static files
@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
