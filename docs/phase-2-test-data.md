# Phase 2 — Test Campaign Data

Use these pre-filled examples to test each campaign format. Set **Campaign Status: OFF** to save without triggering, or **ON** to test live generation.

---

## Site Persona (Settings → General)

Fill these in **before** creating any campaigns:

| Field | Value |
|---|---|
| **Site Title** | TechPulse |
| **Site For** | Developers, tech enthusiasts, and IT professionals looking for practical guides, reviews, and industry insights |
| **Detailed Site Information** | TechPulse is a technology blog covering software development, cloud computing, AI tools, gadgets, and developer productivity. We publish beginner-friendly tutorials, in-depth comparisons, and industry trend analysis for a technical audience. |

### Content Generation Preferences

| Field | Value |
|---|---|
| **Content Tone** | Professional |
| **Target Demographic** | Intermediate |

---

## 1. Standard — Blog Post

| Field | Value |
|---|---|
| **Name** | Future of Edge Computing |
| **Keywords** | edge computing trends 2026, IoT edge processing, cloud vs edge architecture |
| **Campaign Format** | Standard |
| **Posts Target** | 1 |
| **Repeat Every** | 1 Day(s) |
| **Start Date** | Today, current time |
| **Use Summary as Excerpt** | ON |
| **Campaign Status** | ON |

**Expected output:** A standard blog post with introduction, 4-6 headed sections about edge computing trends, and conclusion.

---

## 2. Top List — Numbered Listicle

| Field | Value |
|---|---|
| **Name** | Best VS Code Extensions |
| **Keywords** | best VS Code extensions for developers, productivity plugins, code editor tools |
| **Campaign Format** | Top List |
| **Number of List Items** | 5 |
| **Posts Target** | 1 |
| **Repeat Every** | 1 Day(s) |
| **Start Date** | Today, current time |
| **Use Summary as Excerpt** | ON |
| **Campaign Status** | ON |

**Expected output:** A listicle with 5 numbered items, each with an H3 subheading and 2-3 paragraphs about a VS Code extension.

---

## 3. Guide — Step-by-Step Tutorial

| Field | Value |
|---|---|
| **Name** | Deploy a Node.js App |
| **Keywords** | how to deploy Node.js app, cloud deployment tutorial, server setup for Node |
| **Campaign Format** | Guide |
| **Posts Target** | 1 |
| **Repeat Every** | 1 Day(s) |
| **Start Date** | Today, current time |
| **Use Summary as Excerpt** | ON |
| **Campaign Status** | ON |

**Expected output:** A step-by-step guide with 5-10 numbered steps (e.g., Step 1: Set Up Your Server, Step 2: Install Dependencies...), each with detailed paragraphs.

---

## 4. Compare — Side by Side Comparison

| Field | Value |
|---|---|
| **Name** | React vs Vue vs Svelte |
| **Keywords** | best JavaScript framework 2026, frontend framework comparison, React Vue Svelte performance |
| **Campaign Format** | Compare |
| **Entity 1** | React |
| **Entity 2** | Vue.js |
| **(+) Entity 3** | Svelte |
| **Posts Target** | 1 |
| **Repeat Every** | 1 Day(s) |
| **Start Date** | Today, current time |
| **Use Summary as Excerpt** | ON |
| **Campaign Status** | ON |

**Expected output:** A comparison article with introduction, each framework detailed (description + pros/cons lists), a feature comparison table, and a verdict section.

---

## 5. Terms A-Z — Glossary / Definitions

| Field | Value |
|---|---|
| **Name** | DevOps Terminology |
| **Keywords** | DevOps terms explained, CI/CD glossary, containerization definitions |
| **Campaign Format** | Terms A-Z |
| **Posts Target** | 1 |
| **Repeat Every** | 1 Day(s) |
| **Start Date** | Today, current time |
| **Use Summary as Excerpt** | ON |
| **Campaign Status** | ON |

**Expected output:** A glossary-style post with 10-15 DevOps terms alphabetically ordered (e.g., Blue-Green Deployment, Container, Docker, Kubernetes...), each with an H3 heading and 2-3 definition paragraphs.

---

## 6. Series — Multi-Part Content Series

| Field | Value |
|---|---|
| **Name** | Master Git and GitHub |
| **Keywords** | learn Git from scratch, GitHub workflow, version control for developers |
| **Campaign Format** | Series |
| **Total Parts in Series** | 3 |
| **Posts Target** | 4 (1 hub + 3 parts) |
| **Repeat Every** | 1 Day(s) |
| **Start Date** | Today, current time |
| **Use Summary as Excerpt** | ON |
| **Campaign Status** | ON |

**Expected output (over 4 cron runs):**
- **Run 1:** Hub/pillar page with series overview + 3 module outlines + new category created
- **Run 2:** Part 1 post with "Back to Hub" link, hub gets "Next Chapter" link
- **Run 3:** Part 2 post with navigation links, Part 1 gets "Next Chapter" link
- **Run 4:** Part 3 post with navigation links, campaign auto-completes

**Note:** Set Posts Target to `total_parts + 1` because the hub page counts as the first post.

---

## Advanced Tab Overrides (Optional — test on any campaign above)

| Field | Value |
|---|---|
| **Content Tone** | Conversational |
| **Target Demographic** | Beginners |
| **Maximum Content Words** | 1500 |
| **Override Site Persona** | ON |
| **Campaign For** | absolute beginners learning to code for the first time |
| **Campaign Description** | A beginner-friendly tech blog that explains complex concepts in simple language with real-world examples |

---

## Verification Checklist

After each campaign runs:

- [ ] Post appears in **Posts** list
- [ ] Post title is relevant to keywords
- [ ] Post content has proper Gutenberg blocks (check in editor)
- [ ] Post excerpt is populated (if "Use Summary as Excerpt" was ON)
- [ ] Campaign list shows format badge (📋, 📝, ⚖️, 📖, 📚)
- [ ] Campaign counters update (postsCreated increments)
- [ ] Success log appears in campaign logs

### Series-specific checks:
- [ ] Hub page created with module listing
- [ ] Category created matching campaign name
- [ ] Spoke posts have "Back to Hub" navigation link
- [ ] Previous posts get "Next Chapter" forward link
- [ ] All series posts share the same category
- [ ] Series progress shows in campaign list badge (e.g., "📚 Series (2/3)")

- No images coming up in the posts, debug and fix it.


Can you create a .md file explaining the onboarding flow? Actually we are getting plugin downloads but no one is signing up  
for the plugin on our server site even though we offer free tokens for free sign up. Looks like our onboarding flow is not   
cleary conveying our free thingy and users are thinking this is a paid plugin. We want this .md file to share with the       
research marketing ai to know what strings or input fields or onboarding steps should we update to make users sign up. So    
involve complete onboarding flow from start to end - espacially include the flow when they do not have license. And the      
flow if they skip onboarding then what they see on Welcome screen. So start to end both flows till Welcome screen.
