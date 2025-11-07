window.dataLayer = window.dataLayer || [];

// Wait for Framer to finish mounting components
function waitForElement(selector, callback, timeout = 10000) {
  const start = performance.now();

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    } else if (performance.now() - start > timeout) {
      observer.disconnect();
      console.warn("via-waitlist: timed out waiting for", selector);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // In case it’s already in DOM
  const existing = document.querySelector(selector);
  if (existing) {
    observer.disconnect();
    callback(existing);
  }
}

// HUBSPOT + WAITLIST LOGIC
function initWaitlist(btn) {
  const emailInput = document.getElementById("via-email");

  if (!emailInput) {
    console.warn("via-waitlist: email input not found");
    return;
  }

  console.log("via-waitlist: handler attached");

  btn.addEventListener("click", function (e) {
    e.preventDefault();

    // Fire GTM click event
    window.dataLayer.push({
      event: "via_waitlist_click",
      cta_id: "via-submit",
      page_location: window.location.pathname
    });

    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.focus();
      emailInput.setAttribute("aria-invalid", "true");
      return;
    }

    const original = btn.textContent;
    btn.textContent = "Submitting…";
    btn.style.pointerEvents = "none";

    // Submit using the hidden HubSpot form
    const hiddenForm = document.querySelector("#via-hs-hidden form");
    const emailField = hiddenForm?.querySelector('input[type="email"]');
    const submitBtn = hiddenForm?.querySelector('input[type="submit"], button');

    if (hiddenForm && emailField && submitBtn) {
      emailField.value = email;
      emailField.dispatchEvent(new Event("input", { bubbles: true }));
      emailField.dispatchEvent(new Event("change", { bubbles: true }));
      submitBtn.click();

      window.dataLayer.push({
        event: "via_waitlist_submitted",
        page_location: window.location.pathname
      });
    } else {
      console.error("via-waitlist: hidden HubSpot form not ready");
      btn.textContent = original;
      btn.style.pointerEvents = "";
    }
  });
}

// ✅ Start watching for the button
waitForElement("#via-submit", initWaitlist);
