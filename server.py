from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

WORDS_FILE = "words.txt"

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

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

if __name__ == "__main__":
    app.run(debug=True)
