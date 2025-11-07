from flask import Flask, jsonify, render_template
import os

app = Flask(__name__)

WORDS_FILE = "words.txt"

def load_categories():
    categories = {}
    if not os.path.exists(WORDS_FILE):
        return categories

    with open(WORDS_FILE, "r", encoding="utf-8") as f:
        current_category = None
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.endswith(":"):  # new category
                current_category = line[:-1].strip()
                categories[current_category] = []
            elif current_category:
                categories[current_category].append(line)
    return categories

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    categories = load_categories()
    return jsonify(categories)

if __name__ == "__main__":
    app.run(debug=True)
