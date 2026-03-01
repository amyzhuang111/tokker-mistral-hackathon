# Tokker Design Guidelines
### Making Tokker feel like a product TikTok creators actually want to use

---

## 1. Core Design Philosophy

Tokker's audience is **TikTok creators with 10K-1M followers**. These are digital natives aged 18-30 who live inside apps like TikTok, Instagram, and Notion. They expect interfaces that feel **alive, fast, and intuitive** — not enterprise SaaS dashboards.

**Four principles:**
1. **Show, don't tell.** Replace walls of text with visual hierarchy, progress states, and scannable data.
2. **Delight in motion.** Every state change should feel intentional. Static = dead to this audience.
3. **One action per screen.** Reduce cognitive load. Each step should have one obvious thing to do next.
4. **Lead with emotion, not information.** The creator should feel wanted, excited, and in control. Data serves the feeling, not the other way around.

---

## 2. Audit — What's Been Fixed (v1 → v2)

| Issue | Status | Notes |
|---|---|---|
| No visual identity | **Fixed** | Sparkles logomark, Plus Jakarta Sans, branded color system |
| Zero motion/animation | **Fixed** | framer-motion page transitions, staggered cards, score ring animation |
| Dashboard is a data dump | **Fixed** | Collapsed creator profile, filter tabs, collapsible strategy banner |
| Enterprise data in brand cards | **Fixed** | Hidden behind "About this brand" expandable |
| No progress indicator | **Fixed** | 4-step timed progress stepper during AI generation |
| Infra stack in footer | **Fixed** | Replaced with social proof numbers |
| Voice input no feedback | **Fixed** | Animated 5-bar waveform visualization |
| No empty/success/celebration states | **Fixed** | Confetti on pitch generation, empty state for no brands |
| Login page barren | **Fixed** | Testimonial carousel, social proof, gradient mesh |
| Copy button no feedback | **Fixed** | "Copied!" state + toast notification |
| Generic dark mode palette | **Fixed** | Electric Coral palette (#FE2C55 + #25F4EE) |

---

## 3. Audit — What Still Needs Work (v2 → v3)

These are the deeper, flow-level problems that separate a good-looking prototype from a product creators will actually use daily.

### 3.1 The Dashboard Flow Is Backwards

| Severity | Issue |
|---|---|
| **Critical** | Marketing request textarea is shown BEFORE brand cards |

**Problem:** The first thing a creator sees on their dashboard is a big empty textarea asking "What's your next campaign about?" That's homework. They just signed up. They haven't even seen their brand matches yet. The brands are already matched from the enrichment step — that's free, immediate value being hidden behind a form.

**Fix:** Flip the order. Brands first, marketing request second.

```
Current:  Profile → [Marketing Request] → Strategy → Brands
Proposed: Profile → Brands (instant value) → [Marketing Request as unlock] → Pitches
```

The marketing request should feel like an upgrade ("Want custom pitches? Tell us about your campaign"), not a gate that blocks the interesting content.

### 3.2 Copy Makes the Creator Feel Like a User, Not a Star

| Severity | Issue |
|---|---|
| **High** | "5 brands found" treats the creator as a searcher, not the talent |

**Problem:** The brand count header says "5 brands found." That's Google search language. It positions the creator as someone looking for brands. The emotional frame should be the opposite — brands are looking for *them*.

**Fix — specific rewrites:**

| Current | Proposed | Why |
|---|---|---|
| "5 brands found" | "5 brands that match your vibe" | Creator is the prize, not the searcher |
| "About this brand" | "Why they'd work with you" | Reframe from brand info → creator relevance |
| "What you could earn" | Show as the **hero number** on the card | It's the most exciting data, shouldn't be a small line |
| "Write my pitches" | Keep, but add "for 5 brands" count | Specificity creates anticipation |
| "Your game plan" | "Your pitches are ready" | More concrete, more exciting |
| Progress: "Analyzing your profile..." | "Looking you up on TikTok..." | More specific, more human |
| Progress: "Matching brands to your niche..." | "Finding brands that fit your audience..." | Creator-centric framing |
| Progress: "Crafting personalized pitches..." | "Writing pitches in your voice..." | The "in your voice" part is magic |
| Progress: "Finalizing your strategy..." | "Polishing the details..." | Less corporate |

### 3.3 The Money Is Buried

| Severity | Issue |
|---|---|
| **High** | Estimated deal value is a small text line inside the card |

**Problem:** The single most exciting data point for every creator — how much they could earn — is displayed as `text-sm font-bold text-success` inside the card body. On Cash App, when you get paid, the number takes up half the screen. On Robinhood, your portfolio value is the first and biggest thing you see.

**Fix:** Make estimated deal value the **visual anchor** of each brand card. It should be:
- Displayed in a large, bold font (at least `text-2xl`)
- Visible in the card header, not buried in the body
- Shown even before pitches are generated (as a range estimate based on fit score + follower count)
- Formatted as a range with a subtle "est." label: **$3,000 – $5,000** est.

Consider a **total estimated earnings** counter at the top of the dashboard that sums all brand deal values. "You could earn **$12,000 – $22,000** from these matches." That's the number that makes someone screenshot and share.

### 3.4 No Smart Defaults for Marketing Request

| Severity | Issue |
|---|---|
| **High** | Empty textarea with only a placeholder — most creators won't know what to write |

**Problem:** The textarea relies on the creator knowing exactly what to say. Most won't. They'll stare at it, feel unsure, and bounce. The placeholder text is long and gets cut off on mobile.

**Fix:** Add **quick-select prompt chips** above or inside the textarea:

```
Quick ideas:
[ My latest content series ]  [ A product I love ]
[ A fitness challenge ]       [ Custom... ]
```

Tapping a chip should auto-fill a starter prompt the creator can edit. This is the Uber pattern — you don't type your destination from scratch, you tap a suggestion. The custom option opens the full textarea.

For v3, consider removing the freeform textarea entirely and replacing it with a structured flow:
1. "What do you want to promote?" → chip select
2. "What kind of content?" → multi-select (Duet, Review, GRWM, Story)
3. "Any specific brands in mind?" → optional text input

### 3.5 Brand Cards Have No CTA Before Pitches Exist

| Severity | Issue |
|---|---|
| **Medium** | Pre-pitch brand cards are informational dead ends |

**Problem:** Before the creator submits a marketing request and pitches are generated, a brand card shows: name, industry, fit score, fit reason, and an "About this brand" toggle. There's no action to take. It's a read-only info card with no forward momentum.

**Fix:** Every card should always have a primary CTA:
- **Pre-pitch state:** "Unlock pitch" button (which scrolls to / highlights the marketing request area, or even triggers pitch generation for just that brand)
- **Post-pitch state:** "View full pitch" button (current, works well)

A card without an action is a dead end. Dead ends kill retention.

### 3.6 Pre-Pitch and Post-Pitch Should Look Different

| Severity | Issue |
|---|---|
| **Medium** | Brand cards look the same before and after pitches, just with more sections |

**Problem:** The moment pitches land should feel like an **upgrade**, not just "more stuff appeared." Currently the card just grows taller with additional sections. There's no visual transformation.

**Fix:** Create two distinct visual states:
- **Pre-pitch:** Outline/ghost card. `border-white/[0.06]` with muted colors. Score ring is the only vivid element. Feels like a preview.
- **Post-pitch:** Filled card. `bg-surface-1` with elevated border (`border-brand/20`). Deal value in large green text. Content format tags become vivid. A subtle glow or gradient on the card. Feels like it's been "activated."

This creates a visual before/after that makes the AI generation feel like it *did something transformative*.

### 3.7 No Sense of Progress or Next Step

| Severity | Issue |
|---|---|
| **Medium** | Dashboard has no persistent "what should I do now?" nudge |

**Problem:** Great consumer apps always answer "what do I do next?" Tokker's dashboard shows content but never guides the creator through a journey.

**Fix:** Add a **contextual status bar** near the top of the dashboard that changes based on state:

| State | Status bar content |
|---|---|
| Just arrived, no pitches | "Your brands are ready. Tell us about your campaign to unlock pitches." |
| During pitch generation | Progress stepper (already exists, good) |
| Pitches ready, none copied/sent | "5 pitches ready — send your first one to get started." |
| At least one pitch copied/sent | "You're on your way. 4 more pitches waiting." |

This is the Duolingo/LinkedIn pattern — there's always one obvious next thing. It creates momentum and reduces decision paralysis.

### 3.8 Login Testimonials Need Faces and Slower Timing

| Severity | Issue |
|---|---|
| **Low** | Testimonials rotate at 4s (too fast) and have no avatars |

**Problem:** 4 seconds per testimonial means users might be mid-read when it swaps. Testimonials without photos feel less trustworthy — humans trust faces more than text.

**Fix:**
- Slow rotation to **6 seconds**
- Add **avatar circles** next to each testimonial handle (even generated placeholder initials like a colored circle with "JF" for @fitnessjenna)
- Add a subtle **dot indicator** (3 dots) below the testimonial card so users know there are multiple

### 3.9 Trending Creator Chips Should Auto-Submit

| Severity | Issue |
|---|---|
| **Low** | Clicking a trending creator chip only fills the input — user still has to press submit |

**Problem:** The trending creators are one-tap shortcuts, but they require a second tap to actually go. That defeats the purpose of a shortcut.

**Fix:** Clicking a chip should **auto-submit** the handle immediately (trigger the enrichment API call and navigate to dashboard). Show a brief loading state on the chip itself so the user knows something's happening.

### 3.10 The "About This Brand" Expand Feels Like Punishment

| Severity | Issue |
|---|---|
| **Low** | Expanding brand details shows enterprise data that doesn't help the creator decide |

**Problem:** "About this brand" expands to show funding, team size, and news. This is investor data, not creator data. A creator deciding whether to pitch Gymshark doesn't care about their Series B.

**Fix:** Restructure the expanded section to lead with **creator-relevant info**:
1. "Why they'd work with you" (the fit reason, already exists)
2. "What they've sponsored before" (if available from enrichment)
3. "Their audience" (overlap with creator's audience)
4. Then optionally: funding, team size, news as a dimmed "Company info" section

---

## 4. Brand Identity (Implemented)

### 4.1 Color System — "Electric Coral"

| Token | Hex | Usage |
|---|---|---|
| `--brand-primary` | `#FE2C55` | Primary CTA, key accents (TikTok's red-pink) |
| `--brand-secondary` | `#25F4EE` | Secondary accents, gradient endpoints |
| `--brand-glow` | `#FE2C55` at 15% opacity | Background glows, hover states |
| `--surface-0` | `#000000` | True black background |
| `--surface-1` | `#121212` | Card backgrounds |
| `--surface-2` | `#1E1E1E` | Elevated surfaces, inputs |
| `--text-primary` | `#FFFFFF` | Headlines |
| `--text-secondary` / `--muted` | `#A0A0A0` | Body text |
| `--text-tertiary` / `--subtle` | `#5A5A5A` | Captions, labels |
| `--success` | `#00DC82` | Deal values, fit scores, confirmations |
| `--warning` | `#FFB800` | Medium fit scores |

### 4.2 Typography
- **Headlines:** Plus Jakarta Sans, `font-weight: 800` (extrabold)
- **Body:** Plus Jakarta Sans, `font-weight: 400-600`
- **Monospace:** Geist Mono (pitch scripts only)

### 4.3 Iconography
- **Library:** Lucide React (consistent, tree-shakeable)
- **Sizes:** 14px (inline), 16px (buttons), 20px (actions), 24px (hero)
- **Stroke:** Default 2px (Lucide default)

---

## 5. Copy & Tone of Voice

### 5.1 Voice Principles
- Use **second person** ("your brands", "your pitches") — the creator is the main character
- Use **contractions** ("we'll", "you're", "don't") — formal English feels corporate
- Keep **sentences under 12 words** in UI copy
- Use **creator slang sparingly** but intentionally: "get that bag", "let's lock in"
- Never say "autonomous", "orchestrator", "enrichment", or "agent" in user-facing copy
- Never expose internal tool names (Mistral, Clay, etc.) in UI copy
- Frame everything around **what the creator gets**, not what the system does

### 5.2 The Emotional Frame
The creator should always feel like **the talent brands are competing for**, not a user searching a database. Every piece of copy should reinforce:
- "Brands want to work with **you**"
- "Here's how much **you** could earn"
- "**Your** pitches are ready"

Not:
- "We found brands"
- "Estimated deal value"
- "PR Strategy generated"

---

## 6. Interaction & Motion Design (Implemented)

### 6.1 Page Transitions
- Fade + upward slide (16px, 500ms) on page enter via framer-motion
- AnimatePresence for testimonial carousel crossfades

### 6.2 Loading States
- 4-step timed progress indicator during pitch generation
- Branded spinner (coral ring) for page loads
- Animated waveform (5 bars) during voice recording

### 6.3 Micro-interactions
- "Copied!" feedback with green check icon + sonner toast
- Animated SVG score ring (circumference stroke-dashoffset animation)
- Staggered card entrance (80ms delay per card)
- `active:scale-[0.98]` on all primary buttons
- Confetti burst on first pitch generation (canvas-confetti, brand colors)

---

## 7. Mobile-First Design

**TikTok creators live on their phones.** Design for mobile first, enhance for desktop.

### 7.1 Implemented
- Touch targets at 44-48px minimum on all interactive elements
- `p-3` on icon-only buttons (voice, back, logout)
- Single-column card layout on mobile, 2-col on `md+`
- `aria-label` on all icon-only buttons

### 7.2 Still Needed
- **Brand card horizontal swipe carousel** on mobile instead of vertical scroll
- **Full-screen pitch modal** on mobile (card is too narrow to read a full pitch)
- **Bottom navigation bar** for mobile: `[ Home ] [ Brands ] [ Pitches ] [ Profile ]`
- **Larger voice input button** on mobile — voice is the native mobile interaction
- **Test all responsive breakpoints** — the filter tab bar and header may wrap on small screens

---

## 8. Empty & Error States

### 8.1 Empty States (Implemented)
- No brands found: "No matches yet" with guidance text
- Loading with enrichment: "Finding your brand matches..." with spinner

### 8.2 Error States (Implemented)
- API failures: Dismissible card with `X` button
- Invalid handle: Animated error text with framer-motion
- Voice not supported: Sonner toast (replaced `alert()`)

### 8.3 Still Needed
- **Pre-pitch brand state:** Cards need a CTA or nudge, not just passive info
- **Post-pitch success state:** A more celebratory moment — "5 pitches ready! Your first deal is one message away."
- **Retry on error:** Error cards should include a "Try again" button, not just a dismiss

---

## 9. Accessibility

### 9.1 Contrast
- All caption/label text uses `--muted` (`#A0A0A0`) minimum — passes WCAG AA on black
- `--subtle` (`#5A5A5A`) used only for non-essential decorative text

### 9.2 Interaction
- `aria-label` on icon-only buttons (back, logout, voice, copy)
- Focus rings (`focus:ring-2 focus:ring-brand/20`) on all interactive elements
- Proper heading hierarchy: `h1` (page title) → `h2` (sections) → `h3` (card titles)

### 9.3 Still Needed
- `role="status"` and `aria-live="polite"` on loading indicators and progress steppers
- `aria-expanded` on all expandable sections (brand card details, pitch toggle)
- Skip navigation link for keyboard users

---

## 10. Implementation Priority (v3)

### Phase 1: Flow Fixes (High Impact)
These change how the product *feels* to use:

- [ ] Move brand cards ABOVE marketing request on dashboard (Section 3.1)
- [ ] Add total estimated earnings counter at top of dashboard (Section 3.3)
- [ ] Make deal value the hero number on each brand card — `text-2xl` (Section 3.3)
- [ ] Add quick-select prompt chips to marketing request (Section 3.4)
- [ ] Update copy: "5 brands that match your vibe", progress step rewrites (Section 3.2)
- [ ] Add "Unlock pitch" CTA to pre-pitch brand cards (Section 3.5)

### Phase 2: Visual States (Medium Impact)
These create clear before/after moments:

- [ ] Design distinct pre-pitch (ghost) vs post-pitch (activated) card styles (Section 3.6)
- [ ] Add contextual status bar / next-step nudge to dashboard (Section 3.7)
- [ ] Add "Your pitches are ready" success banner with deal total (Section 3.3)
- [ ] Auto-submit on trending creator chip tap (Section 3.9)

### Phase 3: Polish & Trust (Lower Impact)
These build credibility and comfort:

- [ ] Slow testimonial rotation to 6s, add avatar initials (Section 3.8)
- [ ] Add dot indicator to testimonial carousel (Section 3.8)
- [ ] Restructure "About this brand" to lead with creator-relevant info (Section 3.10)
- [ ] Add `aria-expanded`, `aria-live`, skip nav (Section 9.3)
- [ ] Add retry button to error states (Section 8.3)

### Phase 4: Mobile Excellence
- [ ] Brand card horizontal swipe on mobile
- [ ] Full-screen pitch modal on mobile
- [ ] Bottom navigation bar
- [ ] Test all responsive breakpoints

---

## 11. Tech Stack (Implemented)

| Need | Library | Status |
|---|---|---|
| Animation | `framer-motion` | Installed |
| Icons | `lucide-react` | Installed |
| Toast notifications | `sonner` | Installed |
| Confetti | `canvas-confetti` | Installed |
| Brand favicons | Google Favicon API | In use |
| Font | Plus Jakarta Sans (Google Fonts) | In use |
| Monospace | Geist Mono | In use |

---

## Summary

The v2 rebrand fixed the **surface layer** — Tokker looks like a consumer product now, not a dev tool. The v3 work is about fixing the **flow layer**:

1. **Show value before asking for input.** Brands first, marketing request second.
2. **Make the money impossible to miss.** Deal values should be the biggest, boldest element on every card.
3. **Remove blank canvas anxiety.** Smart defaults and prompt chips instead of empty textareas.
4. **Create momentum.** Every screen should have one obvious next action.
5. **Make the AI moment feel transformative.** Pre-pitch cards should look visually different from post-pitch cards.

The north star hasn't changed:

> **"Would a 22-year-old TikToker with 50K followers screenshot this and share it?"**

If the answer isn't yes, simplify it, make it prettier, or cut it entirely.
