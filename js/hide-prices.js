/**
 * SK Hybrid Battery — Hide prices for Google Ads visitors
 *
 * HOW IT WORKS:
 * 1. When a visitor arrives via Google Ads, the URL contains ?gclid=...
 * 2. We detect gclid and save a flag in sessionStorage (lasts until tab is closed)
 * 3. On every page load, if the flag exists we:
 *    - Replace all <td class="price"> cell contents with a WhatsApp CTA
 *    - Replace inline PKR amounts in visible text with "Call/WhatsApp for price"
 *    - "Prices" nav link stays visible (prices inside the page are replaced)
 *    - All injected WhatsApp links fire Google Ads conversion tracking on click
 *
 * IMPORTANT: Organic / direct visitors see everything normally.
 */

(function () {
  'use strict';

  var WA_LINK = 'https://wa.me/923082282777?text=Hi%20SK%20Hybrid%20Battery!%20I%20saw%20your%20ad%20and%20would%20like%20to%20know%20the%20price%20for%20my%20car.';
  var SESSION_KEY = 'sk_ads_visitor';

  // --- Step 1: Detect gclid and flag the session ---
  var params = new URLSearchParams(window.location.search);
  if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* private browsing */ }
  }

  // --- Step 2: Check if this is an ads visitor ---
  var isAdsVisitor = false;
  try { isAdsVisitor = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) {}

  if (!isAdsVisitor) return; // Organic visitor — do nothing

  // --- Step 3: Price page stays visible — prices will be replaced below ---

  // --- Step 4: Wait for DOM to be ready ---
  function hidePrices() {

    // 4a. Replace all <td class="price ..."> cells with WhatsApp CTA
    var priceCells = document.querySelectorAll('td.price');
    priceCells.forEach(function (td) {
      td.innerHTML = '<a href="' + WA_LINK + '" target="_blank" rel="noopener" class="sk-price-wa" style="color:#6cf2c2;text-decoration:underline;white-space:nowrap;">WhatsApp for Price</a>';
    });

    // 4b. Replace inline PKR amounts in paragraphs, list items, FAQ answers, and spans
    //     Pattern matches: PKR 80,000 / PKR 85,000 / PKR 2,000 / PKR 310,000 etc.
    var pricePat = /PKR\s?\d{1,3}(?:,\d{3})*/g;
    var walkTargets = document.querySelectorAll(
      '.faq-answer p, .faq-answer strong, ' +
      'section p, section li, section strong, ' +
      '.related-links span, ' +
      '.hero-subtitle, .hero p'
    );

    walkTargets.forEach(function (el) {
      // Skip if element is inside a <script> or <style> or is a link we already replaced
      if (el.closest('script') || el.closest('style') || el.closest('td.price')) return;
      // Only process leaf text nodes via innerHTML
      if (pricePat.test(el.innerHTML)) {
        el.innerHTML = el.innerHTML.replace(pricePat, '<a href="' + WA_LINK + '" target="_blank" rel="noopener" class="sk-price-wa" style="color:#6cf2c2;">Call / WhatsApp for Price</a>');
      }
    });

    // 4c. "Prices" nav link stays visible — prices inside are already replaced

    // 4d. Attach Google Ads conversion tracking to all injected WhatsApp price links
    //     These links were created AFTER the main [data-track] listener ran,
    //     so we add click listeners here directly.
    var injectedLinks = document.querySelectorAll('a.sk-price-wa');
    injectedLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (typeof trackAdConversion === 'function') {
          trackAdConversion('whatsapp-price-inquiry', 'WhatsApp for Price');
        }
      });
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hidePrices);
  } else {
    hidePrices();
  }
})();
