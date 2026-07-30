# The Farpost Story

**What this document is:** a running account of how Farpost got built, written for someone who isn't reading the code — a future user, a curious visitor, anyone who wants to know what this thing is, how it came to be, what each part actually does, and why it should matter to them. It grows over time, mainly at drift-audit checkpoints (see `farpost-drift-audit`), and it's meant to capture the real process — including the parts that didn't go smoothly — not a polished highlight reel.

Nothing in here should be read as a claim that Farpost has real customers, pilots, or production traffic unless a specific entry says so plainly. Where the project actually is matters more than how it sounds.

## What is Farpost?

Farpost is the living record of a building — kept current by the people who care about it and the professionals who keep it running, so that whatever moment needs it next, the answer is already there.

That's deliberately broader than "a place to hire a contractor" or "a database of properties." The idea is that a building — your home, a business you run, a rental you manage — accumulates facts about itself over time: what the roof is made of, when the furnace was installed, who last worked on the wiring, what the manuals say, who owns it. Right now, that information lives scattered across drawers, memories, and other people's filing cabinets, and it goes stale the moment nobody's looking at it. Farpost's bet is that this record deserves a real home, kept honest over time, useful to the person who lives there and to the professional who eventually gets called in.

## How it started

The name itself comes from a simple idea: every building Farpost tracks is its own "far post" — a specific, real place out in the world that the platform reaches out to and connects into one record.

