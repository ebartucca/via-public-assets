// waitlist.js (Phase 1: click tracking only)
window.dataLayer = window.dataLayer || [];
(function attach(){
  var btn = document.getElementById('via-submit');
  if(!btn){ return setTimeout(attach,150); } // Framer mounts late
  if(btn.__viaBound) return;
  btn.__viaBound = true;
  console.log('via-waitlist.js loaded; handler attached');

  btn.addEventListener('click', function(){
    window.dataLayer.push({
      event: 'join_waitlist_click',
      cta_id: 'via-submit',
      page_location: location.pathname
    });
    console.log('[DL push] join_waitlist_click');
  });
})();
