/* Caret landing — interactions */
(() => {
  "use strict";

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- direct download (no leaving the page) ---------- */
  // GitHub release assets are served with Content-Disposition: attachment,
  // so an anchor click downloads the file in place rather than navigating.
  function triggerDownload(url) {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  }

  /* ---------- star modal ---------- */
  const modal = document.getElementById("starModal");
  const openModal = () => { if (modal) modal.hidden = false; };
  const closeModal = () => { if (modal) modal.hidden = true; };
  document.getElementById("starClose")?.addEventListener("click", closeModal);
  document.getElementById("starLater")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function startDownload(url) {
    triggerDownload(url);
    // give the browser a beat to kick off the download, then nudge for a star
    setTimeout(openModal, 700);
  }

  /* OS download buttons */
  document.querySelectorAll(".dl-btn[data-url]").forEach((btn) => {
    btn.addEventListener("click", () => startDownload(btn.dataset.url));
  });

  /* "other formats" links — also download directly + nudge */
  document.querySelectorAll("a[data-direct]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      startDownload(a.getAttribute("href"));
    });
  });

  /* ---------- highlight the visitor's platform ---------- */
  const ua = navigator.userAgent || "";
  const plat = navigator.platform || "";
  const isWin = /win/i.test(ua) || /win/i.test(plat);
  const isMac = /mac/i.test(ua) || /mac/i.test(plat);
  const isLinux = /linux|x11/i.test(ua) && !/android/i.test(ua);

  const mark = (os) => document.querySelector(`.dl-btn[data-os="${os}"]`)?.classList.add("is-os");

  if (isWin) mark("win");
  else if (isLinux) mark("linux");
  else if (isMac) {
    // Try to tell Apple Silicon from Intel; otherwise highlight both.
    const uaData = navigator.userAgentData;
    if (uaData?.getHighEntropyValues) {
      uaData.getHighEntropyValues(["architecture"]).then((d) => {
        if (d && typeof d.architecture === "string") {
          if (/arm/i.test(d.architecture)) mark("mac-arm");
          else mark("mac-intel");
        } else { mark("mac-arm"); mark("mac-intel"); }
      }).catch(() => { mark("mac-arm"); mark("mac-intel"); });
    } else { mark("mac-arm"); mark("mac-intel"); }
  }
})();
