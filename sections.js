/*
 * The three scroll-driven sections: the why line, the feature rail, the ring
 * cloud. No libraries — everything here is scroll position or CSS animation.
 */
(() => {
	"use strict"

	const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)")

	/* ── hero: the page, and the file it writes to ─────────────────────── */

	/*
	 * Every line below is the real file from the recording — test3's chair page,
	 * .caret/pages/chair/index.tsx — at the line numbers it actually occupies.
	 * The two edits in the video are a colour pick on the topbar CTA (line 49)
	 * and a drag-resize of the gallery image (line 99). brand-500 is #d64b2a in
	 * that project's theme, which is why the picked colour resolves to a token
	 * rather than a hex; 825px is what the drag finished on, measured off the
	 * last frame and confirmed against the file.
	 *
	 * The beat times are measured, not guessed: the green confirmation toast
	 * turns on at 7.15s and 12.60s of hero-loop.mp4. The panel reads the
	 * video's own currentTime, so the line lands on the frame the edit lands
	 * and the loop re-arms itself with no bookkeeping.
	 */
	const CODE_ROWS = [
		{ n: 46, code: `    </nav>` },
		{ n: 47, code: `    <button` },
		{ n: 48, code: `      data-caret-id="topbar-reserve-cta"` },
		{
			hunk: 1, n: 49,
			del: `      className="rounded-full bg-neutral-900 px-6 …"`,
			add: `      className="rounded-full bg-brand-500 px-6 …"`,
			delHit: "bg-neutral-900", addHit: "bg-brand-500",
		},
		{ n: 50, code: `    >` },
		{ n: 51, code: `      Reserve` },
		{ n: 52, code: `    </button>` },
		{ gap: true },
		{ n: 94, code: `  <div className="md:col-span-8">` },
		{ n: 95, code: `    <img` },
		{ n: 96, code: `      data-caret-id="material-image"` },
		{ n: 97, code: `      src="/caret-assets/fold-gallery.webp"` },
		{ n: 98, code: `      alt="The Fold chair alone in a bright …"` },
		{
			hunk: 2, n: 99,
			del: `      className="w-[345px] rounded-xl"`,
			add: `      className="w-[825px] rounded-xl"`,
			delHit: "w-[345px]", addHit: "w-[825px]",
		},
		{ n: 100, code: `    />` },
		{ n: 101, code: `  </div>` },
	]

	const BEATS = [
		{ hunk: 1, at: 6.9, note: "Matched brand-500 — bound to the token" },
		{ hunk: 2, at: 12.6, note: "Edit applied" },
	]
	const LOOP = 15.9   // hero-loop.mp4, measured

	const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

	// Tags, attributes and strings in one pass. Two sequential regex replaces
	// would re-match the class= inside the spans the first one just inserted.
	const paint = (line, hit) => {
		const out = []
		for (const part of line.split(/("(?:[^"\\]|\\.)*")/g)) {
			if (!part) continue
			if (part[0] === '"') {
				let str = esc(part)
				if (hit) str = str.split(esc(hit)).join(`<b class="t-hit">${esc(hit)}</b>`)
				out.push(`<span class="t-str">${str}</span>`)
			} else {
				out.push(esc(part).replace(
					/(&lt;\/?)([A-Za-z][\w.-]*)|([A-Za-z][\w-]*)(=)/g,
					(m, lt, tag, attr, eq) => lt
						? `<span class="t-pun">${lt}</span><span class="t-tag">${tag}</span>`
						: `<span class="t-attr">${attr}</span><span class="t-pun">${eq}</span>`,
				))
			}
		}
		return out.join("")
	}

	const body = document.getElementById("codeBody")
	const demo = document.getElementById("heroDemo")
	if (body && demo) {
		const row = (n, cls, html) =>
			`<div class="ln ${cls}"><i>${n}</i><code>${html}</code></div>`

		body.innerHTML = CODE_ROWS.map((r) => {
			if (r.gap) return `<div class="ln ln-gap"><i></i><code></code></div>`
			if (!r.hunk) return row(r.n, "", paint(r.code))
			return `<div class="hunk" data-hunk="${r.hunk}">` +
				row(r.n, "row-del", paint(r.del, r.delHit)) +
				row(r.n, "row-add", paint(r.add, r.addHit)) +
				`</div>`
		}).join("")

		const hunks = new Map([...body.querySelectorAll(".hunk")].map((h) => [+h.dataset.hunk, h]))
		const note = document.getElementById("codeNote")
		const video = demo.querySelector("video")

		/*
		 * The video HOLDS at each edit. Left to run, the loop has scrolled to the
		 * next section by the time the red line has finished collapsing, so the
		 * panel reads as lagging behind a video that has moved on. Freezing the
		 * frame that shows the edit landing is also the truer picture: the write
		 * is what the app is confirming on screen at that moment.
		 *
		 * A hold runs on wall-clock time rather than the media clock, because
		 * the media clock is exactly what is stopped.
		 */
		const FIRE = 1500   // red and green both up, long enough to read the line
		const SETTLE = 900  // the del row collapsing and the green tint fading out

		const state = BEATS.map(() => ({ phase: "idle", since: 0 }))

		const clear = () => {
			for (const s of state) { s.phase = "idle"; s.since = 0 }
			for (const el of hunks.values()) el.classList.remove("is-firing", "is-settled")
			if (note) note.classList.remove("on")
		}

		if (REDUCED.matches) {
			// No clock at all: show the file as it ends up, which is the point
			// the animation was making.
			for (const el of hunks.values()) el.classList.add("is-settled")
		} else {
			// Autoplay is not guaranteed — data saver and low power mode both
			// refuse it — so the panel keeps a clock of its own to fall back on.
			// Which clock is decided by the video itself rather than by sampling
			// it on a timer: polling `paused`/`currentTime` at a fixed moment
			// misreads a video that is loading but will play, and a panel that
			// switches away on that misreading runs permanently out of step with
			// a video that starts a second later. One `timeupdate` is proof the
			// video's clock is real, and it also un-does the fallback if it
			// arrives late.
			let own = null
			let live = false
			if (video) video.addEventListener("timeupdate", () => { live = true; own = null }, { once: true })
			setTimeout(() => { if (!live) own = performance.now() }, 4000)

			// The fallback clock has to hold too, or the beats it is driving fire
			// while the panel is still animating the previous one.
			let paused = 0
			let pausedAt = 0
			const clock = () => own === null
				? video.currentTime
				: ((performance.now() - own - paused) / 1000) % LOOP

			const stop = () => {
				pausedAt = performance.now()
				if (own === null && video) video.pause()
			}
			const start = () => {
				if (own === null && video) video.play().catch(() => {})
				else paused += performance.now() - pausedAt
			}

			let last = 0
			let running = false

			const tick = () => {
				if (!running) return
				const now = performance.now()

				const i = state.findIndex((s) => s.phase === "holding")
				if (i !== -1) {
					const b = BEATS[i]
					const el = hunks.get(b.hunk)
					const gone = now - state[i].since
					if (gone >= FIRE) {
						el.classList.remove("is-firing")
						el.classList.add("is-settled")
					}
					if (gone >= FIRE + SETTLE) {
						state[i].phase = "done"
						if (note) note.classList.remove("on")
						start()
					}
					requestAnimationFrame(tick)
					return
				}

				const t = clock()
				if (t < last) clear()   // the loop came round
				last = t

				for (let j = 0; j < BEATS.length; j++) {
					const b = BEATS[j]
					if (state[j].phase !== "idle" || t < b.at) continue
					state[j].phase = "holding"
					state[j].since = now
					hunks.get(b.hunk)?.classList.add("is-firing")
					if (note) { note.textContent = b.note; note.classList.add("on") }
					stop()
				}
				requestAnimationFrame(tick)
			}

			new IntersectionObserver((entries) => {
				const on = entries.some((e) => e.isIntersecting)
				if (on === running) return
				running = on
				if (on) { last = clock(); requestAnimationFrame(tick) }
				else {
					// Scrolling away mid-hold would otherwise leave the video
					// paused for good, since nothing is left running to resume it.
					const i = state.findIndex((s) => s.phase === "holding")
					if (i !== -1) {
						state[i].phase = "done"
						const el = hunks.get(BEATS[i].hunk)
						el.classList.remove("is-firing")
						el.classList.add("is-settled")
						if (note) note.classList.remove("on")
						start()
					}
				}
			}, { rootMargin: "120px" }).observe(demo)
		}
	}

	/* ── feature rail ──────────────────────────────────────────────────── */

	const FEATURES = [
		{
			n: "01", h: "Edit on the page", v: "f1-edit", w: "caret — index.tsx",
			p: "Right-click any text, colour or image and change it there. Caret writes it into the page's own file in <code>.caret/</code> and the page reloads.",
			x: "Pick a colour and it checks it against your tokens. If one is close it writes the token, not a hex code, so changing your brand colour later changes everywhere that used it.",
		},
		{
			n: "02", h: "Ask for the harder ones", v: "f2-describe", w: "caret — overlay",
			p: "Some things are too fiddly to click. Paint over the part of the page you mean and say what you want.",
			x: "Your agent gets the exact elements you marked, so it does not have to guess which bit you meant.",
		},
		{
			n: "03", h: "Three versions at once", v: "f3-takes", w: "caret — playground",
			p: "When you do not know what you want yet, ask for a few. Caret builds them side by side, live, and you keep one.",
			x: "Picking leaves an undo step, so changing your mind costs nothing.",
		},
		{
			n: "04", h: "Make the assets too", v: "f4-assets", w: "caret — assets",
			p: "Say what the thing is and Caret makes it. Logos as real vector files, photographs, textures, animated backgrounds written as code.",
			x: "How it is lit, framed and coloured comes from your tokens, so it matches the rest of your work.",
		},
		{
			n: "05", h: "Your whole product", v: "f5-canvas", w: "caret — canvas",
			p: "Every page on one canvas. The page you are working on runs as live, interactive React. The rest stay fast as thumbnails.",
			x: "Switch viewport presets to check how it holds up across screens.",
		},
	]

	const tl = document.getElementById("timeline")
	if (tl) {
		tl.innerHTML =
			`<div class="rail"><span class="beam"></span></div>` +
			FEATURES.map((f) => `
				<div class="row">
					<div class="pin"><span class="knot"><i></i></span><h3>${f.h}</h3></div>
					<div class="body">
						<p>${f.p}</p>
						<p class="more">${f.x}</p>
						<div class="shot">
							<div class="shot-bar"><span></span><span></span><span></span><em>${f.w}</em></div>
							<video class="shot-media" autoplay muted loop playsinline preload="none"
							       poster="assets/video/${f.v}.jpg" aria-label="${f.h}">
								<source src="assets/video/${f.v}.mp4" type="video/mp4" />
							</video>
						</div>
					</div>
				</div>`).join("")

		const rail = tl.querySelector(".rail")
		const beam = tl.querySelector(".beam")
		const rows = [...tl.querySelectorAll(".row")]

		// Two traps here, both of which produce a rail running off the bottom
		// of the section into whatever follows.
		//   1. Never measure the knots. They sit inside sticky pins, so they
		//      travel with the scroll and report whichever bounds happened to
		//      be true at measure time.
		//   2. Never add pin.offsetTop to row.offsetTop. `position: sticky`
		//      makes the pin POSITIONED, so its offsetParent is .tl rather than
		//      the row, and the two offsets double-count.
		// The row's own rect is static, and the pin sits at the row's
		// padding-top because it is align-self: flex-start.
		const KNOT = 22
		const knotY = (row, tlTop) =>
			row.getBoundingClientRect().top - tlTop +
			parseFloat(getComputedStyle(row).paddingTop) + KNOT

		const measure = () => {
			if (!rows.length) return
			const tlTop = tl.getBoundingClientRect().top
			const top = knotY(rows[0], tlTop)
			const bottom = knotY(rows[rows.length - 1], tlTop)
			rail.style.top = top + "px"
			rail.style.height = Math.max(0, bottom - top) + "px"
		}

		const tick = () => {
			const box = rail.getBoundingClientRect()
			const mark = window.innerHeight * 0.34
			beam.style.height = Math.max(0, Math.min(box.height, mark - box.top)) + "px"
			let best = null, bestD = Infinity
			for (const row of rows) {
				const r = row.getBoundingClientRect()
				const d = Math.abs(Math.max(r.top, Math.min(mark, r.bottom)) - mark)
				if (d < bestD) { bestD = d; best = row }
			}
			for (const row of rows) row.classList.toggle("on", row === best && bestD < window.innerHeight * 0.7)
		}

		// Videos only fetch once they are near, so a visitor who never scrolls
		// past the hero pays for one file rather than six.
		const near = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue
				const video = e.target.querySelector("video")
				if (video && video.preload === "none") { video.preload = "auto"; video.load() }
				near.unobserve(e.target)
			}
		}, { rootMargin: "400px 0px" })
		rows.forEach((row) => near.observe(row))

		let queued = false
		const onScroll = () => {
			if (queued) return
			queued = true
			requestAnimationFrame(() => { queued = false; tick() })
		}
		window.addEventListener("scroll", onScroll, { passive: true })
		window.addEventListener("resize", () => { measure(); tick() })
		window.addEventListener("load", () => { measure(); tick() })
		measure(); tick()
	}

	/* ── the why line ──────────────────────────────────────────────────── */

	const line = document.getElementById("whyLine")
	if (line) {
		const words = [...line.querySelectorAll(".w")]
		if (REDUCED.matches) {
			words.forEach((w) => w.classList.add("lit"))
		} else {
			const litTick = () => {
				const box = line.getBoundingClientRect()
				const progress = (window.innerHeight * 0.74 - box.top) / (box.height * 0.68)
				const lit = Math.round(Math.max(0, Math.min(1, progress)) * words.length)
				words.forEach((w, i) => w.classList.toggle("lit", i < lit))
			}
			window.addEventListener("scroll", litTick, { passive: true })
			window.addEventListener("resize", litTick)
			litTick()
		}
	}

	/* ── the ring cloud ────────────────────────────────────────────────── */

	/*
	 * Coding agents and coding plans ONLY. Not editors (VS Code, JetBrains are
	 * where you'd run one, not the thing itself), not deprecated products,
	 * not general model vendors, not cloud hosts.
	 *
	 * Two marks were cut for being WRONG rather than irrelevant: xAI's favicon
	 * is the SpaceX X and is not Grok's mark, and Anthropic's corporate mark is
	 * not Claude's. Where the right logo cannot be sourced the entry is dropped
	 * rather than faked with a near-miss.
	 *
	 * `s` is a simple-icons monochrome path, recoloured with a CSS mask.
	 * `img` is a brand asset that carries its own colour. Codex has its own
	 * mark and it is NOT the OpenAI logo, so it ships as an asset rather than
	 * borrowing one. Anything without a real published mark is left out
	 * entirely rather than faked with a letter.
	 */
	/*
	 * Coding agents and coding plans, in one ring. Two concentric rings were
	 * tried and reverted: the copy has to sit inside the innermost ring, and an
	 * inner ring small enough to read as its own group leaves no room for a
	 * headline. The harness/plan distinction is carried by the card's two
	 * columns instead, where it can be stated rather than implied.
	 *
	 * Not editors (VS Code, JetBrains are where you'd run one, not the thing
	 * itself), not deprecated products, not general model vendors, not cloud
	 * hosts.
	 *
	 * Two marks were cut for being WRONG rather than irrelevant: xAI's favicon
	 * is the SpaceX X and is not Grok's mark, and Anthropic's corporate mark is
	 * not Claude's. Where the right logo cannot be sourced the entry is dropped
	 * rather than faked with a near-miss.
	 *
	 * `s` is a simple-icons monochrome path, recoloured with a CSS mask.
	 * `img` is a brand asset that carries its own colour. Codex has its own
	 * mark and it is NOT the OpenAI logo, so it ships as an asset rather than
	 * borrowing one. Anything without a real published mark is left out
	 * entirely rather than faked with a letter.
	 */
	const MARKS = [
		{ n: "Claude Code",    s: "claude",        c: "#D97757" },
		{ n: "Codex",          img: "codex.png" },
		{ n: "Cursor",         s: "cursor",        c: "#16233d" },
		{ n: "OpenCode",       img: "opencode.svg" },
		{ n: "GitHub Copilot", s: "githubcopilot", c: "#16233d" },
		{ n: "Antigravity",    img: "antigravity.png" },
		{ n: "Kimi Code",      img: "kimi.png" },
		{ n: "Z Code",         img: "zai.svg" },
		{ n: "Qwen Code",      s: "qwen",          c: "#615CED" },
		{ n: "Xiaomi MiMo",    s: "xiaomi",        c: "#FF6900" },
		{ n: "DeepSeek",       s: "deepseek",      c: "#4D6BFE" },
		{ n: "ChatGPT",        s: "openai",        c: "#412991" },
		{ n: "Gemini",         s: "googlegemini",  c: "#8E75B2" },
	]

	// OS marks on the platform buttons, masked so they take the ink colour.
	document.querySelectorAll(".dl-opt[data-os-mark]").forEach((btn) => {
		const inner = document.createElement("span")
		inner.className = "os-text"
		while (btn.firstChild) inner.appendChild(btn.firstChild)
		const mark = document.createElement("span")
		mark.className = "os"
		const url = `url("assets/logos/os-${btn.dataset.osMark}.svg")`
		mark.style.webkitMaskImage = url
		mark.style.maskImage = url
		btn.append(mark, inner)
	})

	const cloud = document.querySelector(".cloud")
	if (cloud) {
		const build = () => {
			cloud.querySelector(".rings")?.remove()

			// The radius has to be read off the CARD, not hard-coded. At 900px
			// the ring is wider than a phone, so every mark lands outside the
			// card's overflow:hidden and the section renders empty. The radius
			// has to come from BOTH card dimensions: the effect only works when
			// the ring is larger than the card's height (so the top and bottom
			// arcs crop away) and smaller than its width (so the side clusters
			// sit inside). Halfway between the two half-extents satisfies that
			// at every width; keying off width alone leaves tablet sizes with
			// five marks and a phone with none.
			const box = cloud.getBoundingClientRect()
			const w = box.width
			const r = Math.round(Math.min(360, Math.max(140, (w + box.height) / 4)))
			const tile = Math.round(Math.min(58, Math.max(44, w * 0.062)))
			const SIZE = r * 2 + tile + 40
			const centre = SIZE / 2

			// The copy has to fit inside the ring's left and right marks, and
			// the radius moves with the card, so the width is derived rather
			// than set in CSS. A fixed max-width is what put a mark behind the
			// paragraph at tablet sizes.
			const mid = cloud.querySelector(".cloud-mid")
			if (mid) mid.style.maxWidth = Math.max(260, Math.min(620, (r - tile / 2 - 26) * 2)) + "px"

			const host = document.createElement("div")
			host.className = "rings"
			host.style.width = host.style.height = SIZE + "px"

			const layer = document.createElement("div")
			layer.className = "ring a"
			MARKS.forEach((m, i) => {
				const angle = (i / MARKS.length) * Math.PI * 2
				const x = centre + Math.cos(angle) * r
				const y = centre + Math.sin(angle) * r

				const chip = document.createElement("div")
				chip.className = "chip"
				chip.title = m.n
				Object.assign(chip.style, {
					width: tile + "px", height: tile + "px",
					left: (x - tile / 2) + "px", top: (y - tile / 2) + "px",
					borderRadius: Math.round(tile * 0.28) + "px",
				})

				if (m.s) {
					const mark = document.createElement("span")
					mark.className = "mark"
					const url = `url("assets/logos/${m.s}.svg")`
					mark.style.webkitMaskImage = url
					mark.style.maskImage = url
					mark.style.background = m.c
					chip.appendChild(mark)
				} else {
					const img = document.createElement("img")
					img.className = "mark"
					img.src = "assets/logos/" + m.img
					img.alt = ""
					img.loading = "lazy"
					chip.appendChild(img)
				}
				layer.appendChild(chip)
			})
			host.appendChild(layer)
			cloud.prepend(host)
		}

		build()
		let t
		window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(build, 180) })
	}
})()
