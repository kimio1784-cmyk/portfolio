/* =========================================================
   アクセス解析（Google Analytics 4）の共通設定
   - 各ページの <head> に <script src="analytics.js" async></script> を1行置くだけで計測される
   - 測定IDはこのファイルだけで管理する（ページごとにタグを書かない＝二重設置を防ぐ）
   - Cloudflare Web Analytics のタグは各ページの </body> 直前に別途置いている

   同意が必要な地域（EEA・英国・スイス）の扱い：
   1) ブラウザのタイムゾーンがこれらの地域（またはUTCなど判別できない値）なら、
      GA4のスクリプト自体を読み込まない（Googleへの送信なし）
   2) 1をすり抜けた場合の安全策として、Google側でIPから判定されたこれらの地域では
      同意モードの初期値を「拒否」にしている（Cookieは使わないが、Cookieなしの計測信号は送られる）
   同意バナーを設置した場合は、1の判定を「同意するまで読み込まない」処理に置き換える
   ========================================================= */
(function () {
  var GA_ID = 'G-Q4R0JY4EK1';

  // 同じページで2回読み込まれても、計測は1回だけにする
  if (window.__kwAnalyticsLoaded) return;
  window.__kwAnalyticsLoaded = true;

  // ---- 1) タイムゾーンによる地域判定 ----------------------------
  // Europe/* に加え、EEA・英国・スイスに属するがEurope/*以外の名前を持つ地域
  var CONSENT_REQUIRED_TIMEZONES = [
    'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Africa/Ceuta',     // スペイン・ポルトガル
    'Atlantic/Reykjavik', 'Atlantic/Faroe', 'Arctic/Longyearbyen', 'Atlantic/Jan_Mayen', // 北欧
    'Asia/Nicosia', 'Asia/Famagusta',                                             // キプロス
    'America/Guadeloupe', 'America/Martinique', 'America/Cayenne', 'America/Marigot',
    'Indian/Reunion', 'Indian/Mayotte',                                           // フランス海外県（EU域内）
    'GB', 'GB-Eire', 'Eire', 'Iceland', 'Portugal', 'Poland', 'WET', 'CET', 'MET', 'EET' // 旧形式の名前
  ];

  function needsConsent() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    if (!tz) return true;                                   // 判定できない → 読み込まない
    if (/^(UTC|Etc\/|GMT|UCT|Universal|Zulu)/.test(tz)) return true; // UTC等（地域を隠す設定のブラウザ）
    if (tz.indexOf('Europe/') === 0) return true;
    return CONSENT_REQUIRED_TIMEZONES.indexOf(tz) !== -1;
  }

  if (needsConsent()) return;

  // ---- 2) 同意モード（Consent Mode v2）の初期値 --------------------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var gtag = window.gtag;

  // 広告は使っていないので、広告用の項目は全地域で「拒否」
  // EEA（EU27か国＋アイスランド・リヒテンシュタイン・ノルウェー）、英国、スイスでは解析用Cookieも「拒否」
  var CONSENT_REQUIRED_REGIONS = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
    'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    'IS', 'LI', 'NO',
    'GB', 'CH'
  ];
  var ADS_DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

  gtag('consent', 'default', Object.assign({ analytics_storage: 'granted' }, ADS_DENIED));
  gtag('consent', 'default', Object.assign({ analytics_storage: 'denied', region: CONSENT_REQUIRED_REGIONS }, ADS_DENIED));

  gtag('js', new Date());
  gtag('config', GA_ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();
