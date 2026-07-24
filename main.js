/* =========================================================================
   Laila Milan — Stylist
   Renders the page from the SITE config (in index.html) + the generated
   image manifest (images/manifest.js), and runs the lightbox.
   No libraries. You should not need to edit this to change content.
   ========================================================================= */
(function () {
  'use strict';

  var MANIFEST = (window.__MANIFEST__ && window.__MANIFEST__.images) || {};
  var SITE = window.SITE || { copy: {}, sections: [] };
  var OPT = 'images/optimized/';

  // Flat list of every rendered image, in DOM order — drives the lightbox.
  var gallery = [];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Section title — rendered as a quiet external link when the section has a url.
  function buildTitle(section) {
    var h3 = el('h3', 'shoot__name');
    if (section.url) {
      var a = el('a', 'shoot__link', section.title);
      a.href = section.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      h3.appendChild(a);
    } else {
      h3.textContent = section.title;
    }
    return h3;
  }

  // Build a responsive <figure> for one image entry.
  function buildTile(entry, sizes, opts) {
    opts = opts || {};
    var meta = MANIFEST[entry.src];
    var fig = el('figure', 'tile');
    if (!meta) {
      // Image referenced in config but not optimized — skip gracefully.
      console.warn('No manifest entry for "' + entry.src + '" — run: npm run optimize');
      return null;
    }

    var widths = meta.widths;
    var maxW = widths[widths.length - 1];

    var webpSet = widths.map(function (w) { return OPT + entry.src + '-' + w + '.webp ' + w + 'w'; }).join(', ');
    var jpgSet = widths.map(function (w) { return OPT + entry.src + '-' + w + '.jpg ' + w + 'w'; }).join(', ');

    var btn = el('button', 'media-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'View larger: ' + entry.alt);

    var media = el('span', 'media');
    media.style.aspectRatio = meta.width + ' / ' + meta.height;
    if (meta.lqip) media.style.backgroundImage = 'url(' + meta.lqip + ')';

    var picture = document.createElement('picture');
    var source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = webpSet;
    source.sizes = sizes;

    var img = document.createElement('img');
    img.src = OPT + entry.src + '-' + maxW + '.jpg';
    img.srcset = jpgSet;
    img.sizes = sizes;
    img.width = meta.width;
    img.height = meta.height;
    img.alt = entry.alt;
    img.decoding = 'async';
    if (opts.eager) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    } else {
      img.loading = 'lazy';
    }
    function markLoaded() { img.classList.add('is-loaded'); }
    if (img.complete) markLoaded();
    img.addEventListener('load', markLoaded);

    picture.appendChild(source);
    picture.appendChild(img);
    media.appendChild(picture);
    btn.appendChild(media);
    fig.appendChild(btn);

    // Register in the lightbox list.
    var index = gallery.length;
    gallery.push({
      src: OPT + entry.src + '-' + maxW + '.jpg',
      webp: OPT + entry.src + '-' + maxW + '.webp',
      alt: entry.alt,
      caption: entry.caption || '',
      credit: (entry.credit != null ? entry.credit : (opts.credit || ''))
    });
    btn.setAttribute('data-index', index);
    btn.addEventListener('click', function () { openLightbox(index); });

    return fig;
  }

  function renderSections() {
    var main = document.getElementById('work');
    var onsetHost = document.getElementById('onset-media');

    SITE.sections.forEach(function (section) {
      if (section.kind === 'onset') {
        renderOnSet(section, onsetHost);
      } else {
        renderShoot(section, main);
      }
    });
  }

  function renderOnSet(section, host) {
    // Optional role line in the section header (e.g. "Stylist PA").
    if (section.role && section.role.indexOf('[✎') !== 0) {
      var head = host.parentElement && host.parentElement.querySelector('.section__head');
      if (head) head.appendChild(el('p', 'shoot__role', section.role));
    }
    var imgs = section.images;
    // Lead image spans full width and loads eagerly (it's the LCP candidate).
    if (imgs.length) {
      var lead = buildTile(imgs[0], '100vw', { eager: true, credit: section.credit });
      if (lead) { lead.classList.add('onset-lead'); host.appendChild(lead); }
    }
    if (imgs.length > 1) {
      var grid = el('div', 'onset-grid');
      for (var i = 1; i < imgs.length; i++) {
        var t = buildTile(imgs[i], '(min-width:700px) 50vw, 100vw', { credit: section.credit });
        if (t) grid.appendChild(t);
      }
      host.appendChild(grid);
    }
  }

  function renderShoot(section, host) {
    var wrap = el('section', 'shoot');
    wrap.id = section.id;

    var titleRow = el('div', 'shoot__label');
    titleRow.appendChild(buildTitle(section));
    wrap.appendChild(titleRow);

    // A visible label beneath the title (e.g. "Converse — spec"), then the
    // credit, then an optional quieter role line. Unreplaced placeholders
    // ([✎ …]) are hidden.
    var hasLabel = section.label && section.label.indexOf('[✎') !== 0;
    var hasCredit = section.credit && section.credit.indexOf('[✎') !== 0;
    var hasRole = section.role && section.role.indexOf('[✎') !== 0;
    if (hasLabel || hasCredit || hasRole) {
      var meta = el('div', 'shoot__meta');
      if (hasLabel) meta.appendChild(el('p', 'shoot__tag', section.label));
      if (hasCredit) meta.appendChild(el('p', 'shoot__credit', section.credit));
      if (hasRole) meta.appendChild(el('p', 'shoot__role', section.role));
      wrap.appendChild(meta);
    }

    var grid = el('div', 'grid');
    section.images.forEach(function (entry) {
      var t = buildTile(entry, '(min-width:960px) 33vw, (min-width:620px) 50vw, 50vw', { credit: section.credit });
      if (t) grid.appendChild(t);
    });
    wrap.appendChild(grid);
    host.appendChild(wrap);
  }

  /* ---- Copy binding ------------------------------------------------------ */
  function bindCopy() {
    var c = SITE.copy || {};
    setText('[data-copy="statement"]', c.statement);
    setText('[data-copy="heroSub"]', c.heroSub);
    setText('[data-copy="onsetNote"]', c.onsetNote);
    setText('[data-copy="bio"]', c.bio);
    setText('[data-copy="creditsTitle"]', c.creditsTitle);
    setText('[data-copy="credits"]', c.credits);
    setText('[data-copy="contactTitle"]', c.contactTitle);
    setHTML('[data-copy="footName"]', c.name);

    // About Me — one <p> per paragraph
    var aboutHost = document.querySelector('[data-copy="about"]');
    if (aboutHost && Array.isArray(c.aboutParagraphs)) {
      c.aboutParagraphs.forEach(function (t) { aboutHost.appendChild(el('p', null, t)); });
    }

    // Capabilities list
    var capHost = document.querySelector('[data-copy="capabilities"]');
    if (capHost && Array.isArray(c.capabilities)) {
      c.capabilities.forEach(function (cap) { capHost.appendChild(el('li', null, cap)); });
    }

    // Contact links
    var email = c.email || '';
    var ig = c.instagram || '';
    var emailA = document.querySelector('[data-copy="email"]');
    if (emailA) { emailA.textContent = email; emailA.href = 'mailto:' + email; }

    var phone = c.phone || '';
    var phoneA = document.querySelector('[data-copy="phone"]');
    if (phoneA) {
      if (phone) { phoneA.textContent = phone; phoneA.href = 'tel:' + phone.replace(/[^0-9+]/g, ''); }
      else { phoneA.remove(); }
    }
    var igA = document.querySelector('[data-copy="instagram"]');
    if (igA) {
      igA.textContent = ig;
      var handle = ig.replace(/^@/, '');
      igA.href = c.instagramUrl || ('https://instagram.com/' + handle);
    }

    document.querySelectorAll('[data-copy="name"]').forEach(function (n) { n.textContent = c.name || ''; });
    document.querySelectorAll('[data-copy="role"]').forEach(function (n) { n.textContent = c.role || ''; });
    var yr = document.querySelector('[data-copy="year"]');
    if (yr) yr.textContent = new Date().getFullYear();
  }
  function setText(sel, v) { var n = document.querySelector(sel); if (n && v != null) n.textContent = v; }
  function setHTML(sel, v) { var n = document.querySelector(sel); if (n && v != null) n.textContent = v; }

  /* ---- Lightbox ---------------------------------------------------------- */
  var lb, lbImg, lbCap, current = -1, lastFocus = null;

  function openLightbox(index) {
    current = index;
    lastFocus = document.activeElement;
    updateLightbox();
    lb.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    document.querySelector('.lb-close').focus();
  }
  function closeLightbox() {
    lb.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(dir) {
    if (!gallery.length) return;
    current = (current + dir + gallery.length) % gallery.length;
    updateLightbox();
  }
  function updateLightbox() {
    var item = gallery[current];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    var parts = [];
    if (item.caption && item.caption.indexOf('[✎') !== 0) {
      // A caption is the full, self-contained line — don't also append the section credit.
      parts.push('<b>' + escapeHTML(item.caption) + '</b>');
    } else if (item.credit && item.credit.indexOf('[✎') !== 0) {
      parts.push(escapeHTML(item.credit));
    }
    lbCap.innerHTML = parts.join(' — ');
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m];
    });
  }

  function initLightbox() {
    lb = document.getElementById('lightbox');
    lbImg = lb.querySelector('.lightbox__img');
    lbCap = lb.querySelector('.lightbox__cap');

    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });

    // Click on backdrop (not the image) closes.
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.getAttribute('data-open') !== 'true') return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });

    // Swipe on touch devices.
    var startX = 0, startY = 0, tracking = false;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tracking = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!tracking) return; tracking = false;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
    }, { passive: true });
  }

  /* ---- Boot -------------------------------------------------------------- */
  function init() {
    bindCopy();
    renderSections();
    initLightbox();
    var nojs = document.querySelector('.nojs');
    if (nojs) nojs.remove();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
