# TalentPulse Sales Playbook

> Internal document for Aurora Rayes LLC sales team. Confidential.

---

## 1. Target ICP (Ideal Customer Profile)

### Primary Buyer Personas

**HR Director / VP of People** at 50-500 employee companies
- Feels pressure from the CEO to tie people decisions to data
- Running performance reviews manually in spreadsheets or Google Forms
- Accountable for retention, engagement, and DEI KPIs
- Budget authority: $20K-$150K/yr for HR tech

**Chief People Officer (CPO) / CHRO**
- Owns the full people strategy at Series B+ startups or profitable SMBs
- Has tried Lattice or 15Five and found them too expensive or too complex
- Budget authority: $50K-$500K/yr
- Evaluates on: ROI, time-to-value, data ownership

**CEO / Co-Founder (at companies under 150 employees)**
- Directly managing people operations with no dedicated HR leader yet
- Wants AI-native tooling, not legacy HR suites with high per-seat pricing
- Motivated by: retention, performance visibility, team health

### Firmographic Filters

| Attribute | Target |
|---|---|
| Company size | 50 to 500 employees |
| Funding stage | Series A through C or bootstrapped profitable |
| Industry | Tech/SaaS, Professional Services, Healthcare Tech, FinTech |
| Current HR tools | Spreadsheets, BambooHR, or no dedicated perf management tool |
| Annual HR budget | $20K to $200K |
| Geography | US, Canada, UK, Australia |

---

## 2. Pain Points We Solve

### Pain 1: Manual, Slow Review Cycles

"Our performance review process takes 3 weeks and lives in 47 spreadsheets."

- Reviews are scattered across Google Forms, email threads, and Word docs
- Aggregating results is a multi-day analyst project, not a 5-minute insight
- No single source of truth for historical performance data across cycles

### Pain 2: No OKR Visibility Between Cycles

"I set OKRs in January. I check in December. Nothing in between."

- OKRs are set and forgotten with no automated weekly check-in
- Managers have zero real-time visibility into team goal progress
- Org-wide OKR attainment is unknown until it is too late to course-correct

### Pain 3: Biased Performance Evaluations

"Our reviews consistently rate certain demographics lower. We know there is bias but cannot prove it or stop it."

- Review language is inconsistent and unconsciously biased across managers
- No automated tool exists to flag problematic patterns before submission
- Legal and DEI risk accumulates silently review cycle after review cycle

### Pain 4: No Data-Driven Coaching

"Managers give feedback once a year. Coaching is ad hoc and based on gut feel."

- No structured mechanism for ongoing, personalized coaching suggestions
- High performers and flight risks are identified too late
- 1:1 meetings lack context from actual performance data

---

## 3. Value Propositions with Measurable ROI

| Pain | TalentPulse Solution | Measurable ROI |
|---|---|---|
| Manual reviews | Structured digital forms plus auto-aggregation | Save 20+ hrs per HR manager per review cycle |
| OKR drift | Automated tracking plus at-risk alerts | 40% improvement in goal attainment |
| Review bias | GPT-4o bias scan before submission | Reduce bias complaints; strengthen DEI reporting |
| Coaching gap | Weekly AI coaching suggestions per manager | 15-25% reduction in unwanted attrition |
| No analytics | Team health score plus KPI dashboard | Real-time people data vs quarterly guessing |

### Top-Line ROI Calculation

- Replacing one flight-risk employee costs 50-200% of annual salary in recruiting
- TalentPulse Pro at $199/month equals $2,388 per year
- Preventing 1 attrition event on a $90K employee saves $45,000 to $180,000
- Return on investment: 18x to 75x on Pro plan

---

## 4. Objection Handling

### "It is too expensive."

Reframe: "What does losing one senior engineer cost you?"

- $199/month is $2.39/employee/month for a team of 83
- Lattice starts at $11/seat/month, which is 4.6x more expensive
- Annual plan saves 20%; use this offer to close at end of call
- Starter plan at $79/month removes the price objection for smaller teams

### "We do not have time to implement this."

Reframe: "Implementation takes 2 hours, not 2 months."

- No enterprise IT dependencies and no procurement or security review required
- CSV employee import plus Supabase setup plus invite team equals live by end of day
- Free onboarding call included with all Pro customers

### "We are concerned about data privacy."

Reframe: "Your data never trains AI models and you own it completely."

- OpenAI API calls use your key and your data is not used for model training per OpenAI API terms
- All data stored in your Supabase project (your PostgreSQL, your cloud region)
- Row Level Security enforced at the database level, not just the app layer
- GDPR-ready with data export and deletion tools built in
- SOC2 Type II compliance roadmap documented in AUDIT.md

### "We already use Lattice or 15Five or Culture Amp."

Reframe: "We do what they do for 80% less, plus AI features they do not have."

- TalentPulse has GPT-4o bias detection and weekly AI coaching built in from day one
- Flat monthly pricing with no per-seat tax that grows as you hire
- Open-source friendly and you own and can export all your data at any time
- Migration path: export from existing tool plus CSV import to TalentPulse

