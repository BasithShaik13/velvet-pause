# The Velvet Pause

Premium wireless EV charging and hospitality hub website. Built with Python (Flask), deployable to Vercel.

> Preview website. Charging, bookings and payments are **not live**. Forms are validated, but submissions are not stored or emailed until you connect a backend.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                    # http://localhost:5000
```

## Edit content

- Text, services, locations, testimonials and **placeholder contact details**: `content.py`
- Page layout: `templates/index.html`, reusable components: `templates/_macros.html`
- Styling: `public/css/style.css`, behaviour: `public/js/main.js`
- Replace the illustrated amenity scenes with real photos by swapping the `scene()` macro for an `<img>` in `index.html`.
- To store or email form submissions, implement `handle_submission()` in `app.py` (database, email service or CRM). Vercel's filesystem is read-only, so do not write files.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: The Velvet Pause website"
git branch -M main
git remote add origin https://github.com/<your-username>/velvet-pause.git
git push -u origin main
```

## Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repository.
2. Leave the framework as detected (Flask / Python). No build command is needed.
3. Click **Deploy**. You get a link such as `https://velvet-pause.vercel.app`.

Every later `git push` redeploys automatically. Alternatively: `npm i -g vercel` then `vercel --prod`.
