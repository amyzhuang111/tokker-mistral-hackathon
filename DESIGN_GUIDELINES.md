# Tokker Design Guidelines
### Making Tokker feel like a product TikTok creators actually want to use

---

## 1. Core Design Philosophy

Tokker's audience is **TikTok creators with 10K-1M followers**. These are digital natives aged 18-30 who live inside apps like TikTok, Instagram, and Notion. They expect interfaces that feel **alive, fast, and intuitive** — not enterprise SaaS dashboards.

**Three principles:**
1. **Show, don't tell.** Replace walls of text with visual hierarchy, progress states, and scannable data.
2. **Delight in motion.** Every state change should feel intentional. Static = dead to this audience.
3. **One action per screen.** Reduce cognitive load. Each step should have one obvious thing to do next.

---

## 2. Current Problems (Audit)

| Issue | Where | Severity |
|---|---|---|
| No visual identity — "Tokker" is plain text, no logo, no mark | Login, Home | High |
| Zero motion/animation — every transition is a hard cut | Everywhere | High |
| Dashboard is a data dump — too much shown at once | `/dashboard` | High |
| Brand cards show enterprise data (funding, headcount) that creators don't care about | `BrandCard` | High |
| No progress indicator during AI generation (just a spinner) | Marketing Request | Medium |
| "Powered by Mistral · Clay · ElevenLabs · x402" means nothing to creators | Footer | Medium |
| Voice input has no visual feedback beyond a red dot | `MarketingRequest` | Medium |
| No empty states, no success states, no celebration moments | Dashboard | Medium |
| Login page is barren — no social proof, no value prop | `/login` | Medium |
| Copy button gives no feedback ("Copy pitch" stays the same) | `BrandCard` | Low |
| No mobile-first thinking — 2-col grid breaks on small screens | Dashboard | Medium |
| Color palette is generic dark mode, not branded | Everywhere | Medium |

---

## 3. Brand Identity

### 3.1 Logo & Wordmark
- Create a **logomark** — a stylized "T" or abstract play-button shape that references both TikTok's aesthetic and the "pitch/megaphone" concept.
- The wordmark "Tokker" should use a **custom weight or letter-spacing treatment** to feel ownable. Consider tracking out the letters slightly and using a geometric sans-serif.
- Minimum: add an SVG icon next to the wordmark on every page.

### 3.2 Color System

**Current:** Generic violet on black. Feels like every other dev tool.

**Proposed palette — "Electric Coral":**

