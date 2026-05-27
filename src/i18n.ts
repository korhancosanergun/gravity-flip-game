// ─── i18n — Gravity Flip 3D ───────────────────────────────────────────────
// Supports: 'tr' (Turkish) | 'en' (English)
// Auto-detects from navigator.language; persists choice in localStorage.

export type Locale = 'tr' | 'en';

const STORAGE_KEY = 'gf_locale';

// ── String translations (static) ──────────────────────────────────────────

interface Strings {
  // Auth
  authTagline: string;
  tabLogin: string;
  tabRegister: string;
  phUsername: string;
  phPassword: string;
  phChooseUsername: string;
  phCreatePassword: string;
  btnLogin: string;
  btnLoggingIn: string;
  btnCreateAccount: string;
  btnCreating: string;
  btnGuest: string;
  authOr: string;
  errLoginFailed: string;
  errRegFailed: string;
  // Control picker
  cpTitle: string;
  cpSub: string;
  cpDpadName: string;
  cpDpadDesc: string;
  cpGyroName: string;
  cpGyroDesc: string;
  cpBadgeClassic: string;
  cpBadgeNew: string;
  cpRemember: string;
  cpFooter: string;
  cpSensorUnavail: string;
  cpSensorDenied: string;
  // HUD
  guest: string;
  gravityDown: string;
  gravityUp: string;
  gravityLeft: string;
  gravityRight: string;
  // Game messages
  msgDeadTitle: string;
  msgDeadSub: string;
  msgWonTitle: string;
  msgAllCompleteTitle: string;
  msgAllCompleteSub: string;
  // Leaderboard
  lbTitle: string;
  lbLoading: string;
  lbEmpty: string;
  lbFlips: string;
  lbHdrRank: string;
  lbHdrPlayer: string;
  lbHdrLevels: string;
  lbHdrFlips: string;
  // Update toast
  updateMsg: string;
  updateReload: string;
  // Lang button label (shows the *other* language to switch to)
  langLabel: string;
}

// ── Template translations (parameterised) ─────────────────────────────────

interface Templates {
  msgWonPerfect: (flips: number) => string;
  msgWonFlips:   (flips: number) => string;
}

// ── Translation tables ─────────────────────────────────────────────────────

