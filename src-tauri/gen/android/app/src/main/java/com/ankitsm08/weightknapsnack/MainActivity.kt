// Android 15+ forces edge-to-edge, meaning the WebView draws behind the
// status bar. I use addJavascriptInterface to expose the real status bar
// height to JS, and each HTML page sets it as a CSS var on DOMContentLoaded.
//
// There are plugins like tauri-plugin-edge-to-edge that do this more
// comprehensively (keyboard insets, all 4 edges), but I only needed
// the top safe area and wanted to avoid the dependency.
// See the HTML files for the consumer side.

package com.ankitsm08.weightknapsnack

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Must come before super.onCreate()
    // tells Android to draw behind system bars.
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)

    // Expose a Java object to JS so the HTML pages can read the status bar height.
    // addJavascriptInterface is a standard WebView API (since API 17).
    // Tauri also uses it for its own IPC, but multiple interfaces coexist fine.
    // webView.context is the Application context, not the Activity, so no leak risk.
    webView.addJavascriptInterface(SafeAreaBridge(webView.context), "SafeAreaBridge")
  }
}

// Called from JS as: window.SafeAreaBridge.getStatusBarHeight()
// Returns the status bar height in CSS pixels (~24 on most phones).

class SafeAreaBridge(private val context: Context) {
  @JavascriptInterface
  fun getStatusBarHeight(): Int {
    val id = context.resources.getIdentifier("status_bar_height", "dimen", "android")
    val px = if (id > 0) context.resources.getDimensionPixelSize(id) else 0
    val density = context.resources.displayMetrics.density
    return (px / density).toInt()
  }
}
