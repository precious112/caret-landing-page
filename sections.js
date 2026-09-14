/*
 * The three scroll-driven sections: the why line, the feature rail, the ring
 * cloud. No libraries — everything here is scroll position or CSS animation.
 */
(() => {
	"use strict"

	const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)")

	/* ── feature rail ──────────────────────────────────────────────────── */

	const FEATURES = [
		{
			n: "01", h: "Edit on the page", v: "f1-edit", w: "caret — index.tsx",
			p: "Right-click any text, colour or image and change it there. Caret writes it into the real source file and the page reloads.",
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
			// card's overflow:hidden and the section renders empty. Narrow
			// screens get a ring small enough that its top and bottom arcs sit
			// inside the card instead of its left and right ones.
			// The radius has to come from BOTH card dimensions. The effect only
			// works when the ring is larger than the card's height (so the top
			// and bottom arcs crop away) and smaller than its width (so the
			// side clusters sit inside). Halfway between the two half-extents
			// satisfies that at every width; keying off width alone leaves
			// tablet sizes with five marks and a phone with none.
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
			if (mid) mid.style.maxWidth = Math.max(260, Math.min(560, (r - tile / 2 - 26) * 2)) + "px"

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
