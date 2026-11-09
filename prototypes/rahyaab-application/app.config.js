// Build settings on top of app.json.
// EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP=1 (set in eas.json for the "preview" demo build) lets the app talk to a RahYaab server
// over plain http:// on a local network (Android blocks that by default). Production builds leave it unset: https only.
module.exports = ({config}) => {
  const allowHttp = process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP === '1';
  const plugins = (config.plugins || []).filter((p) => (Array.isArray(p) ? p[0] : p) !== 'expo-build-properties');
  if (allowHttp) plugins.push(['expo-build-properties', {android: {usesCleartextTraffic: true}}]);
  return {...config, plugins};
};
