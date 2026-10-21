import type { ExpoConfig } from 'expo/config';
import { withAppBuildGradle, withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

// A free (personal) Apple team cannot sign Sign in with Apple,
// so a build for a personal iPhone sets PERSONAL_TEAM=1. Store builds keep it.
const personalTeam = process.env.PERSONAL_TEAM === '1';
// The app shows the Apple button only when this capability is in the build.
const usesAppleSignIn = process.env.EXPO_PUBLIC_SIGN_IN_APPLE !== '0' && !personalTeam;
// The Google plugin needs the reversed iOS client id. Take it from GOOGLE_IOS_URL_SCHEME, or derive it
// from EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID so one value configures both the plugin and the app.
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleIosUrlScheme =
  process.env.GOOGLE_IOS_URL_SCHEME ||
  (googleIosClientId ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}` : undefined);

const config: ExpoConfig = {
  name: 'Runmeal',
  slug: 'runmeal-portal',
  scheme: 'runmealportal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.runmeal.portal',
    // Raise for every TestFlight / App Store upload of the same version.
    buildNumber: '1',
    // Only HTTPS and the OS's own crypto: no export compliance questions on each upload.
    config: { usesNonExemptEncryption: false },
    // The paid team that signs store and TestFlight builds; a personal-team build picks its own in Xcode.
    appleTeamId: personalTeam ? undefined : 'T776LGPKWZ',
    supportsTablet: false,
    usesAppleSignIn,
    infoPlist: {
      CFBundleLocalizations: ['tr', 'en'],
    },
  },
  android: {
    package: 'com.runmeal.portal',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/adaptive-icon.png',
    },
    predictiveBackGestureEnabled: false,
    // Pulled in by libraries but never used; Play asks for a reason for each one it sees.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.CAMERA',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, object]]
      : []),
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFAF5',
        image: './assets/splash-icon.png',
        imageWidth: 160,
      },
    ],
    // Only "while using the app": App Review rejects purpose strings the app never asks for, or generic ones.
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Your location fills in your delivery address so we can show restaurants that deliver to you.',
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        locationFullAccuracyPermission: false,
        motionUsagePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

/**
 * Expo applies expo-apple-authentication's plugin by itself, and that plugin
 * always adds the Sign in with Apple entitlement. Take it out again when this
 * build should not have it, or a free Apple team cannot sign the app.
 */
const withoutAppleSignIn: ConfigPlugin = (base) =>
  withEntitlementsPlist(base, (mod) => {
    delete mod.modResults['com.apple.developer.applesignin'];
    return mod;
  });

// Gradle properties naming the Play upload key: RUNMEAL_PORTAL_UPLOAD_STORE_FILE and friends.
const signingPrefix = 'RUNMEAL_PORTAL_UPLOAD';

/**
 * Signs release builds with the Play upload key when ~/.gradle/gradle.properties
 * names it (see README "Play upload key"); otherwise release builds keep the debug key,
 * which is fine for test APKs and refused by Play.
 */
const withReleaseSigning: ConfigPlugin = (base) =>
  withAppBuildGradle(base, (mod) => {
    const p = signingPrefix;
    mod.modResults.contents = mod.modResults.contents
      .replace(
        /signingConfigs \{\n/,
        `signingConfigs {
        release {
            if (findProperty('${p}_STORE_FILE')) {
                storeFile file(findProperty('${p}_STORE_FILE'))
                storePassword findProperty('${p}_STORE_PASSWORD')
                keyAlias findProperty('${p}_KEY_ALIAS')
                keyPassword findProperty('${p}_KEY_PASSWORD')
            }
        }
`,
      )
      .replace(
        /(release \{\n\s*\/\/ Caution![^\n]*\n[^\n]*\n\s*)signingConfig signingConfigs\.debug/,
        `$1signingConfig findProperty('${p}_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
      );
    return mod;
  });

export default withReleaseSigning(usesAppleSignIn ? config : withoutAppleSignIn(config));
