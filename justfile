set dotenv-load := true
set shell := ["bash", "-euo", "pipefail", "-c"]

home := env_var("HOME")
sdk_home := home + "/Android/Sdk"
java_home := "/opt/android-studio/jbr"

ndk_version := `ls -1 {{sdk_home}}/ndk 2>/dev/null | sort -V | tail -n 1 || echo ""`
ndk_home := sdk_home + "/ndk/" + ndk_version

export TAURI_ANDROID_KEYSTORE := home + "/.android/weight-knapsnack.keystore"
export TAURI_ANDROID_KEY_ALIAS := "weight-knapsnack"
export TAURI_ANDROID_KEYSTORE_PASSWORD := env_var("ANDROID_KEYSTORE_PASSWORD")

export ANDROID_HOME := sdk_home
export JAVA_HOME := java_home
export NDK_HOME := ndk_home
export PATH := java_home + "/bin:" + env_var("PATH")

default:
  @just --list

doctor:
  @echo "HOME: {{home}}"
  @echo "SDK:  {{sdk_home}}"
  @echo "JDK:  {{java_home}}"
  @echo "NDK:  {{ndk_home}}"
  @command -v cargo --version
  @command -v adb --version
  @command -v pnpx --version
  @java -version 

# Starts the web dev server
dev:
  pnpx serve ./web/


# Initializes the Android project with tauri
init-android:
  cargo tauri android init
  echo "keyAlias={{ TAURI_ANDROID_KEY_ALIAS }}" > src-tauri/gen/android/keystore.properties
  echo "password={{ TAURI_ANDROID_KEYSTORE_PASSWORD }}" >> src-tauri/gen/android/keystore.properties
  echo "storeFile={{ TAURI_ANDROID_KEYSTORE }}" >> src-tauri/gen/android/keystore.properties
  rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# Prepares the app icon
icon:
  cargo tauri icon ./web/static/favicon.png

# Builds the app for each ABI
build-apk:
  cargo tauri android build --apk --target armv7 --target aarch64 --split-per-abi

# Builds the universal app
build-apk-universal:
  cargo tauri android build --apk

# Cleans the build directory
clean:
  rm -rf src-tauri/target
