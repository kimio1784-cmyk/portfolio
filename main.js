// F案の演出
// 外部ライブラリは使わず、requestAnimationFrame（画面の書き換えごとに呼ばれる仕組み）で動かす。
// 値を目標に少しずつ近づける「lerp」で、遅れて追いつく滑らかさを出している。
(function () {
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  var wideQuery = window.matchMedia('(min-width: 1024px)');

  function isReduced() { return reduceQuery.matches; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  /* ---------- フェードイン ----------
     data-reveal を付けたまとまりが画面に入ったら、中の見出しの行（.line）と
     要素（.rv）に順番（--i）を付けて、時間差で表示する */
  var groups = document.querySelectorAll('[data-reveal]');

  groups.forEach(function (group) {
    group.querySelectorAll('.line, .rv').forEach(function (el, i) {
      el.style.setProperty('--i', Math.min(i, 5)); // 待ち時間が長くなりすぎないよう上限を設ける（最大0.4秒）
    });
  });

  if (isReduced()) {
    groups.forEach(function (g) { g.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target); // 一度表示したら、その後は動かさない
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 }); // 画面に入り始めたらすぐ表示を始め、空白の時間を短くする
    groups.forEach(function (g) { revealObserver.observe(g); });
  }

  /* ---------- 背景文字「WRITER」 ---------- */
  var heroText = document.querySelector('.hero-bg-text');
  var heroX = 0;

  function updateHero() {
    if (isReduced()) { heroText.style.transform = ''; return; }
    if (window.scrollY > window.innerHeight * 1.5 && Math.abs(heroX) > 1) return; // 画面外では計算を省く
    heroX = lerp(heroX, -window.scrollY * 0.5, 0.1);
    heroText.style.transform = 'translate3d(' + heroX.toFixed(1) + 'px,0,0)';
  }

  /* ---------- 制作実績 ----------
     PC（幅1024px以上）：縦スクロールに連動して横に流れる
     スマホ・動きを減らす設定：通常の横スワイプ */
  var works = document.getElementById('works');
  var pin = works.querySelector('.works-pin');
  var wrap = works.querySelector('.track-wrap');
  var track = works.querySelector('.track');
  var bar = works.querySelector('.progress-bar');
  var worksX = 0;
  var distance = 0;

  function isPinned() { return wideQuery.matches && !isReduced(); }

  function layoutWorks() {
    works.classList.toggle('is-pinned', isPinned());
    track.style.transform = '';
    works.style.height = '';
    wrap.scrollLeft = 0;
    if (!isPinned()) return;
    // 横に動かす距離の分だけセクションを縦に長くし、その間は画面に貼り付ける
    distance = Math.max(0, track.scrollWidth - wrap.clientWidth + 40);
    works.style.height = (pin.offsetHeight + distance) + 'px';
  }

  function updateWorks() {
    if (isPinned()) {
      var progress = distance ? clamp((window.scrollY - works.offsetTop) / distance, 0, 1) : 0;
      var target = -progress * distance;
      worksX = lerp(worksX, target, 0.12);
      if (Math.abs(target - worksX) < 0.3) worksX = target;
      track.style.transform = 'translate3d(' + worksX.toFixed(1) + 'px,0,0)';
      bar.style.transform = 'scaleX(' + (distance ? -worksX / distance : 0).toFixed(3) + ')';
    } else {
      var max = wrap.scrollWidth - wrap.clientWidth;
      bar.style.transform = 'scaleX(' + (max > 0 ? wrap.scrollLeft / max : 0).toFixed(3) + ')';
    }
  }

  // スワイプ型のとき：矢印ボタンで1枚分ずつ移動
  works.querySelectorAll('.arrow-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = track.children[2].offsetWidth + 16;
      wrap.scrollBy({ left: step * Number(btn.dataset.dir), behavior: isReduced() ? 'auto' : 'smooth' });
    });
  });

  // PCの連動型でTabキーを使ったとき：
  // ブラウザは選んだカードを見せるために一覧を横にずらそうとするので、
  // そのずれ（scrollLeft）を縦スクロールの量に置き換えて、演出と位置をそろえる
  wrap.addEventListener('scroll', function () {
    if (!isPinned() || wrap.scrollLeft === 0) return;
    var current = clamp(window.scrollY - works.offsetTop, 0, distance);
    var x = clamp(current + wrap.scrollLeft, 0, distance);
    wrap.scrollLeft = 0;
    worksX = -x;
    window.scrollTo({ top: works.offsetTop + x, behavior: 'auto' });
  });

  // 一覧そのものを選んだ状態で左右キーを押したとき
  wrap.addEventListener('keydown', function (e) {
    if (!isPinned() || e.target !== wrap) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    window.scrollBy({ top: (e.key === 'ArrowRight' ? 1 : -1) * 360, behavior: 'auto' });
  });

  /* ---------- カーソル追従（PCのみ） ---------- */
  var cursor = document.querySelector('.cursor');
  var pointer = { x: 0, y: 0 };
  var pos = { x: 0, y: 0 };
  var hasMoved = false;

  function cursorEnabled() { return fineQuery.matches && !isReduced(); }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !cursorEnabled()) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (!hasMoved) { pos.x = pointer.x; pos.y = pointer.y; hasMoved = true; }
    cursor.classList.add('is-visible');
  });
  document.addEventListener('pointerleave', function () { cursor.classList.remove('is-visible'); });

  // リンクやボタンの上では輪に広がる。濃い背景の上では白にする
  document.addEventListener('pointerover', function (e) {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, [tabindex="0"]'));
    cursor.classList.toggle('on-dark', !!e.target.closest('.vision, .contact, .footer, .card-feature, .card-navy, .exp-a, .exp-b, .voice-main, .ps-navy, .ps-blue'));
  });

  function updateCursor() {
    if (!hasMoved || !cursorEnabled()) return;
    pos.x = lerp(pos.x, pointer.x, 0.22);
    pos.y = lerp(pos.y, pointer.y, 0.22);
    cursor.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
  }

  /* ---------- 現在地のメニューを強調 ---------- */
  var navLinks = document.querySelectorAll('.nav a');
  var nav = document.querySelector('.nav');
  var navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (link) {
        var current = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('is-current', current);
        if (current && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: link.offsetLeft - 20, behavior: isReduced() ? 'auto' : 'smooth' });
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(function (link) { navObserver.observe(document.querySelector(link.getAttribute('href'))); });

  /* ---------- ページ上部へ戻る（ヘッダーの「きんちゃん」とフッターのリンク） ----------
     どちらも確実に一番上（0）まで戻す。動きを減らす設定ではアニメーションなし */
  document.querySelectorAll('a[href="#top"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' });
      // キーボード操作の人のために、選択位置もページ先頭（「本文へ移動」リンク）に戻す
      document.querySelector('.skip-link').focus({ preventScroll: true });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* ---------- 日本・中国の時刻 ---------- */
  function tickClock() {
    var opts = { hour: '2-digit', minute: '2-digit', hour12: false };
    document.getElementById('clock-jp').textContent = new Date().toLocaleTimeString('ja-JP', Object.assign({ timeZone: 'Asia/Tokyo' }, opts));
    document.getElementById('clock-cn').textContent = new Date().toLocaleTimeString('ja-JP', Object.assign({ timeZone: 'Asia/Shanghai' }, opts));
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- 毎フレームの処理 ---------- */
  function frame() {
    updateHero();
    updateWorks();
    updateCursor();
    requestAnimationFrame(frame);
  }

  /* ---------- URL末尾の「#profile」などで直接開いたときの位置合わせ ----------
     ブラウザは読み込み直後に移動するが、その後フォントの読み込みや
     制作実績（縦→横スクロール）の高さ調整でページの長さが変わり、位置がずれる。
     すべて整ってから、目的のセクションへアニメーションなしで移動し直す */
  var initialHash = location.hash;
  if (initialHash && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual'; // 再読み込み時に「前回のスクロール位置」へ戻されるのを防ぐ
  }

  function jumpToHash() {
    var id = decodeURIComponent(initialHash.slice(1));
    var target = id && document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  window.addEventListener('resize', layoutWorks);
  window.addEventListener('load', function () {
    layoutWorks(); // フォント読み込み後に幅を測り直す
    if (!initialHash) return;
    var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function () {
      layoutWorks();
      jumpToHash();
    });
  });
  reduceQuery.addEventListener('change', function () { layoutWorks(); if (isReduced()) groups.forEach(function (g) { g.classList.add('is-in'); }); });
  wideQuery.addEventListener('change', layoutWorks);

  layoutWorks();
  requestAnimationFrame(frame);
})();
