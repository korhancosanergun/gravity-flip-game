import type { CapacitorConfig } from '@capacitor/cli';

// Set NODE_ENV=production before `cap sync` for OTA builds:
//   $env:NODE_ENV='production'; npx cap sync android
// Without it, the APK bundles local dist/ assets.
const isProd = process.env['NODE_ENV'] === 'production';

const config: CapacitorConfig = {
  appId: 'com.gravityfliptomris.game',
  appName: 'Gravity Flip 3D',
  webDir: 'dist',
  ...(isProd && {
    server: {
      url: 'https://gravitygame.tomris.games',
      cleartext: false,
    },
  }),
  android: {
    backgroundColor: '#0a0a1a',
  },
  ios: {
    backgroundColor: '#0a0a1a',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0a1a',
      showSpinner: false,
    },
  },
};

export default config;