const str: Record<Locale, Strings> = {
  en: {
    authTagline:      'Master the physics of gravity',
    tabLogin:         'Login',
    tabRegister:      'Register',
    phUsername:       'Username',
    phPassword:       'Password',
    phChooseUsername: 'Choose username',
    phCreatePassword: 'Create password',
    btnLogin:         'LOGIN',
    btnLoggingIn:     'LOGGING IN…',
    btnCreateAccount: 'CREATE ACCOUNT',
    btnCreating:      'CREATING…',
    btnGuest:         'Play as Guest',
    authOr:           'or',
    errLoginFailed:   'Login failed',
    errRegFailed:     'Registration failed',
    cpTitle:          'HOW DO YOU<br>WANT TO PLAY?',
    cpSub:            'Gravity is in your hands — literally',
    cpDpadName:       'D‑PAD',
    cpDpadDesc:       'Tap arrows to flip gravity',
    cpGyroName:       'GYROSCOPE',
    cpGyroDesc:       'Tilt device to flip gravity',
    cpBadgeClassic:   'CLASSIC',
    cpBadgeNew:       'NEW',
    cpRemember:       'Remember my choice',
    cpFooter:         'You can always reset in Settings → clear site data',
    cpSensorUnavail:  'Sensor not available on this device',
    cpSensorDenied:   'Sensor permission denied. Enable it in Settings.',
    guest:            'GUEST',
    gravityDown:      'DOWN',
    gravityUp:        'UP',
    gravityLeft:      'LEFT',
    gravityRight:     'RIGHT',
    msgDeadTitle:     'TRY AGAIN',
    msgDeadSub:       'GRAVITY IS CRUEL',
    msgWonTitle:      'LEVEL CLEAR',
    msgAllCompleteTitle: 'COMPLETE',
    msgAllCompleteSub:   'YOU MASTERED GRAVITY',
    lbTitle:    'LEADERBOARD',
    lbLoading:  'Loading…',
    lbEmpty:    'No scores yet — be the first!',
    lbFlips:    'flips',
    lbHdrRank:   'RANK',
    lbHdrPlayer: 'PLAYER',
    lbHdrLevels: 'LEVELS',
    lbHdrFlips:  'FLIPS',
    updateMsg:    '🔄 New version available',
    updateReload: 'Reload',
    langLabel:    'TR',
  },
  tr: {
    authTagline:      'Yerçekiminin fiziğine hükmet',
    tabLogin:         'Giriş',
    tabRegister:      'Kayıt',
    phUsername:       'Kullanıcı adı',
    phPassword:       'Şifre',
    phChooseUsername: 'Kullanıcı adı seç',
    phCreatePassword: 'Şifre oluştur',
    btnLogin:         'GİRİŞ',
    btnLoggingIn:     'GİRİŞ YAPILIYOR…',
    btnCreateAccount: 'HESAP OLUŞTUR',
    btnCreating:      'OLUŞTURULUYOR…',
    btnGuest:         'Misafir Olarak Oyna',
    authOr:           'veya',
    errLoginFailed:   'Giriş başarısız',
    errRegFailed:     'Kayıt başarısız',
    cpTitle:          'NASIL<br>OYNAMAK İSTERSİN?',
    cpSub:            'Yerçekimi senin elinde — gerçek anlamıyla',
    cpDpadName:       'D‑PAD',
    cpDpadDesc:       'Yön tuşlarına dokun',
    cpGyroName:       'JİROSKOP',
    cpGyroDesc:       'Cihazı eğ, yerçekimi değişsin',
    cpBadgeClassic:   'KLASİK',
    cpBadgeNew:       'YENİ',
    cpRemember:       'Seçimimi hatırla',
    cpFooter:         'Ayarlar → Site verilerini temizle ile sıfırlayabilirsin',
    cpSensorUnavail:  'Bu cihazda sensör mevcut değil',
    cpSensorDenied:   'Sensör izni reddedildi. Ayarlardan etkinleştir.',
    guest:            'MİSAFİR',
    gravityDown:      'AŞAĞI',
    gravityUp:        'YUKARI',
    gravityLeft:      'SOL',
    gravityRight:     'SAĞ',
    msgDeadTitle:     'TEKRAR DENE',
    msgDeadSub:       'YERÇEKİMİ ACIMAZ',
    msgWonTitle:      'BÖLÜM TAMAM',
    msgAllCompleteTitle: 'TAMAMLANDI',
    msgAllCompleteSub:   'YERÇEKİMİNE HÜKMETTİN',
    lbTitle:    'LİDERLİK TABLOSU',
    lbLoading:  'Yükleniyor…',
    lbEmpty:    'Henüz skor yok — ilk sen ol!',
    lbFlips:    'hamle',
    lbHdrRank:   'SIRA',
    lbHdrPlayer: 'OYUNCU',
    lbHdrLevels: 'BÖLÜM',
    lbHdrFlips:  'HAMLE',
    updateMsg:    '🔄 Yeni sürüm mevcut',
    updateReload: 'Yenile',
    langLabel:    'EN',
  },
};

const tmpl: Record<Locale, Templates> = {
  en: {
    msgWonPerfect: (f) => `PERFECT · ${f} FLIP${f !== 1 ? 'S' : ''}`,
    msgWonFlips:   (f) => `${f} FLIPS`,
  },
  tr: {
    msgWonPerfect: (f) => `MÜKEMMEL · ${f} HAMLE`,
    msgWonFlips:   (f) => `${f} HAMLE`,
  },
};

// ── State ─────────────────────────────────────────────────────────────────

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'tr' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

let _locale: Locale = detectLocale();

export function locale(): Locale { return _locale; }

// ── Accessors ─────────────────────────────────────────────────────────────

export function t(key: keyof Strings): string {
  return str[_locale][key];
}

export function tf(key: keyof Templates, n: number): string {
  return tmpl[_locale][key](n);
}

// ── Apply to DOM ───────────────────────────────────────────────────────────

export function applyI18n(): void {
  document.documentElement.lang = _locale;

  // Text content
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.dataset['i18n'] as keyof Strings;
    if (key in str[_locale]) el.textContent = str[_locale][key];
  });

  // innerHTML (for strings with <br>)
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach(el => {
    const key = el.dataset['i18nHtml'] as keyof Strings;
    if (key in str[_locale]) el.innerHTML = str[_locale][key];
  });

  // Placeholders
  document.querySelectorAll<HTMLInputElement>('[data-i18n-ph]').forEach(el => {
    const key = el.dataset['i18nPh'] as keyof Strings;
    if (key in str[_locale]) el.placeholder = str[_locale][key];
  });

  // Lang toggle button label
  document.querySelectorAll<HTMLElement>('.lang-switch-label').forEach(el => {
    el.textContent = str[_locale].langLabel;
  });
}

// ── Public setter ─────────────────────────────────────────────────────────

export function setLocale(loc: Locale): void {
  _locale = loc;
  localStorage.setItem(STORAGE_KEY, loc);
  applyI18n();
  window.dispatchEvent(new CustomEvent('localechange', { detail: loc }));
}
