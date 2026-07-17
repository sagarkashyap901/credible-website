/* CREDIBLE — articles.js
   ONE list of every article on the site. This powers the search.
   ─────────────────────────────────────────────────────────────
   HOW TO PUBLISH A NEW ARTICLE:
   1. Copy article-template.html → e.g. my-new-story.html
   2. Write your piece in that file (title, standfirst, body).
   3. Add ONE entry to the TOP of this list:
      { title: "...", url: "my-new-story.html", section: "India",
        excerpt: "...", date: "Jul 05 2026" },
   4. Optionally add a card for it on index.html / its section page.
   5. Re-deploy (git add -A && git commit -m "..." && git push). Done — it's live and searchable.
*/

window.CREDIBLE_ARTICLES = [
  {
    title: "The Hormuz Escape: How Saudi Arabia and the UAE Are Rebuilding Gulf Oil Geography Around a Blocked Strait",
    url: "hormuz-escape-gulf-bypass.html",
    section: "World",
    excerpt: "One nation has already hit a wall, the other is spending billions to make sure it never does — inside the opposing strategies to route around a blocked strait.",
    date: "18 Jul 2026"
  },
  {
    title: "Trump Weighs Widest Escalation Yet in Iran War, as Tehran Threatens a Second Front at Bab al-Mandeb",
    url: "trump-iran-escalation.html",
    section: "World",
    excerpt: "Options briefed to the president include seizing an Iranian oil island and bombing a nuclear site deeper than Fordow, as Iran signals it could shut a second global chokepoint.",
    date: "17 Jul 2026"
  },
  {
    title: "India, China Face 100% Tariffs While Europe's Russian Gas Imports Hit a Record",
    url: "graham-tariff-hypocrisy.html",
    section: "World",
    excerpt: "The bill written in Lindsey Graham's memory targets Russia's two largest crude buyers — while the EU imports Russian gas at an all-time high, exempted by the same text.",
    date: "16 Jul 2026"
  },
  {
    title: "New War Erupts in the Middle East: Saudi Arabia and Houthis Attack Each Other",
    url: "saudi-yemen-truce-collapse.html",
    section: "World",
    excerpt: "A dispute over one Iranian aircraft has unraveled Yemen's longest period of calm since 2015, pulling Pakistan's new defense pact with Riyadh into an active theater.",
    date: "15 Jul 2026"
  },
  {
    title: "Trump Declares U.S. 'Guardian' of Hormuz, Reimposes Iran Blockade, Demands Payment for Securing the Strait",
    url: "trump-hormuz-guardian-fee.html",
    section: "World",
    excerpt: "Washington will charge 20% of cargo value to secure the Strait of Hormuz and is reinstating its Iran blockade — a proposal with no legal precedent.",
    date: "14 Jul 2026"
  },
  {
    title: "The Nuclear Line Beijing Won't Let Moscow Cross",
    url: "china-russia-nuclear-warning.html",
    section: "World",
    excerpt: "A private rebuke relayed through three governments, an \"ultimatum\" Zelenskyy says China delivered to Moscow, and a Pentagon that sees rhetoric, not readiness.",
    date: "13 Jul 2026"
  },
  {
    title: "Trump: US Will 'Destroy' Iran If I'm Assassinated",
    url: "iran-hormuz-deadline-crisis.html",
    section: "World",
    excerpt: "President says 1,000 missiles are aimed at Tehran as Washington gives Iran until Saturday to renounce attacks on shipping in the strait.",
    date: "12 Jul 2026"
  },
  {
    title: "Iran Weighed Fresh Plot to Kill Trump, Israeli Intelligence Warns, as Tehran Ties Fray",
    url: "iran-trump-assassination-plot.html",
    section: "World",
    excerpt: "A new Israeli intelligence warning about an Iranian plot to assassinate Trump arrives as Washington and Jerusalem clash over how far to push the campaign against Tehran.",
    date: "11 Jul 2026"
  },
  {
    title: "The Two-Port Trap: How Sabang and Great Nicobar Are Quietly Closing In On China's Biggest Weakness",
    url: "sabang-port-india-indonesia-strategy.html",
    section: "India",
    excerpt: "A port deal, a missile package and an air-force upgrade now sit on either side of the world's most valuable chokepoint — and Beijing has no good answer to any of it.",
    date: "10 Jul 2026"
  },
  {
    title: "The Widening Rift: Inside the Deepest US-Saudi Crisis in Years",
    url: "us-saudi-rift-analysis.html",
    section: "World",
    excerpt: "A botched military operation, a threatened arms cutoff and a public insult have exposed the limits of America's oldest Gulf partnership.",
    date: "7 Jul 2026"
  },
  {
    title: "The Yen Handshake: How Tokyo and Delhi Are Quietly Rewiring Asian Money",
    url: "japan-india-yen-handshake-summit-2026.html",
    section: "World",
    excerpt: "Rupee–yen settlement, a chip pact and a minerals bargain — the summit that actually mattered, in three charts.",
    date: "3 Jul 2026"
  }
];
