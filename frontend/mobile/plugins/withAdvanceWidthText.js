// Keeps Android's text wrapping the same as React Native's text measuring, so Urdu text is never cut off.
//
// The problem: from Android 15, apps that target SDK 35+ wrap text by the INK of the letters
// (TextView "useBoundsForWidth"). React Native measures text by the letters' ADVANCE widths. Nastaliq
// (Gulzar) letters reach past their advance width (the tail of ے, the bar of گ), so Android wrapped a line
// that React Native had measured as fitting: the second line fell outside the box and was not shown
// ("گھر کا ریڈیو ٹھیک کرنا" lost "کرنا"), and short words were cut at the side ("آگے").
//
// The fix: the app theme's default TextView style turns useBoundsForWidth off, so Android wraps by advance
// width like React Native. Ink that reaches past the edge is given room in AppText (padding), not by
// changing the wrapping. Tested on the API 37 emulator, 15 Nov 2026 (design/specs and AppText.tsx).

const { withAndroidStyles } = require('expo/config-plugins');

const STYLE = 'RahyaabTextView';

function setItem(style, name, value, extra = {}) {
  style.item = (style.item ?? []).filter((i) => i.$.name !== name);
  style.item.push({ $: { name, ...extra }, _: value });
}

module.exports = function withAdvanceWidthText(config) {
  return withAndroidStyles(config, (cfg) => {
    const resources = cfg.modResults.resources;
    resources.style = resources.style ?? [];
    const app = resources.style.find((s) => s.$.name === 'AppTheme');
    if (!app) throw new Error('withAdvanceWidthText: AppTheme not found in styles.xml');
    setItem(app, 'android:textViewStyle', `@style/${STYLE}`);
    resources.style = resources.style.filter((s) => s.$.name !== STYLE);
    resources.style.push({
      $: { name: STYLE, parent: 'android:Widget.TextView' },
      item: [{ $: { name: 'android:useBoundsForWidth', 'tools:targetApi': '35' }, _: 'false' }],
    });
    return cfg;
  });
};
