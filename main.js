/* Caret landing — interactions */
(() => {
  "use strict";

  /* Builds live in caret-desktop; the source repo is caret. Every name here is
     checked against the release assets — a renamed artifact is a silent 404 on
     the one button that matters. */
  const REL = "https://github.com/precious112/caret-desktop/releases/latest/download/";
  const URLS = {
    macArm: REL + "Caret-macOS-arm64.zip",
    macIntel: REL + "Caret-macOS-x64.zip",
    win: REL + "Caret-Windows-Setup-x64.exe",
    linux: REL + "Caret-Linux-x86_64.AppImage",
  };

  /* ---------- nav: transparent on the hero shader, frosted once scrolled ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const stick = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
    stick();
    window.addEventListener("scroll", stick, { passive: true });
  }

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
      if (/arm/i.test(arch)) return { label: "Download for macOS (Apple Silicon)", short: "Download for macOS", url: URLS.macArm, marks: ["Apple Silicon"] };
      if (/x86|x64/i.test(arch)) return { label: "Download for macOS (Intel)", short: "Download for macOS", url: URLS.macIntel, marks: ["Intel"] };
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
      hero.textContent = t.short || t.label;
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