The current version of Farpost is a full rebuild, started 2026-07-26. The previous version was a real, working system — but a close look at how it modeled "what role does this person play" turned up a genuine structural problem: the same idea (a person's professional role) was represented two different ways at once, in two places that could quietly drift out of sync with each other. That's the kind of bug that's worth stopping and fixing properly rather than patching a third time, so the decision was made to rebuild from the ground up rather than layer another fix on top.

The new technology stack wasn't picked from a blank page, either — it was found by looking at what had already been converged on, independently, across a couple of other real projects, before anyone had consciously named it "the stack." That's the version being built now: Fastify, Drizzle, Postgres, and better-auth on the backend, Next.js on the frontend.

## How it's being built

A few ground rules, in place from day one of this rebuild, worth being upfront about since they shape what gets built and when:

- **The plan comes before the code.** Every real feature gets a written proposal and, where there's a genuine technical decision to make, a design doc — agreed before anything gets built, not written up afterward to match whatever happened.
- **Tests ship with the feature**, not as a separate "we'll get to it" pass.
- **A real drift audit happens after each piece ships** — checking what was actually built against what the plan said it would do, honestly, not just "did it run without errors." This document gets updated at those checkpoints.

## The build log

### 2026-07-26 — Laying the foundation

Nothing user-facing exists yet — today was entirely about getting the foundation right before writing the first line of application code. What actually happened, and why it matters even though there's nothing to click on yet:

- **The vision got written down plainly**, on purpose, before any screen got designed: Farpost should work for anyone with real value tied to a building — most often your own home, but just as validly a business you run — not just for professionals. The professional side matters too (most users are professionals in some way, and Farpost should be where they make themselves known), but it's not the front door. The front door is simpler than that: you care about a place, so you claim it, and the record starts there.
- **Offline-first got committed to as a real requirement, not a nice-to-have.** The concrete case that made this non-negotiable: someone — a contractor, a scout, a homeowner in their own basement — loses signal exactly when they need to record something. What they capture needs to save right there on the device and quietly catch up with the real record the moment a connection comes back, without them having to think about it or lose the work.
- **The data model got its first real draft**, built around one core idea worth explaining plainly: a person's relationship to Farpost has two independent layers. One layer is "what can this person generically do" (are they a professional, an owner, an admin) — the other is "what's their relationship to this one specific building" (do they own this building, are they working this particular job). Keeping those separate is what lets one person be a homeowner, a tradesperson, and an admin all at once without the system getting confused about who they are.
- **The honest hard part got named out loud, not glossed over:** what happens when two people's information about the same building disagrees — logged by different people, possibly while both are offline, with different levels of verified trust. There's no existing playbook for this, and it doesn't get solved by writing more code that merely doesn't crash; it needs a real answer for what "the record is trustworthy" actually means, and a real way to check that it's true. That work is still ahead, deliberately called out here rather than assumed away.
- **The process tooling got set up**: OpenSpec for planning changes before building them, and a drift-audit checkpoint (this very entry is one) so this document — and the actual codebase — stay honest about what's really been done versus what was only planned.

Next up: the actual visual scaffold — the first thing anyone will be able to look at and recognize as "Farpost."

### 2026-07-26 — The first real screen

The first real, running piece of the rebuild shipped today: a desktop/laptop app shell — the frame every future Farpost page will sit inside. It's not a mockup or a screenshot anymore; it's a real Next.js app that builds, passes its tests, and runs in a browser.

What it looks like: a full-width navy header along the very top of the screen with the FARPOST wordmark, always visible while you scroll. Below it, a tiered navigation on the left (Platform, Network, Account — the first real section names, even though nothing behind them is wired up yet), a content area in the middle, and a right-hand rail that automatically builds an "on this page" outline out of whatever real headings exist on the page you're looking at — no one has to maintain that list by hand.

Two things worth being honest about, since this document is supposed to capture the real process:

- The plan called for the header to use a specific CSS technique (`sticky`), but the way it actually got built uses a different, equally valid one (`fixed`) that does the same job — stays pinned to the top of the screen. The build caught that the written plan contradicted itself in one spot and made a sensible call rather than guessing blindly, then said so plainly instead of quietly picking one. That's exactly the kind of honesty this whole process is designed to surface.
- Two decisions are still explicitly open, not pretended-closed: whether the right-hand rail's width will hold up once real content is heavier than today's placeholder text, and whether the specific navy/orange color values (pulled from Farpost's printed business cards) are actually meant to be the permanent web app colors or just a starting point. Both are flagged in the project's own records rather than swept under the rug.

Nothing behind this screen is real yet — no accounts, no real jobs, no real buildings. This is the shape everything else gets built inside, not the substance itself. That's next.

### 2026-07-26 — Sweating the header details

A same-day follow-up: after actually looking at the new screen in a browser, a handful of small but real refinements landed — breathing room around the brand text and the account icons, a color fix on the tagline, and one genuine change of mind: the settings/sign-in icons now line up with the *left* edge of the "on this page" list below them, instead of the right edge as originally built.

The interesting part isn't the pixel values — it's what fixing them exposed. Adding real padding around the header's text meant the header could no longer stay a fixed height; it now sizes itself to its own content. That's a small decision with a wide ripple: every other part of the page that has to leave room for the header — the navigation, the outline, where a page's own heading sticks — had to be recalculated against the header's *actual* rendered size, measured directly rather than assumed. That recalculation happened correctly and consistently everywhere it needed to, and was checked, not just assumed correct.

This is a small example of something worth naming plainly: a change that looks like "just spacing" can still have a real, honest ripple through a system, and the discipline here was in finding every place that ripple actually reached — not in avoiding it.

### 2026-07-26 — Mobile catches up to desktop

Mobile had been an afterthought up to this point — a couple of floating buttons with nothing behind them. Now it gets the same real header desktop has: a navy bar, an orange line, the Farpost name, and a proper cluster of icons (account, menu, settings) in a fixed order.

One real bug came out of building it, worth mentioning because it's exactly the kind of thing that only shows up when something is actually run rather than just written: consolidating the header into one shared piece for both phone and desktop screens meant a small structural mistake — a component asking for information before the thing supplying that information existed around it. It crashed immediately and obviously, in the way a mistake should, and got fixed on the spot. Nothing subtle slipped through.

The account icon does something a little clever, worth explaining plainly: it's actually two icons in the same spot, a "sign in" version and an "already signed in" version, with only one ever visible at a time. Neither has any way to know which one to show yet — that arrives with real accounts — but the switch itself is built and ready, so turning it on later is a small change, not a rebuild.

### 2026-07-26 — Settings that actually do something

A real `/settings` page landed today: font size, and reduced motion — nothing else. No dark mode, on purpose; that's simply not planned for Farpost right now, so no half-built toggle was left sitting there implying it does something it doesn't.

Reduced motion is worth calling out because it's easy to build a setting like this as decoration — a switch that flips but changes nothing anyone would notice. This one doesn't: turning it on genuinely removes the sliding animation on the phone navigation menu and makes jumping to a section of a page instant instead of a smooth scroll. If it doesn't visibly change anything, it isn't really a setting yet — just a promise.

One real, honest gap got written down rather than fixed on the spot: choosing a larger text size scales everything on the page, including the header itself — and the header's exact height is currently baked in as a fixed number in a few places. At the largest text sizes, that could mean the page's content crowds slightly under the header. Nobody's seen it happen yet, but it's a real, identified risk, logged plainly rather than quietly hoped away.

### 2026-07-27 — A server, for the first time

Everything up to now has been the frontend — the part you can look at in a browser. Today, for the first time, there's a real backend: a running server, and a real database sitting behind it, on this machine, both alive and talking to each other.

Nothing it does yet is interesting to a user — it has exactly one job right now, a health check, which exists purely to prove the wiring works: can the server reach the database, yes or no. That's deliberate. Getting the plumbing right, and proving it's right before building anything on top of it, matters more here than skipping ahead to something visible.

One honest correction is worth recording, because it's a good example of how this process is supposed to work: the original plan assumed a security mechanism would behave one way, and it turned out to actually work a different, equally correct way once someone actually tested it against the real thing. The plan got corrected to match reality, not the other way around — that's the point of writing things down and then checking them against what's actually true, rather than trusting the plan just because it was written first.

### 2026-07-27 — A real email, to a real inbox

Today, for the first time, someone could actually sign in to Farpost — not a simulation of it, the real thing. An email went out from `hello@farpost.ca`, landed in a real inbox, got clicked, and a real account and a real 30-day session were created, sitting in the real database right now.

The way in is deliberately simple: no password to create or remember, just an email address. Enter it, get a link, click the link, you're in — and if it's the first time, that same step quietly creates the account too. No separate signup form, no extra questions asked up front. That was a real decision, not a shortcut: an earlier version of this plan considered asking for more information before letting someone in at all, the way a sibling project of ours does for its own reasons. Farpost doesn't have a reason to ask for more right now, so it doesn't. Only ask for what's actually needed, when it's actually needed — not a moment before.

Nothing about how a person actually uses this yet, though — there's no sign-in screen to look at, no account page. Today's work is the wiring behind the wall, proven to work end to end with a real email and a real click. What it looks like comes next.

### 2026-07-27 — Signing in, for real, on a real screen

The screen came next, same day. There's now an actual page to sign in on, and an actual account page to land on afterward, showing the real email address of whoever's signed in and a real button to sign back out. The header's account icon — on both phone and desktop now, matching each other for the first time — genuinely changes to reflect whether you're signed in, live.

Real end-to-end testing found a real bug before anyone else could: the link in the email was landing in the wrong place, one address instead of another, because the address it pointed to needed to be spelled out in full rather than left partial. It was fixed by testing the actual link, in an actual inbox, rather than trusting that the plan on paper was correct — the exact discipline this whole process depends on, working as intended.

### 2026-07-27 — Live, on real domains

Farpost is now actually reachable on the internet, at the real domains it's always meant to live at: `farpost.ca` and `api.farpost.ca`. Not a test environment, not a preview link — the real thing, replacing an older version of Farpost that had been quietly running on the same two services since before this rebuild started.

This is worth being honest about, because it wasn't a clean, one-click switch, and pretending it was would defeat the whole point of writing this document. Three separate, real problems showed up, one at a time, each with its own real cause:

- The hosting platform's connection to "which code should I build" had to be repointed from the old codebase to the new one — and the first attempt at that silently didn't take, so it kept rebuilding the old version even though the settings looked right on screen. Caught by checking what was actually running, not just what a screen claimed, and fixed by redoing it more carefully.
- Once it was building the right code, the build itself failed — a mismatch between the version of the tools used to write the project locally and the version the hosting platform assumed by default. Fixed by being explicit about which version to use, rather than letting it guess.
- Once that was fixed, the app started up successfully but still couldn't be reached — the hosting platform was still listening on a numbered address left over from the old version, not the one the new app actually used. Found and fixed directly, not guessed at.

None of these were mysterious once looked at properly — each one had a real, checkable cause, and each got fixed by actually looking rather than assuming. The last step was the one that mattered most: signing in for real, on the real domain, and confirming a real session actually carries over correctly between the two separate addresses (`farpost.ca` and `api.farpost.ca`) that make up the whole system — the exact thing that only worked by accident during local development, now confirmed to work for real reasons instead.

### 2026-07-27 — The building itself becomes real data

Everything so far has been about the platform's frame — the screens, the sign-in, the server. Today the first piece of what Farpost is actually *for* landed: a real database structure for the things Farpost tracks — a property (the land), a building on it, individual units inside a building for places with more than one occupant, the trackable equipment/systems inside them (a roof, a furnace, a water heater), and the record of who has a real stake in any of that — an owner, a tenant, a professional relationship.

Two ideas worth explaining plainly, because they shape everything built on top of this from now on:

- **A building's owner isn't stored as three plain text fields on the building itself.** That sounds like a strange thing to call out, but it's a deliberate fix for a real bug the previous version of Farpost actually had — the same fact (who owns this place) ending up represented in more than one spot, with no guarantee those spots agree with each other. Instead, ownership lives in its own dedicated record — one that can represent a building nobody's claimed yet just as cleanly as one with a fully verified owner, and that carries a real trust level: is this a name someone typed in about a building they don't yet control, or a verified claim that's gone through a real check?
- **Equipment isn't locked to "must belong to a building."** A well or a septic system can belong to the land itself, with no building involved at all — so the record for a piece of equipment can point at a property, a building, or a unit, whichever is actually true for that item, rather than forcing every case into the same shape.

Two real, honest snags came up while building this, worth naming rather than glossing over: the database software this runs on didn't actually have the mapping-and-location extension it needed installed at all — not just switched off — so that had to be added before anything with a real-world location could be stored; and the tool that generates the technical database instructions had a genuine bug in it, writing an invalid instruction for exactly the kind of location column this feature needed, caught and hand-corrected before it could cause a silent failure later.

### 2026-07-27 — The marketplace core gets its data structure

Same day, one layer deeper: the actual "someone needs work done, a professional gets matched to it" mechanic now has a real place to live in the database. A professional can have a public profile, a service area and capacity for taking on work, and tracked credentials (licenses, certifications, the kind of thing a real trade actually needs to prove). A request for work — a `Job` — can be about a building, a piece of equipment, or an insurance claim, gets offered out to candidates one at a time, and carries its own notes, attachments, and a cost breakdown that knows the difference between "here's an estimate" and "here's the actual bill," tax included.

One old idea got deliberately laid to rest today, worth explaining because it shows how a system is supposed to get simpler over time, not just bigger: insurance claims used to track their own separate progress status, entirely apart from whatever work was actually happening. That got merged — a claim's progress today *is* the progress of the job doing the work, with one exception (whether the claim itself is closed), which is honestly simpler than tracking the same thing twice in two places that could disagree. That finding didn't come from reading today's plans harder — it came from going back and actually checking how the very first version of Farpost really worked, which is exactly the kind of thing this whole process is set up to encourage: check the real, checkable thing, don't just guess from a summary.

A second small, real correction: a rule about how "who's still waiting to hear back on a job offer" gets tracked turned out to conflict with a genuine limitation of the database software itself — a filter that included "the deadline hasn't passed yet" couldn't actually be built the way it was first planned, because databases won't let a rule depend on "what time is it right now" in the specific place this needed it. Simplified to "hasn't responded yet," with the deadline check handled separately by whatever process actually watches for timeouts. A small technical wrinkle, but the kind worth naming rather than hiding — the plan met a real limit and adjusted, rather than either ignoring the limit or grinding to a halt over it.

Like the building-record work before it, nothing here is visible yet — no screen anywhere reads or writes any of this. But the actual mechanism at the center of what Farpost is supposed to do — get the right person to the right job — now has real, tested ground to stand on.

### 2026-07-27 — A real, versioned checklist

Same day, one more piece of the foundation: a proper, reusable checklist now has somewhere real to live. Before today, a "checklist" in this rebuild's design was just an idea with no actual shape — checking the very first version of Farpost confirmed that its own checklist was even thinner than expected, just a plain yes/no per item with no defined, reusable question list behind it at all. Now there's a real named, versioned set of questions (say, "Electrical Safety Checklist") that someone curates once and reuses many times, and a real record of each time it's actually run against a building — who ran it, exactly which version of the checklist they used (so it stays traceable even after the checklist itself gets improved later), and a richer answer for each question than a bare yes/no: acceptable, not inspected, not present, a safety concern, needs repair, or needs a follow-up.

This one went the smoothest of the three schema pieces built today — no real infrastructure surprises, because this piece doesn't touch the mapping/location data that tripped up the earlier two. The one open judgment call, flagged honestly rather than quietly decided: what values a checklist *run's* overall result can take (in progress, clean, or issues found) isn't something any prior planning document actually specified, so a reasonable answer was chosen and marked as needing a real second look before it's depended on.

Deliberately left undone, on purpose: no connection was drawn between a checklist run and the "request for work" object built earlier today, even though the obvious real-world case — an inspector visiting on a job — connects the two naturally. Neither of Farpost's own planning documents actually called for that connection, and guessing at it now risks exactly the kind of mistake already caught and fixed once before, where two things that look similar quietly got tangled together before it was clear they should be. Better to leave it a visible gap than invent a wrong answer.

Nothing about this is visible yet — there's still no screen where any of this shows up. But it's the actual foundation the near-term features (a simple digital record of what's in your home, a maintenance timeline, seasonal reminders) will be built directly on top of, not a placeholder for it.

### 2026-07-27 — A record of what happened, to whoever needs to know it

Same day, the last piece of today's foundation work: a real place to record *that something happened* — separate from the record of the thing itself. A job got created, a claim got closed, an inspection got completed — each of those is now a real, permanent fact, with who (or what) caused it, what it's about, and who needs to be told.

The second half matters just as much as the first: who gets told isn't one shared checkbox anymore. Each person who needs to know about something now has their own, independent row — so if an owner and their property manager both need to hear about the same event, one of them reading it doesn't quietly mark it "read" for the other. That's a small, deliberate fix for a real sloppiness the very first version of Farpost had — where "has this been seen" was tracked once, globally, for everyone, instead of once per person.

One honest, small thing worth naming: while building this, a real mismatch turned up between an early planning note and how a person's account is actually stored in the database — the note assumed one column type, the real column is a different (also fine) one. It got caught and corrected before it could become a bug nobody would understand months from now, in exactly the way this whole process is meant to catch it.

Like the other schema work today, nothing about this is visible on screen yet. But it's what every future notification — an email, an in-app alert, an activity feed — will eventually be built on top of.

### 2026-07-27 — Deciding who should hear about it

Same day, the last piece: a real place to write down "notify this person when this kind of thing happens." That's separate from the record of the event itself, and separate from tracking who's actually been told — this is the standing preference, set once and reused every time a matching event happens from then on. A homeowner can say "tell me about anything involving my building." A contractor can say "tell me about new jobs in this postal code." An adjuster can say "tell me about every claim, anywhere" — genuinely global, not scoped to one place.

That third case is worth calling out honestly: checking how the very first version of Farpost actually worked in production turned up a real, useful fact — a notification "channel" field (email vs. text vs. in-app) had existed there the whole time, but nothing ever actually used it. Every real notification that ever went out was hardcoded to one specific method, completely disconnected from that setting. The new version keeps a place for that preference to live, honestly, without pretending it already does something it doesn't — the actual multi-channel delivery is still a real piece of work still ahead, not quietly implied as already done.

Nothing about this is visible yet, same as the rest of today's foundation work. But between this and the event record before it, the two real pieces a future "you've got something new to look at" feature needs are both now in place.

### 2026-07-27 — Keeping the record honest over time

Same day, one more real piece of the "living record" idea landed: a place to track which facts about a building are getting old, a place to record who contributed what, and a place to record what an actual field visit turned up. All three used to be loose, unstructured lists buried inside a building's own record in the very first version of Farpost — now they're real, independently trackable things, the same upgrade already given to a building's units, equipment, and ownership records earlier in this rebuild.

The staleness piece is worth explaining plainly, since it's central to what "living record" actually means: every documented fact about a building — its roof, its wiring, its plumbing — has a shelf life. A roof inspected five years ago is a different kind of fact than one inspected last month, and the system now knows, for every single fact, exactly when it should be considered due for a fresh look — calculated by the database itself, every time, rather than trusted from a number some other piece of code remembered to update. That distinction matters more than it sounds: it's the difference between a promise that's true because someone remembered to keep it true, and one that's true because it can't be anything else.

One real, honest snag came up building the staleness calculation, worth naming because it's a good example of the discipline this process is built around: the way the "when does this become stale" date was originally planned to be calculated turned out to rely on a database behavior that isn't actually guaranteed to be stable — a subtle distinction, but a real one, and the database correctly refused to accept it rather than silently doing something wrong. Three different ways of writing the same calculation were tried against a scratch, throwaway copy of the table until one was found that both worked and produced the identical, verified answer — then, and only then, applied to the real thing.

Nothing about any of this is visible on a screen yet. But it's another real piece of today's foundation, on top of twenty-four real tables built so far.

### 2026-07-27 — Deciding how Farpost gets paid

The last piece of a very long day: a real place to track who's actually paying for an account. The plan, decided today: every account — everyone, no exceptions — pays the same small yearly fee (framed as "$1 a month," charged as one $12 payment a year) to unlock some extra things beyond the free basics. What those extra things actually are hasn't been decided yet, and that's fine — today was about making sure the underlying plumbing is ready whenever that decision gets made, not about building the features themselves.

One thing worth explaining, since it shapes how flexible this ends up being: the price itself isn't hardcoded anywhere. It's just a number stored alongside each person's subscription, so raising the price later — say from $1 to $5 a month — doesn't require touching the database at all. It also means existing subscribers can be left at their original price if that's ever the right call, since each subscription remembers its own price independently.

Two other real ideas surfaced today but were deliberately left for later, on purpose, not forgotten: charging a fee only when a professional actually completes a paid job (the old version of Farpost already did something like this), and letting people pre-pay for a bundle of credits to spend over time, the way you'd buy a book of stamps. Both are real, well-understood ideas — they're just waiting for actual evidence that they're needed before any code gets written for them.

That closes out today's run of foundational database work: eight separate pieces, each planned, built, checked against the real database, and confirmed working, in one very long day.

### 2026-07-27 — The first real screen someone can actually use

Everything up to this point today was foundation nobody could see — real tables, sitting empty, with nothing built to read or write them. That changed today: there's now a real page, `/features/systems-passport`, where a building owner can look at the systems in their home (roof, furnace, water heater — whatever they've entered), add a new one, and mark its condition. Nothing fancy yet, but it's real: type something in, click add, refresh the page, it's still there.

Two things worth naming honestly, since that's the whole point of this document. First, there's currently no way for a real person to actually become a building's owner yet — that's a separate piece of work (something like scanning an NFC tag on the building, eventually) that hasn't been built. So today's testing used a stand-in: a real building and a real "this person owns it" record, inserted directly for testing purposes, not through any screen a real user would ever see. Second, a genuinely useful bug turned up specifically *because* this got tested in an actual browser rather than just checked by a script: editing a system's condition failed silently the first time, because of a security setting that, by default, only allows a website to read data from a server, not update it — completely invisible to any test that doesn't use a real browser. Found and fixed on the spot.

The bigger point: this is the first time in the rebuild that "planned it, built it, checked it" included an actual person clicking around a real screen — not just a database query confirming the right row exists. That's a meaningfully higher bar, and it already caught something a database check alone never would have.

### 2026-07-28 — A repeatable way to actually try the thing out

The systems passport page mentioned above works, but there was a real problem trying to use it a second time: the only way to give an account a home to manage was a one-off, hand-typed database insert, done once for the original testing session and then gone — nothing saved, nothing reusable. Anyone who wanted to try the feature after that, including the person building Farpost, hit the same wall the very first user will: no home, nothing to look at.

Today that got fixed properly, not patched around again. There's now a single command that gives a real account — this time, a real one, not a placeholder — everything it needs to actually use the systems passport: a home to manage, and a couple of starter systems already recorded in it (a roof, a furnace). Run it once and it sets everything up; run it again by accident and nothing gets duplicated — it notices what's already there and leaves it alone. The account itself was created through the exact same "email me a link" sign-in every real user will go through, not a shortcut — which meant a real email actually landed in a real inbox, a nice, honest confirmation that the sign-in path genuinely works end to end, not just in a test.

The bigger idea behind this one is more important than the feature it happens to unlock first: this same command is meant to be the pattern for every feature built from here on, not a one-time fix for this one page. The very next feature already queued up needs the exact same thing — a real home to test against — so this piece of work pays for itself twice before it's even been reused once.

### 2026-07-29 — Filling out the systems passport, and a process slip worth naming

The systems passport screen from two days ago could add a system and mark its condition, but every other useful detail about that system — who made it, when it was installed, when it was last serviced, where it is in the building — had nowhere to go, even though the underlying record could already hold most of it. Today that screen got filled out properly: every tracked system now has a real form for manufacturer, model, serial number, location, installed date, last-serviced date, warranty expiry, condition, notes, and photo links. Two of those fields — location and last-serviced date — didn't exist in the record at all before today; they were added because a system that's serviced repeatedly (a furnace, say) needs a date for that separate from the date it was first installed. Dates themselves now use three small boxes for month, day, and year instead of one free-text field, which sounds minor but genuinely isn't: a date typed as plain text is easy to misread (is "03/04" March 4th or April 3rd?), and three separate boxes make that ambiguity impossible.

Worth naming honestly, since that's this document's whole point: this particular piece of work broke the project's own rule that planning and building happen in separate sessions. It got built directly, in one sitting, without a written plan agreed beforehand — caught not by any internal check, but by the person running the project noticing it and asking about it directly. Nothing had been committed yet, so the fix was to write the plan afterward, honestly labeled as after-the-fact rather than backdated to look otherwise, and to go back and add the automated tests that should have shipped with the feature the first time (they hadn't — only a manual check in a real browser had been done, which is a real gap the same after-the-fact review caught and closed before calling it done). The rule itself doesn't change; this is what it looks like when it gets skipped once and then corrected in the open rather than quietly.

One honest, small hiccup along the way, worth naming rather than skipping: the very last check — actually clicking through the page in a real browser — first failed for a boring reason that had nothing to do with Farpost itself. The little helper script written to pull a sign-in code out of the database got tripped up by how a certain kind of text needs to be typed differently depending on which command-line program is reading it. Fixed in a couple of minutes once spotted, and a good reminder that "it's not working" is sometimes just a quoting mark in the wrong place, not a real bug.
