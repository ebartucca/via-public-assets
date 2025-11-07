window.dataLayer = window.dataLayer || [];

// Wait for Framer's async DOM to fully load
function onReady(fn) {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(fn, 0);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

onReady(() => {
  // Retry until the button exists (Framer loads async)
  const MAX_ATTEMPTS = 40;
  let attempts = 0;

  function attachHandler() {
    const btn = document.getElementById("via-submit");
    const emailInput = document.getElementById("via-email");

    if (!btn || !emailInput) {
      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        return setTimeout(attachHandler, 150);
      }
      console.warn("via-waitlist: button not found after retries");
      return;
    }

    // ✅ Attach click handler once found
    btn.addEventListener("click", onWaitlistClick);

    console.log("via-waitlist: handler attached");
  }

  attachHandler();

  async function onWaitlistClick(e) {
    e.preventDefault();

    // Fire GTM event (no PII)
    window.dataLayer.push({
      event: "via_waitlist_click",
      cta_id: "via-submit",
      page_location: window.location.pathname
    });

    const btn = e.target;
    const input = document.getElementById("via-email");
    const email = (input?.value || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input?.focus();
      input?.setAttribute("aria-invalid", "true");
      return;
    }

    const original = btn.textContent;
    btn.textContent = "Submitting…";
    btn.style.pointerEvents = "none";

    submitToHubSpot(email, original, btn);
  }

  function submitToHubSpot(email, original, btn) {
    const hiddenForm = document.querySelector("#via-hs-hidden form");

    if (!hiddenForm) {
      // Fallback API path here if needed
      btn.textContent = original;
      btn.style.pointerEvents = "";
      alert("Form unavailable. Try again?");
      return;
    }

    const emailField = hiddenForm.querySelector('input[type="email"]');
    const submitBtn = hiddenForm.querySelector('input[type="submit"], button');

    if (!emailField || !submitBtn) {
      btn.textContent = original;
      btn.style.pointerEvents = "";
      alert("Form unavailable. Try again?");
      return;
    }

    emailField.value = email;
    emailField.dispatchEvent(new Event("input", { bubbles: true }));
    emailField.dispatchEvent(new Event("change", { bubbles: true }));

    submitBtn.click();

    window.dataLayer.push({
      event: "via_waitlist_submitted",
      page_location: window.location.pathname
    });
  }
});
