/* waitlist.js — Framer/HubSpot safe, with API fallback + GTM events */
window.dataLayer = window.dataLayer || [];

// --- Utilities ---
function loadScriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    if (id) s.id = id;
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const check = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (performance.now() - start > timeout) return reject(new Error("timeout"));
      requestAnimationFrame(check);
    };
    check();
  });
}

// --- HubSpot config ---
const PORTAL_ID = "243471481";
const FORM_ID   = "4e444a4e-b0d0-43da-bebf-66b132e6f301";
const API_URL   = `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`;

// ensure hidden target exists
(function ensureHiddenTarget(){
  if (!document.getElementById("via-hs-hidden")) {
    const div = document.createElement("div");
    div.id = "via-hs-hidden";
    div.style.cssText = "position:absolute;left:-99999px;top:auto;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(div);
  }
})();

let hsReady = false;
let hsEmailInput, hsSubmitBtn;

// --- Boot HubSpot embed (non-blocking) ---
loadScriptOnce("https://js-na2.hsforms.net/forms/embed/v2.js", "hs-embed")
  .then(() => {
    if (!window.hbspt || !window.hbspt.forms) return;
    window.hbspt.forms.create({
      region: "na2",
      portalId: PORTAL_ID,
      formId: FORM_ID,
      target: "#via-hs-hidden",
      css: "",
      onFormReady(formEl) {
        const wire = () => {
          hsEmailInput = formEl.querySelector('input[type="email"], input[name="email"]');
          hsSubmitBtn  = formEl.querySelector('input[type="submit"], button.hs-button, .hs-button');
          return (hsEmailInput && hsSubmitBtn);
        };
        if (wire()) hsReady = true;
        else {
          const mo = new MutationObserver(() => { if (wire()) { hsReady = true; mo.disconnect(); }});
          mo.observe(formEl, { childList: true, subtree: true });
        }
      },
      onFormSubmitted() { reportSuccess(); }
    });
  })
  .catch(() => { /* if embed fails we’ll use API fallback */ });

// --- Attach click handler once Framer mounts the UI ---
(async function init() {
  try {
    const btn = await waitForElement("#via-submit", 15000);
    const emailInput = await waitForElement("#via-email", 15000);
    console.log("via-waitlist: handler attached");

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      // GTM/GA4 click event (no PII)
      window.dataLayer.push({
        event: "via_waitlist_click",
        cta_id: "via-submit",
        page_location: window.location.pathname
      });

      const email = (emailInput.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.focus();
        emailInput.setAttribute("aria-invalid", "true");
        return;
      }

      const original = btn.textContent;
      requestAnimationFrame(() => {
        btn.textContent = "Submitting…";
        btn.style.pointerEvents = "none";
      });

      // 1) Preferred: submit through hidden HubSpot form if ready
      try {
        if (hsReady && hsEmailInput && hsSubmitBtn) {
          hsEmailInput.value = email;
          hsEmailInput.dispatchEvent(new Event("input", { bubbles: true }));
          hsEmailInput.dispatchEvent(new Event("change", { bubbles: true }));
          hsSubmitBtn.click();
          return; // onFormSubmitted -> reportSuccess()
        }
      } catch (_) {}

      // 2) Fallback: HubSpot Submissions API (handles your 403 embed case)
      try {
        const payload = {
          fields: [{ name: "email", value: email }],
          context: { pageUri: window.location.href, pageName: document.title }
        };
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("HubSpot API error");
        reportSuccess();
      } catch (err) {
        console.error("via-waitlist: submission failed", err);
        btn.textContent = original;
        btn.style.pointerEvents = "";
        alert("Sorry—couldn’t submit just now. Please try again.");
      }
    });
  } catch {
    console.warn("via-waitlist: UI not found");
  }
})();

function reportSuccess() {
  // GA4 conversion-safe event (no PII)
  window.dataLayer.push({
    event: "via_waitlist_submitted",
    form_provider: "hubspot",
    page_location: window.location.pathname
  });
  const row = document.getElementById("via-waitlist-custom");
  if (row) row.outerHTML = '<div class="via-success">Thanks! You’re on the list 🎉</div>';
}
