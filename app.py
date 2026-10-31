"""The Velvet Pause - premium EV charging hub website (Flask).

Runs locally with `python app.py` and deploys to Vercel as a Python serverless app.
Forms are validated on the server. Nothing is stored or sent anywhere yet:
connect a database / email service in `handle_submission` when you are ready.
"""
import os
import re
from datetime import datetime

from flask import Flask, jsonify, render_template, request

from content import SITE

app = Flask(
    __name__,
    static_folder="public",   # Vercel serves /public from its CDN; Flask does the same locally
    static_url_path="",
    template_folder="templates",
)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9\s\-()]{7,18}$")

FIELD_RULES = {
    "booking": {
        "required": ["name", "phone", "email", "ev_model", "location", "datetime"],
    },
    "partnership": {
        "required": ["name", "organisation", "partner_type", "email", "message"],
    },
    "contact": {
        "required": ["name", "email", "message"],
    },
}


def validate(kind: str, data: dict) -> dict:
    """Return {field: error message}. Empty dict means valid."""
    errors = {}
    for field in FIELD_RULES[kind]["required"]:
        if not str(data.get(field, "")).strip():
            errors[field] = "This field is required."

    email = str(data.get("email", "")).strip()
    if email and not EMAIL_RE.match(email):
        errors["email"] = "Enter a valid email address."

    phone = str(data.get("phone", "")).strip()
    if phone and (not PHONE_RE.match(phone) or len(re.sub(r"\D", "", phone)) < 7):
        errors["phone"] = "Enter a valid phone number."

    if kind == "booking" and "datetime" not in errors:
        try:
            when = datetime.fromisoformat(str(data["datetime"]))
            if when < datetime.now():
                errors["datetime"] = "Choose a future date and time."
        except ValueError:
            errors["datetime"] = "Enter a valid date and time."

    for field in ("name", "message", "organisation", "ev_model"):
        if len(str(data.get(field, ""))) > 1000:
            errors[field] = "Too long."
    return errors


def handle_submission(kind: str, data: dict) -> None:
    """Hook for real integrations (database, email, CRM). Currently a no-op."""
    return None


MESSAGES = {
    "booking": "Booking request received. This is a demo preview: charging bookings are not live yet, "
               "so no slot is reserved and no payment is taken.",
    "partnership": "Thank you. Your enquiry passed validation. This is a preview, so it has not been stored or sent yet.",
    "contact": "Thank you. Your message passed validation. This is a preview, so it has not been stored or sent yet.",
}


@app.get("/")
def home():
    return render_template("index.html", site=SITE)


@app.get("/privacy")
def privacy():
    return render_template("legal.html", site=SITE, page="privacy")


@app.get("/terms")
def terms():
    return render_template("legal.html", site=SITE, page="terms")


@app.post("/api/<kind>")
def submit(kind):
    if kind not in FIELD_RULES:
        return jsonify(ok=False, message="Unknown form."), 404
    data = request.get_json(silent=True) or request.form.to_dict()
    if str(data.get("website", "")).strip():          # honeypot for bots
        return jsonify(ok=True, message=MESSAGES[kind])
    errors = validate(kind, data)
    if errors:
        return jsonify(ok=False, errors=errors, message="Please fix the highlighted fields."), 400
    handle_submission(kind, data)
    return jsonify(ok=True, message=MESSAGES[kind])


@app.get("/health")
def health():
    return jsonify(status="ok")


@app.errorhandler(404)
def not_found(_e):
    return render_template("legal.html", site=SITE, page="404"), 404


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
