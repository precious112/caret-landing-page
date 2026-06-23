/* Caret landing — interactions */
(() => {
  "use strict";

  const REL = "https://github.com/precious112/caret-ide/releases/latest/download/";
  const URLS = {
    macArm: REL + "Caret-macOS-arm64.zip",
    macIntel: REL + "Caret-macOS-x64.zip",
    win: REL + "Caret-Windows-UserSetup-x64.exe",
    linux: REL + "Caret-Linux-x86_64.AppImage",
  };

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("is-visible"));

  /* ---------- typewriter on feature body paragraphs ---------- */
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const typed = Array.from(document.querySelectorAll("[data-type]"));

  function typeInto(p) {
    const full = p.dataset.fulltext || p.textContent;
    if (REDUCED) { p.textContent = full; return; }
    p.textContent = "";
    const textNode = document.createTextNode("");
    const caret = document.createElement("span");
    caret.className = "type-caret";
    caret.setAttribute("aria-hidden", "true");
    p.append(textNode, caret);
    const cps = 92, start = performance.now();
    (function frame(now) {
      const n = Math.min(full.length, Math.floor(((now - start) * cps) / 1000));
      textNode.data = full.slice(0, n);
      if (n < full.length) requestAnimationFrame(frame);
      else setTimeout(() => caret.remove(), 900);
    })(performance.now());
  }

  function initTyped() {
    if (!typed.length) return;
    typed.forEach((p) => {
      p.dataset.fulltext = p.textContent.trim();
      p.setAttribute("aria-label", p.dataset.fulltext); // keep full text for screen readers
      if (!REDUCED) { p.style.minHeight = p.offsetHeight + "px"; p.textContent = ""; } // reserve height, no reflow
    });
    if (REDUCED || !("IntersectionObserver" in window)) {
      typed.forEach((p) => (p.textContent = p.dataset.fulltext));
      return;
    }
    const tio = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        const p = e.target;
        setTimeout(() => typeInto(p), 240); // let the headline + window settle first
        tio.unobserve(p);
      }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.25 });
    typed.forEach((p) => tio.observe(p));
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(initTyped);
  else window.addEventListener("load", initTyped);

  /* ---------- direct download (no leaving the page) ---------- */
  function triggerDownload(url) {
    const a = document.createElement("a");
    a.href = url; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(() => a.remove(), 0);
  }

  /* ---------- star modal ---------- */
  const modal = document.getElementById("starModal");
  const close = () => { if (modal) modal.hidden = true; };
  document.getElementById("starClose")?.addEventListener("click", close);
  document.getElementById("starLater")?.addEventListener("click", close);
  modal?.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  function startDownload(url) {
    triggerDownload(url);
    setTimeout(() => { if (modal) modal.hidden = false; }, 700);
  }

  /* explicit OS buttons + "other formats" links */
  document.querySelectorAll("[data-url]").forEach((el) => {
    el.addEventListener("click", () => startDownload(el.dataset.url));
  });
  document.querySelectorAll("a[data-direct]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); startDownload(a.getAttribute("href")); });
  });

  /* ---------- detect platform → set primary CTA + highlight ---------- */
  async function detect() {
    const ua = navigator.userAgent || "";
    const isWin = /windows|win32|win64/i.test(ua);
    const isLinux = /linux|x11/i.test(ua) && !/android/i.test(ua);
    const isMac = /mac/i.test(ua) || (navigator.platform || "").toLowerCase().includes("mac");

    if (isWin) return { label: "Download for Windows", url: URLS.win, marks: ["Windows"] };
    if (isLinux) return { label: "Download for Linux", url: URLS.linux, marks: ["Linux"] };
    if (isMac) {
      let arch = "";
      try {
        const d = await navigator.userAgentData?.getHighEntropyValues?.(["architecture"]);
        arch = (d && d.architecture) || "";
      } catch (_) {}
      if (/arm/i.test(arch)) return { label: "Download for macOS (Apple Silicon)", url: URLS.macArm, marks: ["Apple Silicon"] };
      if (/x86|x64/i.test(arch)) return { label: "Download for macOS (Intel)", url: URLS.macIntel, marks: ["Intel"] };
      return { label: "Download for macOS", url: URLS.macArm, ambiguousMac: true, marks: ["Apple Silicon", "Intel"] };
    }
    return { label: "Download Caret", url: URLS.macArm, scrollOnly: true };
  }

  detect().then((t) => {
    // section primary button: direct download (mac defaults to Apple Silicon; Intel sits beside it)
    const primary = document.getElementById("dlPrimary");
    if (primary) {
      primary.textContent = t.label;
      primary.dataset.url = t.url;
    }
    // hero button: download for unambiguous OSes; for ambiguous mac (or unknown), send to the picker
    const hero = document.getElementById("heroDownload");
    if (hero) {
      hero.textContent = t.label;
      hero.addEventListener("click", (e) => {
        if (t.ambiguousMac || t.scrollOnly) return; // let the anchor scroll to #download
        e.preventDefault();
        startDownload(t.url);
      });
    }
    // highlight the matching platform option(s)
    (t.marks || []).forEach((m) => {
      document.querySelectorAll(".dl-opt span").forEach((s) => {
        if (s.textContent.trim().toLowerCase() === m.toLowerCase()) s.closest(".dl-opt")?.classList.add("is-os");
      });
    });
  });
})();