| Token | Hex | Usage |
|---|---|---|
| `--brand-primary` | `#FE2C55` | Primary CTA, key accents (TikTok's red-pink) |
| `--brand-secondary` | `#25F4EE` | Secondary accents, highlights (TikTok's cyan) |
| `--brand-glow` | `#FE2C55` at 15% opacity | Background glows, hover states |
| `--surface-0` | `#000000` | True black background |
| `--surface-1` | `#121212` | Card backgrounds |
| `--surface-2` | `#1E1E1E` | Elevated surfaces, inputs |
| `--text-primary` | `#FFFFFF` | Headlines |
| `--text-secondary` | `#A0A0A0` | Body text |
| `--text-tertiary` | `#5A5A5A` | Captions, labels |
| `--success` | `#00DC82` | Deal values, fit scores, confirmations |
| `--warning` | `#FFB800` | Medium fit scores |

This palette creates instant visual association with TikTok while still being Tokker's own thing. The coral-to-cyan gradient is the hero treatment.

### 3.3 Typography

**Current:** Geist is a good developer font but feels cold for creators.

**Recommendation:**
- **Headlines:** Switch to **Inter** or **Plus Jakarta Sans** — warmer, rounder, more consumer-friendly. Use `font-weight: 800` for hero text.
- **Body:** Keep Geist or switch to Inter for consistency.
- **Monospace:** Keep Geist Mono for pitch scripts/code blocks only.

### 3.4 Iconography
- Use a consistent icon set (Lucide or Phosphor Icons — both have clean, rounded styles that match TikTok's aesthetic).
- Replace all inline SVGs with a proper icon component for consistency.
- Icons should be 20px default, 24px for actions, with 1.5px stroke weight.

---

## 4. Page-by-Page Redesign

### 4.1 Login Page (`/login`)

**Current:** Logo, tagline, Google button, "Powered by" footer. Feels empty.

**Redesign:**

```
+------------------------------------------+
|                                          |
|        [Tokker Logo + Wordmark]          |
|     AI PR Agent for TikTok Creators      |
|                                          |
|  +------------------------------------+  |
|  |  "Tokker found me 3 brand deals    |  |
|  |   in my first week. I didn't       |  |
|  |   write a single email."           |  |
|  |          — @fitnessjenna, 340K     |  |
|  +------------------------------------+  |
|                                          |
|    [ G  Sign in with Google         ]    |
|    [ T  Sign in with TikTok         ]    |
|                                          |
|    3,200+ creators | $2.4M in deals      |
|                                          |
+------------------------------------------+
```

**Concrete changes:**
- Add a rotating **testimonial card** with creator avatar, handle, and follower count. Even if you use placeholder data for the hackathon, the pattern sells trust.
- Add **social proof numbers** below the sign-in button (creators signed up, deals closed, total payout).
- Add a subtle **gradient mesh background** (coral → cyan, 5% opacity) behind the centered content.
- Consider adding "Sign in with TikTok" as a future option — even a disabled/coming-soon button signals product intent.
- Remove "Powered by Mistral · Clay · ElevenLabs · x402" — creators don't care about your infra stack. Replace with social proof.

### 4.2 Home Page (`/`)

**Current:** Logo, description paragraph, handle input, "Powered by" footer.

**Redesign:**

```
+------------------------------------------+
|  [Logo]                    [Avatar] [v]  |
|                                          |
|        Find your perfect brand           |
|            partnerships                  |
|                                          |
|   +----------------------------------+   |
|   | @  tiktok_handle            [->] |   |
|   +----------------------------------+   |
|                                          |
|   or paste a TikTok profile link         |
|                                          |
|   Trending creators using Tokker:        |
|   [@user1] [@user2] [@user3] [@user4]   |
|                                          |
+------------------------------------------+
```

**Concrete changes:**
- Merge the input + submit button into **one line** (input with arrow/submit icon on the right). The current two-element stack feels like a form, not a product.
- Replace the paragraph description with a **punchy 6-word headline**: "Find your perfect brand partnerships" — the long description is a wall of text no creator will read.
- Add **trending creators** as clickable chips below the input to reduce friction (tap to auto-fill).
- Add a **header bar** with the logo left-aligned and user avatar + dropdown right-aligned. The current centered layout wastes space and has no navigation.
- Accept both `@handle` and full TikTok URLs in the input. Add helper text: "or paste a TikTok profile link."
- The submit button should be an **icon inside the input field** (right-arrow or search icon), not a separate full-width button below.

### 4.3 Dashboard Page (`/dashboard`)

**This is the biggest opportunity.** The current dashboard is an engineer's view of the data, not a creator's.

#### 4.3.1 Layout Restructure

**Current flow:** Creator Profile → Marketing Request → Overall Strategy → Brand Grid

**Proposed flow:**

```
+------------------------------------------+
| [<- Back]   @handle   [Avatar] [Logout]  |
|                                          |
| +--------------------------------------+ |
| | YOUR PROFILE                         | |
| | 340K followers · Fitness · 45K views | |
| | [gym] [meal prep] [HIIT] [wellness]  | |
| +--------------------------------------+ |
|                                          |
| What do you want to promote?             |
| +--------------------------------------+ |
| | I want to promote my new 30-day...   | |
| |                              [mic] | |
| +--------------------------------------+ |
| [  Generate Pitches  ]                   |
|                                          |
| ═══════════════════════════════════════  |
|                                          |
| 5 BRAND MATCHES                          |
| [All] [Best Fit] [Highest Value]         |
|                                          |
| +------------------+ +----------------+ |
| | Gymshark     92  | | Alo Yoga   88  | |
| | $3-5K · Fitness  | | $2-4K · Yoga   | |
| | [View Pitch ->]  | | [View Pitch]   | |
| +------------------+ +----------------+ |
|                                          |
+------------------------------------------+
```

**Concrete changes:**

1. **Collapse the Creator Profile** into a single-line summary bar. Creators already know who they are — they don't need a 4-column grid for their own data. Show: `340K followers · Fitness · 45K avg views` with theme tags inline.

2. **Brand cards should be dramatically simplified on first view.** Show only:
   - Brand name + logo (fetch favicon from `https://www.google.com/s2/favicons?domain={domain}&sz=64`)
   - Fit score (as a colored ring/badge, not raw number)
   - Estimated deal value
   - One-line pitch angle
   - "View Pitch" CTA button

   All the enrichment data (funding, headcount, recent news) should be in an **expandable detail panel** or a **slide-over drawer**. Creators don't care about Series B funding rounds — they care about "will this brand pay me and is it a good fit?"

3. **Add filtering/sorting tabs** above the brand grid: "All", "Best Fit", "Highest Value", "Ready to Pitch." This gives creators agency over prioritization.

4. **The marketing request area needs a heading that speaks human**, not "Marketing Request." Try: "What do you want to promote?" or "Tell us about your next campaign."

5. **Overall PR Strategy block** should be a collapsible summary, not a full paragraph block that pushes brand cards below the fold. Consider making it a **dismissible banner** or a sticky summary at the top.

#### 4.3.2 Brand Card Redesign

**Current card shows (in order):**
1. Brand name + domain + fit score
2. Description paragraph
3. Industry / Funding / Headcount / Recent News grid
4. "Why this brand fits" box
5. PR Strategy section (pitch angle, deal value, content formats, talking points, pitch script)

**This is way too much information in one card.** A creator's eyes glaze over.

**Proposed card (collapsed state):**
```
+--------------------------------------+
| [favicon] Gymshark          [92/100] |
| Athletic wear · Perfect for your     |
| HIIT content audience                |
|                                      |
| $3,000 - $5,000 est.                |
|                                      |
| [Duet] [Product Review] [GRWM]      |
|                                      |
| [ View Full Pitch ]  [ Send Pitch ]  |
+--------------------------------------+
```

**Proposed card (expanded state / detail view):**
- Full pitch script with copy button
- Talking points as a checklist (so creators can mentally prep)
- Brand enrichment details in a subtle "About this brand" collapsible
- "Why this brand fits you" section
- Action buttons: "Copy Pitch", "Open in Email", "Save for Later"

**Key principles:**
- **Lead with what the creator gets** (money and content formats), not what the brand is.
- **Fit score should be visual** — a colored ring, gauge, or filled bar, not just a number.
- **The CTA "View Full Pitch" should be the primary button** — this is what moves the funnel forward.
- Add a **"Send Pitch"** button that opens mailto: or copies to clipboard. Make the action frictionless.

---

## 5. Interaction & Motion Design

### 5.1 Page Transitions
- Add `framer-motion` or CSS transitions between pages. The current hard cuts between `/login` → `/` → `/dashboard` feel jarring.
- Recommended: fade + slight upward slide (200ms ease-out) for page enters.

### 5.2 Loading States

**Current:** Generic spinner with "Analyzing creator..." or "Mistral is crafting your PR strategy..."

**Proposed:** A **multi-step progress indicator** that shows what's actually happening:

```
Step 1: Analyzing your TikTok profile...     [====      ]
Step 2: Searching for matching brands...      [          ]
Step 3: Crafting personalized pitches...      [          ]
```

- Even if steps aren't truly sequential on the backend, **fake the progression** with timed steps. This is standard consumer UX (think: Uber showing your driver, LinkedIn profile strength). It makes the wait feel productive, not stalled.
- Use a **skeleton loader** for the brand cards instead of a spinner. Show the card grid layout with pulsing placeholder blocks.

### 5.3 Micro-interactions
- **Copy button:** "Copy pitch" → click → button text changes to "Copied!" with a checkmark, reverts after 2s.
- **Fit score:** Animate the number counting up from 0 when the card enters the viewport.
- **Brand cards:** Stagger their entrance — each card fades in 100ms after the previous one.
- **Voice input:** Show a real-time waveform/amplitude visualization instead of just a red dot.
- **Submit buttons:** Add a subtle scale (1.02) on hover, with spring easing.

### 5.4 Celebration Moments
- When pitches are generated, show a **confetti burst** or a brief **success overlay**: "5 pitches ready! Let's land some deals." This creates an emotional payoff.
- When a creator copies a pitch, show: "Pitch copied — go get that bag" (speak their language).

---

## 6. Mobile-First Design

**TikTok creators live on their phones.** The current design is desktop-first with responsive fallbacks.

### 6.1 Concrete Mobile Changes
- **Brand cards:** Single column, full width, with horizontal swipe between cards (carousel) instead of vertical scroll grid.
- **Input fields:** Increase touch targets to minimum 48px height. The current 44px (`py-3`) is barely there.
- **Header:** Collapse to hamburger or bottom nav on mobile. The current `flex justify-between` header wraps badly on small screens.
- **Pitch script:** Full-screen modal on mobile instead of inline expand. The card is too narrow to read a full pitch comfortably.
- **Voice button:** Make it larger and more prominent on mobile — voice input is the native mobile interaction.

### 6.2 Bottom Navigation (Mobile)
Consider a persistent bottom nav for mobile:
```
[ Home ]  [ Brands ]  [ Pitches ]  [ Profile ]
```
This is the pattern every app in a creator's phone uses.

---

## 7. Copy & Tone of Voice

**Current copy is functional but sterile.** It reads like documentation, not a product creators would screenshot and share.

### 7.1 Specific Copy Rewrites

| Current | Proposed | Why |
|---|---|---|
| "AI PR Agent for TikTok Creators" | "Land brand deals on autopilot" | Benefit-first, not feature-first |
| "Paste your TikTok handle and we'll find high-fit brands, craft personalized pitches, and help you land paid partnerships — all autonomously." | "Drop your @ and we'll find brands that want to work with you." | Shorter, conversational, confident |
| "Find Brand Matches" | "Find My Brands" | First-person, ownership |
| "Marketing Request" | "What's your next campaign about?" | Conversational, not enterprise |
| "Generate PR Strategy" | "Write My Pitches" | Action the creator understands |
| "Mistral is crafting your PR strategy..." | "Writing your pitches..." | Don't expose internal tooling names |
| "Overall PR Strategy" | "Your Game Plan" | Creator-native language |
| "Analyzing creator..." | "Looking you up..." | Casual, human |
| "fit score" | "Match" or "Fit" | Simpler label |
| "Estimated Deal Value" | "What you could earn" | Benefit-oriented |
| "Content Formats" | "Content ideas" | More approachable |
| "Talking Points" | "What to say" | Plain English |
| "Powered by Mistral · Clay · ElevenLabs · x402" | Remove entirely, or "Built with AI magic" | Creators don't care about your stack |

### 7.2 Tone Rules
- Use **second person** ("your brands", "your pitches") not third person.
- Use **contractions** ("we'll", "you're", "don't") — formal English feels corporate.
- Keep **sentences under 12 words** in UI copy.
- Use **creator slang sparingly** but intentionally: "get that bag", "let's lock in", "this brand is fire."
- Never say "autonomous", "orchestrator", "enrichment", or "agent" in user-facing copy.

---

## 8. Empty & Error States

**Currently missing entirely.** Every state needs a designed experience.

### 8.1 Empty States

| State | Current | Proposed |
|---|---|---|
| No brands found | Not handled | Illustration + "No matches yet — try a different niche or check back soon. We're always adding new brands." |
| No strategy generated | Blank space | Prompt card: "Tell us about your next campaign and we'll write pitches for every brand above." with an arrow pointing to the input |
| Session expired / no data | Redirect to `/` | "Looks like your session expired. Let's start fresh." with a CTA button |

### 8.2 Error States

| State | Current | Proposed |
|---|---|---|
| API failure | Red text: "Agent request failed" | Card with retry button: "Something went wrong on our end. [Try again]" |
| Invalid handle | Red text inline | Shake animation on input + inline message: "We couldn't find that handle — double check and try again" |
| Voice not supported | `alert()` | Inline toast notification, non-blocking |

---

## 9. Accessibility & Polish

### 9.1 Contrast
- Current `text-zinc-600` on `#0a0a0a` background fails WCAG AA contrast. Bump all caption/label text to minimum `text-zinc-400` (`#A1A1AA` = 4.64:1 ratio on black).
- Ensure all interactive elements have visible focus states (current `focus:ring` is good, verify it's on all buttons).

### 9.2 Touch Targets
- All buttons and interactive elements: minimum 44x44px touch target (WCAG 2.5.5).
- Add `p-3` minimum to icon-only buttons (voice button currently is `p-2`).

### 9.3 Screen Readers
- Add `aria-label` to icon-only buttons (voice input, copy pitch).
- Add `role="status"` and `aria-live="polite"` to loading indicators.
- Add proper heading hierarchy (currently jumps from `h1` to `h2` to `h4`).

---

## 10. Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
These require minimal code changes but massively improve perception:

- [ ] Rewrite all user-facing copy per Section 7.1
- [ ] Add favicon fetching for brand logos (`<img src="https://www.google.com/s2/favicons?domain={domain}&sz=64">`)
- [ ] Add "Copied!" feedback on copy button with 2s timeout
- [ ] Fix contrast issues (bump `zinc-600` → `zinc-400` for all body text)
- [ ] Remove "Powered by..." footer or replace with social proof
- [ ] Collapse Creator Profile to single-line summary
- [ ] Rename section headers to conversational tone

### Phase 2: Structural Improvements (3-5 hours)
These change the information architecture:

- [ ] Simplify BrandCard collapsed state (name, score, deal value, one-liner, CTA only)
- [ ] Move enrichment data into expandable "About this brand" section
- [ ] Add multi-step progress indicator for AI generation
- [ ] Add skeleton loaders for brand cards
- [ ] Add filter/sort tabs for brand list
- [ ] Redesign login page with testimonial + social proof
- [ ] Make input inline (handle input + submit in one row)

### Phase 3: Delight & Motion (2-3 hours)
These make the product feel alive:

- [ ] Install `framer-motion` and add page transitions
- [ ] Add staggered card entrance animations
- [ ] Add fit score count-up animation
- [ ] Add success celebration state after pitch generation
- [ ] Add voice input waveform visualization
- [ ] Add hover/press micro-interactions on buttons

### Phase 4: Mobile Excellence (3-4 hours)
These make the product work on phones:

- [ ] Brand card horizontal swipe carousel on mobile
- [ ] Full-screen pitch modal on mobile
- [ ] Bottom navigation bar for mobile
- [ ] Increase all touch targets to 48px
- [ ] Test and fix all responsive breakpoints

---

## 11. Component Library Recommendations

To execute this design system efficiently:

| Need | Recommendation | Why |
|---|---|---|
| Animation | `framer-motion` | Industry standard for React, great spring physics |
| Icons | `lucide-react` | Clean, consistent, tree-shakeable |
| Toast notifications | `sonner` | Beautiful defaults, zero config, works with Next.js |
| Skeleton loaders | Custom with Tailwind `animate-pulse` | Already available, no dependency needed |
| Confetti | `canvas-confetti` | Lightweight, fun, 2KB |
| Brand favicons | Google Favicon API | Free, no dependency, `s2/favicons?domain=X&sz=64` |

---

## Summary

The biggest shift Tokker needs is from **"AI dashboard that shows data"** to **"creator tool that gets you paid."** Every design decision should pass one test:

> **"Would a 22-year-old TikToker with 50K followers screenshot this and share it?"**

If the answer isn't yes, simplify it, make it prettier, or cut it entirely.
