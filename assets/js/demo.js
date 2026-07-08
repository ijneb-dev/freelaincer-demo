(function () {
  'use strict';

  var defaults = {
    craft: 'Video / editor / filmmaker',
    entry: 'welcome',
    name: 'Benny Ferraro',
    skin: 'frAIme',
    studio: 'MoltoBennyMedia',
    view: 'brief'
  };

  var demoState = {
    captured: false,
    invoice: false,
    reminder: false
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function html(value) {
    return text(value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function safe(value, fallback) {
    var clean = text(value).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, 120);
    return clean || fallback;
  }

  function packageRoot() {
    if (window.location.pathname.indexOf('/demo/') !== -1) {
      return new URL('../', window.location.href).href;
    }
    return new URL('./', window.location.href).href;
  }

  function trustedRoots() {
    return [
      packageRoot(),
      'https://ijneb-dev.github.io/freelaincer-demo/'
    ];
  }

  function sameOriginOrTrusted(url) {
    if (!/^https?:$/.test(url.protocol)) return false;
    if (url.origin !== window.location.origin && url.protocol !== 'https:') return false;
    return trustedRoots().some(function (root) {
      return url.href === root.replace(/\/$/, '') || url.href.indexOf(root) === 0;
    });
  }

  function normalizeRootUrl(raw) {
    var parsed = new URL(raw || packageRoot(), window.location.href);
    parsed.search = '';
    parsed.hash = '';
    if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
    return parsed;
  }

  function safeUrl(raw, fallback) {
    try {
      var parsed = new URL(raw, window.location.href);
      return sameOriginOrTrusted(parsed) ? parsed.href : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeRoot(raw) {
    try {
      var parsed = normalizeRootUrl(raw);
      if (sameOriginOrTrusted(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Fall through to the current static package root.
    }
    return new URL(packageRoot());
  }

  function parseHash() {
    var params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return {
      craft: safe(params.get('craft'), defaults.craft),
      entry: safe(params.get('entry'), defaults.entry),
      name: safe(params.get('n') || params.get('name'), defaults.name),
      skin: safe(params.get('skin'), defaults.skin),
      studio: safe(params.get('s') || params.get('studio'), defaults.studio),
      view: safe(params.get('view'), defaults.view)
    };
  }

  function hashFor(profile, nextView) {
    var params = new URLSearchParams();
    params.set('n', profile.name);
    params.set('s', profile.studio);
    params.set('craft', profile.craft);
    params.set('skin', profile.skin);
    params.set('entry', profile.entry || defaults.entry);
    if (nextView) params.set('view', nextView);
    return '#' + params.toString();
  }

  function profile() {
    return parseHash();
  }

  function setProfileText(current) {
    $all('[data-profile]').forEach(function (node) {
      var key = node.getAttribute('data-profile');
      node.textContent = current[key] || defaults[key] || '';
    });
  }

  function copyLink(value, statusNode) {
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        if (statusNode) statusNode.textContent = 'Copied.';
      }).catch(function () {
        if (statusNode) statusNode.textContent = value;
      });
      return;
    }
    if (statusNode) statusNode.textContent = value;
  }

  function demoUrl(current, view) {
    return new URL('./demo/' + hashFor(current, view || current.view), window.location.href).href;
  }

  function welcomeUrl(current) {
    return new URL('./welcome.html' + hashFor(current), window.location.href).href;
  }

  function qrUrlFor(url) {
    return new URL('./qr.html?u=' + encodeURIComponent(url), window.location.href).href;
  }

  function initShared() {
    var current = profile();
    setProfileText(current);
    $all('[data-demo-link]').forEach(function (node) {
      var target = node.getAttribute('data-demo-link');
      node.href = target === 'demo' ? demoUrl(current) : welcomeUrl(current);
    });
  }

  function initWelcome() {
    var current = profile();
    var launch = demoUrl(current);
    var qr = qrUrlFor(launch);
    ['welcomeLaunch', 'welcomeLaunchNav'].forEach(function (id) {
      var node = $('#' + id);
      if (node) node.href = launch;
    });
    ['welcomeShare', 'welcomeQrLink'].forEach(function (id) {
      var node = $('#' + id);
      if (node) node.href = qr;
    });
  }

  function updateGeneratedLinks() {
    var base = $('#linkBase');
    var current = {
      craft: safe($('#linkCraft').value, defaults.craft),
      entry: safe($('#linkEntry').value, defaults.entry),
      name: safe($('#linkName').value, defaults.name),
      skin: safe($('#linkSkin').value, defaults.skin),
      studio: safe($('#linkStudio').value, defaults.studio),
      view: defaults.view
    };
    var root = safeRoot(base.value);
    var path = current.entry === 'demo' ? './demo/' : './welcome.html';
    var url = new URL(path + hashFor(current), root).href;
    var qr = new URL('./qr.html?u=' + encodeURIComponent(url), root).href;
    var output = $('#generatedLink');
    output.textContent = url;
    output.href = url;
    $('#openGenerated').href = url;
    $('#openQr').href = qr;
  }

  function initLinks() {
    var form = $('#linkForm');
    var base = $('#linkBase');
    base.value = new URL('./', window.location.href).href;
    updateGeneratedLinks();
    form.addEventListener('input', updateGeneratedLinks);
    $('#copyGenerated').addEventListener('click', function () {
      copyLink($('#generatedLink').href, $('#copyStatus'));
    });
  }

  function initQr() {
    var params = new URLSearchParams(window.location.search);
    var fallbackUrl = welcomeUrl(profile());
    var url = safeUrl(params.get('u') || fallbackUrl, fallbackUrl);

    var link = $('#qrDemoLink');
    link.href = url;
    link.textContent = url;
    $('#qrCopy').addEventListener('click', function () {
      copyLink(url, $('#qrStatus'));
    });
    $('#qrSms').href = 'sms:?&body=' + encodeURIComponent('Open the freelAInswer demo: ' + url);
    $('#qrEmail').href = 'mailto:?subject=' + encodeURIComponent('freelAInswer demo link') + '&body=' + encodeURIComponent(url);

    var qrTarget = $('#qrCode');
    if (window.qrcode && qrTarget) {
      var qr = window.qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      qrTarget.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 3 });
      return;
    }
    qrTarget.textContent = 'QR renderer unavailable. Use the link below.';
  }

  function money(value) {
    return 'AUD $' + value.toLocaleString('en-AU');
  }

  function demoRows(rows) {
    return '<div class="demo-list">' + rows.map(function (row) {
      return '<div class="demo-row"><span>' + html(row[0]) + '</span><strong>' + html(row[1]) + '</strong></div>';
    }).join('') + '</div>';
  }

  function briefView(current) {
    return '<div class="demo-grid">' +
      '<article class="demo-card"><p class="kicker">Morning brief</p><h2>' + html(current.studio) + ' has work ready to bill.</h2>' +
      '<p class="lede">Use the built-in examples or sample text. No real client data is needed for this walkthrough.</p>' +
      demoRows([
        ['Sample week captured', '14.5h'],
        ['Draft value', money(2175)],
        ['Invoice status', demoState.invoice ? 'drafted' : 'ready'],
        ['Chase', demoState.reminder ? 'queued' : 'not queued']
      ]) + '</article>' +
      '<aside class="demo-card"><p class="kicker">brAIn note</p><p class="brain-note">Morning. The Northcote music video has 4 hours colour and 6 hours render. Missing time?</p>' +
      '<button class="button button-primary" data-action="view" data-next="capture" type="button">Capture sample week</button></aside>' +
      '</div>';
  }

  function captureView() {
    return '<div class="demo-grid">' +
      '<article class="demo-card"><p class="kicker">Capture</p><h2>Paste a sample week. Confirm clean time.</h2>' +
      '<p class="lede">Paste sample calendar text, sample receipt notes, or example email copy.</p>' +
      demoRows([
        ['Cafe B-roll and stills', '3.0h'],
        ['Wedding highlights fine cut', '5.0h'],
        ['Hero video colour grade', '4.0h'],
        ['Receipt notes matched', '2.5h']
      ]) + '</article>' +
      '<aside class="demo-card"><p class="kicker">Action</p><p class="brain-note">' + (demoState.captured ? '14.5 hours confirmed across 4 sample records.' : 'The proposal is ready. Confirm it to unlock invoice context.') + '</p>' +
      '<button class="button button-primary" data-action="capture" type="button">Confirm sample time</button></aside>' +
      '</div>';
  }

  function invoiceView() {
    return '<div class="demo-grid">' +
      '<article class="demo-card"><p class="kicker">Invoice</p><h2>Draft the money bit before the dread arrives.</h2>' +
      demoRows([
        ['Tracked time', '14.5h'],
        ['Rate', 'AUD $150/h'],
        ['Subtotal', money(2175)],
        ['GST estimate', money(218)]
      ]) + '</article>' +
      '<aside class="demo-card"><p class="kicker">Chase copy</p><p class="brain-note">Hi Benny, invoice INV-003 is drafted from the sample week. Want the polite nudge queued for day 3?</p>' +
      '<button class="button button-primary" data-action="invoice" type="button">Draft invoice</button> ' +
      '<button class="button" data-action="reminder" type="button">Queue reminder</button></aside>' +
      '</div>';
  }

  function mirrorView(current) {
    return '<div class="demo-grid">' +
      '<article class="demo-card"><p class="kicker">Mirror</p><h2>Find the gigs that pay, and the ones that pretend.</h2>' +
      demoRows([
        ['Love', '6.5h'],
        ['Good at', '12.0h'],
        ['World needs', '5.0h'],
        ['Paid for', '14.5h']
      ]) + '</article>' +
      '<aside class="demo-card"><p class="kicker">' + html(current.skin) + '</p><p class="brain-note">Same tools. Your words up front. One workspace underneath.</p>' +
      '<a class="button button-primary" href="../">Back to demo home</a></aside>' +
      '</div>';
  }

  function renderDemo(nextView) {
    var current = profile();
    var view = nextView || current.view || defaults.view;
    var views = {
      brief: briefView,
      capture: captureView,
      invoice: invoiceView,
      mirror: mirrorView
    };
    var renderer = views[view] || views.brief;
    $('#demoView').innerHTML = renderer(current);
    $all('.demo-tab').forEach(function (tab) {
      var active = tab.getAttribute('data-view') === view;
      tab.setAttribute('aria-current', active ? 'page' : 'false');
    });
    setProfileText(current);
    $all('[data-action]').forEach(function (node) {
      node.addEventListener('click', function () {
        var action = node.getAttribute('data-action');
        if (action === 'capture') demoState.captured = true;
        if (action === 'invoice') demoState.invoice = true;
        if (action === 'reminder') demoState.reminder = true;
        if (action === 'view') view = node.getAttribute('data-next') || 'brief';
        if (action !== 'view') view = action === 'capture' ? 'invoice' : 'mirror';
        var updated = profile();
        history.replaceState(null, '', hashFor(updated, view));
        renderDemo(view);
      });
    });
  }

  function initDemo() {
    $all('.demo-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var next = tab.getAttribute('data-view') || 'brief';
        history.replaceState(null, '', hashFor(profile(), next));
        renderDemo(next);
      });
    });
    renderDemo();
  }

  initShared();

  var page = document.body.getAttribute('data-page');
  if (page === 'welcome') initWelcome();
  if (page === 'links') initLinks();
  if (page === 'qr') initQr();
  if (page === 'demo') initDemo();
}());