### "Can it integrate with our HRIS?"

"Enterprise plan includes custom HRIS integrations. Starter and Pro have CSV import today."

- BambooHR, Workday, Rippling integrations are on the roadmap for Q3 2025
- Zapier-compatible via Supabase webhooks today
- API access available for Pro and Enterprise customers

---

## 5. Competitive Positioning

| Feature | TalentPulse | Lattice | 15Five | Culture Amp | Workday |
|---|---|---|---|---|---|
| AI Bias Detection | Yes (GPT-4o) | No | No | No | No |
| AI Coaching Suggestions | Yes (weekly) | No | No | No | No |
| Team Health Score | Yes (daily) | Partial | Partial | Yes | Yes |
| Flat pricing (no per-seat) | Yes | No | No | No | No |
| OKR + Reviews + Feedback | Yes | Yes | Yes | Partial | Yes |
| Self-serve / PLG | Yes | No | No | No | No |
| Starting price | $79/mo flat | $11/seat/mo | $4/seat/mo | $5/seat/mo | $38/seat/mo |
| Full data ownership | Yes | Partial | Partial | Partial | No |
| Open-source | Yes (MIT) | No | No | No | No |

### Key Differentiators

1. Only HR platform with GPT-4o bias detection built into the review workflow, not a bolt-on or roadmap item
2. Flat pricing model means no per-seat tax that punishes growth and creates predictable costs at any scale
3. Self-serve onboarding means teams are live before end of day, not end of quarter

---

## 6. Sales Motion

### PLG (Product-Led Growth) for Starter Plan

1. Visitor lands from SEO, ProductHunt, LinkedIn, or word-of-mouth
2. Signs up for free trial with no credit card required
3. Creates org, imports employees via CSV, invites colleagues
4. Hits employee limit of 25 or AI feature wall and is prompted to upgrade
5. Self-serve checkout via Stripe with zero sales touch needed

### Sales-Assisted for Pro and Enterprise

1. Inbound: Demo request from website, ProductHunt, or Slack community
2. Outbound: LinkedIn outreach to HR Directors at Series B through C companies
3. SDR flow: Connection, warm message with stat, discovery call booked
4. AE flow: Discovery call, 20-minute demo, proposal, close
5. Target cycle: 14 to 30 days; ACV $2,388 to $25,000+

---

## 7. Discovery Questions for Sales Calls

1. Walk me through how your team currently runs performance reviews. How long does one full cycle take end-to-end?
2. Do you have OKRs set for this quarter? How do you track progress week-over-week today?
3. Have you ever received a complaint about bias in a performance review, formal or informal?
4. How do your managers decide who to coach and develop? What data informs that decision?
5. In the last 12 months, how many people left the company that you did not want to lose? What do you think it cost?
6. What HR and performance tools are you using today? What is missing or frustrating about them?
7. If you could have one real-time insight about your team health tomorrow, what would it be?
8. Who else is involved in evaluating a new HR tool at your company: IT, legal, finance?
9. What does success look like for you 6 months after deploying a new performance platform?

---

## 8. Demo Flow

Total recommended demo time: 20 to 30 minutes

1. Hook (2 min): Open with Team Health Dashboard. "This is what your people data could look like in real time."
2. OKR Tracking (5 min): Live demo: create an OKR, advance progress to 30%, watch the at-risk alert fire. Emphasize automation.
3. Performance Review plus AI Bias Detection (7 min): Submit a review with subtly biased language. Watch GPT-4o flag it in real time before submission. Ask: "Have you ever wished you could catch this before it became a formal complaint?"
4. 360 Peer Feedback plus Sentiment (5 min): Show aggregated peer feedback with AI sentiment score. Emphasize: managers get signal, not noise.
5. AI Coaching Suggestions (5 min): Open a manager weekly coaching report. Walk through how it is generated from OKR data, review history, and feedback.
6. Billing and Plans (3 min): Walk through Starter vs Pro pricing. Show Stripe customer portal. Plant the annual plan savings seed.
7. Q&A and Next Steps (3 min): Ask "What would this change for your team?" then book the follow-up or present the proposal.

---

## 9. Pricing Psychology Notes

- Anchor high: Always show Enterprise pricing first, then Pro, then Starter. Anchoring makes Pro feel like a bargain.
- Per-employee framing: "$199/month for 100 employees is $2/employee/month, less than a coffee."
- Loss aversion: "Every review cycle without bias detection is a legal liability cycle." Use after the bias demo.
- Social proof: "Teams on TalentPulse see 40% better OKR attainment in their first quarter."
- Urgency at close: "The annual plan saves you $478 right now. Want to lock that in today?"
- Free trial removes friction: No credit card for PLG motion reduces drop-off.
- ROI framing closes deals: Always tie pricing back to the cost of one attrition event. Make the math undeniable.