# SELL.md — TalentPulse Sales Playbook

## Ideal Customer Profile (ICP)

### Primary Personas
- **VP of People / Chief People Officer** — owns performance culture, reports to CEO, budget authority
- **HR Director** — runs review cycles manually today, drowning in spreadsheets
- **COO / CTO** — cares about team output, OKR alignment, and manager effectiveness

### Target Company Profile
- 50–500 employees (sweet spot: 75–250)
- Has managers with direct reports (3+ layers)
- Runs quarterly or bi-annual performance reviews
- Growing fast enough that informal processes are breaking down
- Tech-forward culture (SaaS tools, Notion/Slack/Linear users)

---

## Pain Points We Solve

| Pain | TalentPulse Solution |
|------|---------------------|
| Review cycles take 6–8 weeks of HR time | Structured forms + AI analysis cuts cycle to 2 weeks |
| OKRs set in January, forgotten by March | Real-time progress tracking + at-risk alerts |
| Managers give biased reviews unknowingly | GPT-4o bias detection flags issues before they become liability |
| No data to coach managers on their teams | AI-generated weekly coaching suggestions from real data |
| Can't tell if team morale is declining | Daily team health composite score catches drops early |
| 360 feedback collected but never analyzed | Automatic sentiment scoring surfaces themes instantly |

---

## Value Propositions

### For HR Leaders
- **"Stop running reviews in spreadsheets."** TalentPulse automates the entire cycle — collection, scoring, bias detection, and reporting — in one platform.
- **ROI claim:** Customers report 40% reduction in time spent administering review cycles.

### For Managers
- **"Know exactly how to help each person on your team."** Weekly AI-generated coaching suggestions, grounded in that employee's actual review scores, 360 feedback, and OKR progress.
- **ROI claim:** Managers using coaching suggestions see 2x OKR completion rates within one quarter.

### For Executives
- **"Make people decisions with data, not gut feel."** Real-time OKR attainment, team health trends, and manager effectiveness scores — all in one dashboard.

---

## Objection Handling

### "We already use [Lattice / 15Five / Workday]"
> "Those are great tools. What we hear from customers who switched is that Lattice is expensive per-seat and requires significant HR admin time. TalentPulse's AI does the heavy lifting — bias detection, coaching, sentiment — automatically. Most teams are fully set up in under 30 minutes."

### "It's too expensive"
> "At $199/mo for unlimited employees, TalentPulse costs less per month than one hour of an employment attorney reviewing a biased performance review. One caught bias case pays for 2 years of the platform."

### "We don't have time to implement it"
> "Setup takes 15 minutes: connect Supabase, add your team, done. No implementation project. No consultant. We have customers who went from signup to first AI coaching suggestion in under an hour."

### "Our data is sensitive — we can't use AI tools"
> "All data stays in your Supabase instance — you own it. OpenAI calls are made with only the specific review text, never employee PII like names or demographics. Review our AUDIT.md for the full security posture."

### "We're too small"
> "Our Starter plan at $79/mo works for teams as small as 10. Most customers start there and grow into Pro as headcount scales."

---

## Competitive Positioning

| Platform | Price | Weakness vs TalentPulse |
|----------|-------|------------------------|
| Lattice | ~$11/user/mo (300 employees = $3,300/mo) | 15x more expensive at scale; no AI bias detection |
| 15Five | ~$14/user/mo | Per-seat pricing punishes growth; no coaching AI |
| Culture Amp | ~$5/user/mo | Survey-focused; weak OKR tracking; no AI coaching |
| Workday | $300k+/yr enterprise | Requires implementation partner; overkill for <1000 employees |
| Spreadsheets | "Free" | Zero automation; zero analytics; legal liability |

**TalentPulse wins on:** flat pricing at scale, AI-native (not AI-bolted-on), setup in minutes, open source infrastructure.

---

## Discovery Questions

1. "Walk me through how you run performance reviews today — who does what, and how long does it take?"
2. "What percentage of your OKRs get reviewed or updated after the initial kickoff meeting?"
3. "Have you ever had an HR complaint related to a performance review? How did you handle it?"
4. "How do your managers currently decide what to work on with direct reports in 1:1s?"
5. "If you could know one thing about your team's health right now, what would it be?"

---

## Demo Flow (30 minutes)

1. **0–5 min:** Dashboard overview — show org health score, at-risk OKRs widget
2. **5–10 min:** Employee profile — OKR progress bars, review history, feedback sentiment
3. **10–15 min:** Submit a test review — trigger bias detection live, show the flag
4. **15–20 min:** Generate an AI coaching suggestion — paste a real scenario if prospect allows
5. **20–25 min:** Billing page — show plan options, emphasize flat pricing
6. **25–30 min:** Q&A + next steps (trial signup or POC proposal)

---

## Pricing Psychology

- **Anchor high:** mention Enterprise (custom) first, then Pro ($199) feels reasonable
- **Per-seat comparison:** always convert competitor per-seat pricing to their actual headcount
- **Annual close:** offer 20% annual discount to close faster and reduce churn risk
- **Trial:** 14-day free trial, no credit card required — reduces friction for PLG motion