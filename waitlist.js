<script>
window.dataLayer = window.dataLayer || [];

(function () {
  const PORTAL_ID = "243471481";
  const FORM_ID   = "4e444a4e-b0d0-43da-bebf-66b132e6f301";
  const API_URL   = `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`;

  let hsEmailInput = null;
  let hsSubmitBtn  = null;
  let hsReady = false;

  // Wait for HubSpot to be available
  function initForm() {
    if (typeof hbspt === "undefined" || !document.getElementById("via-hs-hidden")) {
      requestAnimationFrame(initForm);
      return;
    }

    hbspt.forms.create({
      region: "na2",
      portalId: PORTAL_ID,
      formId: FORM_ID,
      target: "#via-hs-hidden",
      css: "",
      onFormReady: function(formEl) {
        function tryWire() {
          hsEmailInput = formEl.querySelector('input[type="email"], input[name="email"]');
          hsSubmitBtn  = formEl.querySelector('input[type="submit"], button.hs-button, .hs-button');
          return (hsEmailInput && hsSubmitBtn);
        }
        if (tryWire()) hsReady = true;
        else {
          const mo = new MutationObserver(() => {
            if (tryWire()) { mo.disconnect(); hsReady = true; }
          });
          mo.observe(formEl, { childList: true, subtree: true });
        }
      },
      onFormSubmitted: function() {
        reportSuccess();
      }
    });
  }

  initForm();

  // Visible button click handler
  document.addEventListener('click', async function(e){
    if (!e.target || e.target.id !== 'via-submit') return;

    // Fire GTM event
    window.dataLayer.push({
      event: 'via_waitlist_click',
      cta_id: 'via-submit',
      page_location: window.location.pathname
    });

    e.preventDefault();

    const btn   = e.target;
    const input = document.getElementById('via-email');
    const email = (input?.value || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input?.focus();
      input?.setAttribute('aria-invalid', 'true');
      return;
    }

    const original = btn.textContent;

    requestAnimationFrame(() => {
      btn.textContent = 'Submitting…';
      btn.style.pointerEvents = 'none';
    });

    // HubSpot native submit (preferred)
    try {
      if (hsReady && hsEmailInput && hsSubmitBtn) {
        hsEmailInput.value = email;
        hsEmailInput.dispatchEvent(new Event('input',  { bubbles: true }));
        hsEmailInput.dispatchEvent(new Event('change', { bubbles: true }));
        hsSubmitBtn.click();
        return;
      }
    } catch (_) {}

    // Fallback: HubSpot API submission
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
      if (res.ok) reportSuccess();
      else throw new Error("HubSpot API error");
    } catch (err) {
      console.error(err);
      btn.textContent = original;
      btn.style.pointerEvents = '';
      alert("Sorry—couldn’t submit just now. Please try again.");
    }
  });

  function reportSuccess() {
    window.dataLayer.push({
      event: 'via_waitlist_submitted',
      form_provider: 'hubspot',
      page_location: window.location.pathname
    });

    const row = document.getElementById('via-waitlist-custom');
    if (row) row.outerHTML = '<div class="via-success">Thanks! You’re on the list 🎉</div>';
  }
})();
</script>
