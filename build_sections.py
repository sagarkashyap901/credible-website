#!/usr/bin/env python3
"""Generate section pages for Credible from a shared shell. v4"""

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Credible</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://credible-media.netlify.app/{fname}">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <meta property="og:site_name" content="Credible">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title} — Credible">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="https://credible-media.netlify.app/{fname}">
  <meta property="og:image" content="https://credible-media.netlify.app/og-card.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title} — Credible">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="https://credible-media.netlify.app/og-card.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <header class="topbar nav" aria-label="Primary">
    <div class="topbar-inner">
      <button class="hamburger" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
      <a class="brand" href="index.html">Credible<span class="dot"></span></a>
      <nav class="nav-links" id="nav-links">
        <a href="india.html"{a_india}>India</a>
        <a href="world.html"{a_world}>World</a>
        <a href="tech.html"{a_tech}>AI &amp; Tech</a>
        <a href="about.html">About</a>
      </nav>
      <div class="topbar-actions">
        <button class="search-btn" data-search-open aria-label="Search stories">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
        </button>
        <a class="btn btn-ghost" href="subscribe.html">Sign in</a>
        <a class="btn btn-accent" href="subscribe.html">Subscribe</a>
      </div>
    </div>
  </header>

  <main>
    <section class="page-head">
      <div class="container">
        <span class="eyebrow">Section</span>
        <h1>{h1}</h1>
        <p>{intro}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="row-list">
{rows}
        </div>
      </div>
    </section>
  </main>
"""

FOOT = """
  <footer class="footer">
    <div class="footer-inner">
      <div>
        <a class="brand" href="index.html">Credible<span class="dot"></span></a>
        <p class="tagline">Geopolitics, Indian politics, global affairs and technology — reported clearly, sourced carefully, built for a generation that fact-checks everything.</p>
      </div>
      <div>
        <h4>Sections</h4>
        <ul>
          <li><a href="india.html">India</a></li>
          <li><a href="world.html">World</a></li>
          <li><a href="tech.html">AI &amp; Tech</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About</a></li>
          <li><a href="author.html">Author</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms of Use</a></li>
          <li><a href="privacy.html#grievance">Grievance Officer</a></li>
          <li><a href="subscribe.html">Subscribe</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="mailto:hello@credible.news">hello@credible.news</a></li>
          <li><a href="#">Twitter / X</a></li>
          <li><a href="#">Instagram</a></li>
          <li><a href="#">YouTube</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-base">
      <span>© 2026 Credible Media. All rights reserved.</span>
      <span>Made in New Delhi 🇮🇳</span>
    </div>
  </footer>

  <!-- Search overlay -->
  <div class="search-overlay" role="dialog" aria-modal="true" aria-label="Search stories">
    <div class="search-panel">
      <div class="search-input-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
        <input type="text" placeholder="Search stories… (e.g. China, semiconductors)" aria-label="Search stories">
        <button class="esc" aria-label="Close search">ESC</button>
      </div>
      <div class="search-results"></div>
    </div>
  </div>

  <script src="js/articles.js"></script>
  <script src="js/search.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
"""

ROW = """          <article class="news-row reveal">
            <div>
              <h3><a href="{url}">{title}</a></h3>
              <span class="meta">{date}</span>
            </div>
            <a href="{url}" aria-label="{title}"><figure class="art art-{art}"></figure></a>
          </article>"""

URL = "japan-india-yen-handshake-summit-2026.html"

SECTIONS = {
    "india.html": {
        "title": "India",
        "desc": "Borders, defense, politics and the economy — India's strategic picture, decoded.",
        "h1": "India",
        "intro": "Borders, defense, politics and the economy — the strategic picture behind the headlines, minus the noise.",
        "articles": [
            (2, "Taksing, Explained: What Satellite Images Reveal About the New LAC Flashpoint", "2 Jul 2026"),
            (5, "From Importer to Arms Dealer: Inside India's Defense Export Surge", "1 Jul 2026"),
            (3, "FII Money Is Back. Here's What Changed Foreign Investors' Minds", "30 Jun 2026"),
            (6, "The Treaty in Suspension: One Year Since India Paused the IWT", "28 Jun 2026"),
            (1, "The 22-Kilometer Problem: Why the Chicken's Neck Keeps Planners Awake", "26 Jun 2026"),
            (4, "Delimitation Is Coming. The South Is Doing the Math", "24 Jun 2026"),
        ],
    },
    "world.html": {
        "title": "World",
        "desc": "From Hormuz to the High North — the power shifts shaping this decade, decoded.",
        "h1": "World",
        "intro": "From Hormuz to the High North — the alliances, conflicts and bargains shaping this decade, decoded.",
        "articles": [
            (1, "The Yen Handshake: How Tokyo and Delhi Are Quietly Rewiring Asian Money", "3 Jul 2026"),
            (4, "Six Months After the MOU: Is the US–Iran Ceasefire Actually Holding?", "30 Jun 2026"),
            (5, "NATO 3.0 Is Real Now — and It's Being Paid For in Euros, Not Dollars", "29 Jun 2026"),
            (3, "De-dollarization Is Slower Than the Hype — Except in One Corner of Asia", "28 Jun 2026"),
            (2, "The Taiwan Playbook Everyone Is Quietly Rehearsing", "27 Jun 2026"),
            (6, "Paris Extends the Umbrella: France's Nuclear Offer to Europe, One Year On", "25 Jun 2026"),
        ],
    },
    "tech.html": {
        "title": "AI & Tech",
        "desc": "Chips, compute and the new tech cold war — where silicon meets statecraft.",
        "h1": "AI & Tech",
        "intro": "Chips, compute and the new tech cold war — where silicon meets statecraft.",
        "articles": [
            (3, "Inside the Tata–ASML Deal That Could Make or Break India's Chip Dream", "1 Jul 2026"),
            (1, "India's 50,000-GPU Bet: Can Public Compute Compete With Big Tech?", "27 Jun 2026"),
            (5, "The Open-Weights Wars: Who Actually Benefits When Models Go Free?", "26 Jun 2026"),
            (6, "Who Controls the Rare Earths Your Phone Depends On?", "24 Jun 2026"),
            (2, "AMCA's Engine Problem, and the Deal That Might Solve It", "22 Jun 2026"),
            (4, "The Algorithm Is the Editor Now: How Feeds Decide What News Survives", "20 Jun 2026"),
        ],
    },
}

for filename, s in SECTIONS.items():
    active = {"a_india": "", "a_world": "", "a_tech": ""}
    key = "a_" + filename.split(".")[0]
    if key in active:
        active[key] = ' class="active"'
    rows = "\n".join(ROW.format(art=a, title=t, date=d, url=URL) for a, t, d in s["articles"])
    html = HEAD.format(title=s["title"], desc=s["desc"], h1=s["h1"],
                       intro=s["intro"], rows=rows, fname=filename, **active) + FOOT
    with open(filename, "w") as f:
        f.write(html)
    print("wrote", filename)
