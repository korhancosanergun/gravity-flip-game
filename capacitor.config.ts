import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gravityflip.game',
  appName: 'Gravity Flip 3D',
  webDir: 'dist',
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
