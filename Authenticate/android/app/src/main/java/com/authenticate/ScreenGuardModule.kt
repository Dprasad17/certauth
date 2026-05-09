package com.authenticate

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * ScreenGuardModule
 * Applies or removes WindowManager.LayoutParams.FLAG_SECURE on the main activity window.
 * FLAG_SECURE:
 *   - Prevents screenshots and screen recordings.
 *   - Blacks out the screen in the Android "Recents" overview.
 */
class ScreenGuardModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenGuard"

    @ReactMethod
    fun enable() {
        val activity = reactContext.currentActivity ?: return
        activity.runOnUiThread {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    @ReactMethod
    fun disable() {
        val activity = reactContext.currentActivity ?: return
        activity.runOnUiThread {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
