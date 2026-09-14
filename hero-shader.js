/* Hero background — a slow liquid field on warm paper.
 *
 * Large soft shapes, not fine noise: fine noise reads as grain and disappears
 * at this contrast range, which is what made the first pass invisible. Two
 * uniforms carry the layout so the same shader works split and stacked —
 * P is where the light pools (under the product window), and S is how hard
 * the left column is flattened so the headline sits on near-plain paper.
 *
 * Falls back to the CSS gradient on .hero if WebGL2 is unavailable, renders a
 * single frame under prefers-reduced-motion, and never runs while the hero is
 * off screen or the tab is hidden.
 */
(() => {
	"use strict"

	// The same field runs behind the hero and, faded right down, behind the
	// footer, so the page opens and closes on the same living ground.
	const canvases = [...document.querySelectorAll(".hero-shader, .footer-shader")]
	if (!canvases.length) return
	canvases.forEach(mount)

function mount(canvas) {
	const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" })
	if (!gl) return // the CSS gradient underneath stands in

	const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`

	const FRAG = `#version 300 es
precision highp float;
uniform vec2 R;    // pixel size
uniform float T;   // seconds
uniform vec2 P;    // where the light pools, in 0..1 of the hero
uniform float S;   // 1 = split layout (flatten the left), 0 = stacked
out vec4 O;

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
}
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i + vec2(0,0)), f - vec2(0,0)),
                 dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
                 dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * gnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / R;
  vec2 p  = uv * vec2(R.x / R.y, 1.0) * 1.15;
  float t = T * 0.030;

  vec2 q = vec2(fbm(p * 0.85 + vec2(0.0, t)), fbm(p * 0.85 + vec2(4.4, 1.3 - t)));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + 0.22 * t),
                fbm(p + 2.2 * q + vec2(8.3, 2.8) - 0.18 * t));
  float f = fbm(p * 1.1 + 2.6 * r);

  vec3 paper = vec3(0.961, 0.957, 0.937);
  vec3 sand  = vec3(0.859, 0.816, 0.733);
  vec3 blue  = vec3(0.043, 0.478, 1.000);   // #0b7aff, Caret's brand
  vec3 lilac = vec3(0.647, 0.733, 0.886);   // brand, washed toward paper

  vec3 col = mix(paper, sand, smoothstep(-0.34, 0.46, f) * 0.85);

  float wash = smoothstep(0.12, 0.72, length(r) + f * 0.45);
  col = mix(col, blue, wash * 0.38);
  col = mix(col, lilac, smoothstep(0.30, 0.95, r.y + 0.4) * 0.20);

  float ridge = smoothstep(0.35, 1.0, 1.0 - abs(length(r) - 0.36) * 2.6);
  col = mix(col, vec3(0.99, 0.99, 1.0), ridge * 0.55);
  col = mix(col, blue, ridge * ridge * 0.30);

  /* a pool of light where the product window sits, so it rests ON something */
  col = mix(col, vec3(1.0), (1.0 - smoothstep(0.10, 0.62, distance(uv, P))) * 0.30);

  /* flatten the headline column; no-op when the layout has stacked */
  float quiet = mix(1.0, 0.10 + 0.90 * smoothstep(0.02, 0.52, uv.x), S);
  col = mix(paper, col, quiet);

  /* settle into the page ground so the hero has no visible bottom edge */
  col = mix(col, paper, smoothstep(0.90, 1.0, 1.0 - uv.y));
  O = vec4(col, 1.0);
}`

	const compile = (type, src) => {
		const s = gl.createShader(type)
		gl.shaderSource(s, src)
		gl.compileShader(s)
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader")
		return s
	}

	let prog
	try {
		prog = gl.createProgram()
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
		gl.linkProgram(prog)
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link")
	} catch (err) {
		console.warn("[hero] shader unavailable, using the CSS ground:", err.message)
		return
	}
	gl.useProgram(prog)

	// One oversized triangle covers the viewport with no index buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
	const loc = gl.getAttribLocation(prog, "a")
	gl.enableVertexAttribArray(loc)
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

	const uR = gl.getUniformLocation(prog, "R")
	const uT = gl.getUniformLocation(prog, "T")
	const uP = gl.getUniformLocation(prog, "P")
	const uS = gl.getUniformLocation(prog, "S")

	const SPLIT = window.matchMedia("(min-width: 901px)")
	const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)")

	const resize = () => {
		// A fullscreen fragment shader at 3x is four times the work for no
		// visible gain on a soft gradient, so the ratio is capped.
		const dpr = Math.min(window.devicePixelRatio || 1, SPLIT.matches ? 1.5 : 1)
		const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
		const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w
			canvas.height = h
			gl.viewport(0, 0, w, h)
		}
	}

	const draw = (seconds) => {
		resize()
		gl.uniform2f(uR, canvas.width, canvas.height)
		gl.uniform1f(uT, seconds)
		const split = SPLIT.matches && canvas.classList.contains("hero-shader")
		if (split) {
			gl.uniform2f(uP, 0.7, 0.52)
			gl.uniform1f(uS, 1)
		} else {
			gl.uniform2f(uP, 0.5, 0.68)
			gl.uniform1f(uS, 0)
		}
		gl.drawArrays(gl.TRIANGLES, 0, 3)
	}

	canvas.classList.add("is-live")

	if (REDUCED.matches) {
		// A still field, picked at a moment where the currents read well.
		const once = () => draw(18)
		once()
		window.addEventListener("resize", once)
		return
	}

	let raf = 0
	let visible = true
	let onScreen = true
	let running = false
	const t0 = performance.now()

	const frame = (now) => {
		if (!running) return
		draw((now - t0) / 1000)
		raf = requestAnimationFrame(frame)
	}
	const sync = () => {
		const should = visible && onScreen
		if (should === running) return
		running = should
		if (running) raf = requestAnimationFrame(frame)
		else cancelAnimationFrame(raf)
	}

	document.addEventListener("visibilitychange", () => {
		visible = !document.hidden
		sync()
	})
	new IntersectionObserver(
		([entry]) => {
			onScreen = entry.isIntersecting
			sync()
		},
		{ threshold: 0 },
	).observe(canvas)
	window.addEventListener("resize", resize)
	sync()
}
})()
