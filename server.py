from flask import Flask, jsonify, render_template, send_from_directory
import os

app = Flask(__name__)

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
            # Category header (uppercase lines)
            if line.isupper():
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

@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
