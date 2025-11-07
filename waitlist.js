<script>
/* Minimal click tracker for "Join our waitlist" */
window.dataLayer = window.dataLayer || [];

// Wait for Framer to mount the button, then attach once.
(function waitForBtn() {
  var btn = document.getElementById('via-submit');
  if (!btn) return setTimeout(waitForBtn, 150);  // Framer loads async

  if (!btn.__viaBound) {
    btn.__viaBound = true;
    btn.addEventListener('click', function () {
      // No PII — just metadata
      window.dataLayer.push({
        event: 'via_waitlist_click',
        cta_id: 'via-submit',
        page_location: window.location.pathname
      });
    });
  }
})();
</script>
