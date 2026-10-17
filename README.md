# LivingPixel — Bespoke Samsung Tizen OS Applications

A high-performance, dark-mode single-page landing page engineered for **LivingPixel** (lead engineer: Lubos Kostros). Showcases bespoke Samsung Smart TV application development, OTT video streaming with AVPlay/DRM, commercial digital signage (SSSP), and specialized Tizen OS architecture consulting.

## 🚀 Live Preview & Features

- **Interactive 10-Foot Spatial TV Simulator**: Real-time virtual TV screen with a tactile Samsung Smart Remote simulator (D-pad directional control, audio synthesis click feedback, power standby, and key event handling).
- **Interactive Project Scope & Timeline Estimator**: Instant estimation calculator for OTT streaming, commercial signage, Web-to-Tizen migration, and store certification audits with automated breakdown and consultation form autofill.
- **Direct Client Inquiries**: Frictionless direct email integration with `lubos.kostros@cadline.co.uk`, one-click copy to clipboard with toast notification, and pre-formatted consultation mailto dispatch.
- **Production Showcase**: High-resolution photorealistic Samsung TV mockups running 4K HDR media playback, enterprise hospitality dashboards, and interactive health/fitness TV experiences.
- **Ultra-Fast Single Page**: Pure Vanilla HTML5, CSS3, and JavaScript — zero heavy framework dependencies, loads instantly, and runs directly on GitHub Pages.

---

## 📁 Project Structure

```text
livingpixel/
├── index.html                  # Semantic single-page structure with SEO & OpenGraph tags
├── style.css                   # Glassmorphism, OLED dark theme, and responsive design system
├── app.js                      # TV simulator, remote synth audio, estimator & contact logic
├── README.md                   # Setup and GitHub Pages deployment guide
└── assets/
    └── images/
        ├── hero-tv.jpg         # Samsung 4K OLED Smart TV with LivingPixel OTT Interface
        ├── signage-tv.jpg      # Samsung SSSP Enterprise Hospitality & Signage Display
        └── interactive-tv.jpg  # Interactive Fitness & Biometric Telemetry TV App
```

---

## 🌐 Deploy to Your GitHub Account (GitHub Pages)

You can publish this landing page for free on GitHub Pages in 2 minutes:

### Option A: As your Personal/Organization Portfolio (`username.github.io`)
1. Create a new repository on your GitHub account named:
   `<your-github-username>.github.io`
2. Push the files in this directory to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial release of LivingPixel Samsung TV landing page"
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/<your-github-username>.github.io.git
   git push -u origin main
   ```
3. Your landing page will immediately be live at `https://<your-github-username>.github.io`!

### Option B: As a Project Repository (`username.github.io/livingpixel`)
1. Create a repository named `livingpixel` (or `samsung-tv-apps`).
2. Push the files to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Deploy LivingPixel landing page"
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/livingpixel.git
   git push -u origin main
   ```
3. In your GitHub repository settings:
   - Go to **Settings** &rarr; **Pages**.
   - Under **Build and deployment**, select **Deploy from a branch**.
   - Set Branch to `main` / `root` and click **Save**.
4. Your site will be live at `https://<your-github-username>.github.io/livingpixel/`.

---

## 💻 Local Testing

You can open `index.html` directly in any browser:
- Double click `index.html` in your file explorer, or
- Run a lightweight local HTTP server:
  ```bash
  # Using Python
  python -m http.server 8080

  # Or using Node.js npx
  npx serve .
  ```
- Navigate to `http://localhost:8080` in your web browser.

---

## 🎨 Customizing Details

- **GitHub Profile Link**: In `index.html`, search for `https://github.com` and replace with your exact GitHub handle (e.g., `https://github.com/yourusername`).
- **Contact Email**: The email is currently configured to `lubos.kostros@cadline.co.uk`. You can update this in `index.html` and `app.js` whenever needed.
- **Showcase Items**: Add your upcoming apps or live Samsung TV Store links into the `#showcase` section cards.
