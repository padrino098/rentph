# Android App Workflow

RentPH is wrapped as a native Android application with Capacitor. The Android WebView loads the same React/Vite app used by the website. The Android package ID is `com.rentph.app`.

## Requirements

- Node.js and npm
- JDK 21 or newer
- Android SDK Command-line Tools, platform-tools, emulator, Android 35 platform/build-tools, and an Android 35 Google APIs x86_64 system image
- A configured Android 35 AVD

The PowerShell workflow detects `ANDROID_SDK_ROOT`/`ANDROID_HOME`, or defaults to `%LOCALAPPDATA%\Android\Sdk`. It detects a valid JDK 21 in `JAVA_HOME` or `%LOCALAPPDATA%\Programs\Microsoft\jdk-21-*`. It does not change machine-wide variables.

## Commands

Run once to install the Android SDK packages and create the default `TMT_API_35` Pixel 6 AVD if missing:

```powershell
npm run android:setup
```

Check the toolchain and attached devices:

```powershell
npm run android:doctor
```

Start the Android emulator, wait until its home screen is ready, then install and launch RentPH:

```powershell
npm run android:emulator
npm run android:install
```

Build a debug APK without installing it:

```powershell
npm run android:build
```

The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`. Set `RENTPH_ANDROID_AVD` to use a different installed AVD. For an Android phone, enable developer options and USB debugging, connect it, authorize the computer prompt, then run `npm run android:install`.

## Development Notes

`npm run android:install` makes a production Vite build, syncs it into the native project, installs the debug app, and launches it. Repeat after web changes. The current UI still uses browser/local app storage and demo payments; this wrapper does not by itself make simulated workflows production-ready.

Credential authentication uses the Capacitor HTTP bridge. With `VITE_API_BASE_URL` unset, the emulator connects to the host API at `http://10.0.2.2:8000/api/v1`. Native overrides must be absolute HTTP(S) URLs; use an HTTPS API URL for physical devices and deployments. A browser-relative `/api/v1` is not a native backend URL. Rebuild and sync after changing the environment.

`npm run test:api` checks native HTTP dispatch with a simulated bridge, not an installed Android app or a device's network connection. See [connection-verification.md](connection-verification.md) for verification limits.