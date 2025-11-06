from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

DATA_FOLDER = "data"

def load_categories():
    categories = {}
    for filename in os.listdir(DATA_FOLDER):
        if filename.endswith(".txt"):
            category_name = filename.replace(".txt", "").capitalize()
            with open(os.path.join(DATA_FOLDER, filename), "r", encoding="utf-8") as f:
                words = [line.strip() for line in f if line.strip()]
            categories[category_name] = words
    return categories

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/categories")
def get_categories():
    return jsonify(load_categories())

@app.route("/audit")
def audit():
    cats = load_categories()
    return "<br>".join([f"<b>{k}</b>: {len(v)} words" for k,v in cats.items()])

if __name__ == "__main__":
    app.run(debug=True)
