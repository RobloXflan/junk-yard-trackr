
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3069c66d252942df87b4f180e247789c',
  appName: 'junk-yard-trackr',
  webDir: 'dist',
  server: {
    url: 'https://3069c66d-2529-42df-87b4-f180e247789c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    BackgroundGeolocation: {
      enableHeadless: true,
      stopOnTerminate: false,
      startOnBoot: true,
      url: 'https://3069c66d-2529-42df-87b4-f180e247789c.lovableproject.com/api/locations',
      autoSync: true,
      debug: false,
      logLevel: 'OFF',
      desiredAccuracy: 10,
      distanceFilter: 50,
      stopTimeout: 5,
      activityRecognitionInterval: 10000,
      saveBatteryOnBackground: true,
      notification: {
        title: 'GPS Tracking Active',
        text: 'Your location is being tracked for work purposes',
        color: '#000000',
        channelName: 'GPS Tracking',
        largeIcon: 'drawable/icon',
        smallIcon: 'drawable/icon',
        priority: 'PRIORITY_HIGH'
      }
    }
  }
};

export default config;
