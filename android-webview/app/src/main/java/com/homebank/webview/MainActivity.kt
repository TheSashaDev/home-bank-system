package com.homebank.webview

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var dimOverlay: View
    
    private val handler = Handler(Looper.getMainLooper())
    private val dimDelay = 30000L // 30 seconds
    private var isDimmed = false
    
    private val SERVER_URL = "http://45.94.156.61:8081"

    private val dimRunnable = Runnable {
        dimOverlay.animate().alpha(0.8f).setDuration(500).start()
        isDimmed = true
    }

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        webView = findViewById(R.id.webView)
        dimOverlay = findViewById(R.id.dimOverlay)
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
        }
        
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        webView.setOnTouchListener { _, event ->
            if (event.action == MotionEvent.ACTION_DOWN) {
                wakeUp()
            }
            false
        }
        
        dimOverlay.setOnClickListener {
            wakeUp()
        }
        
        webView.loadUrl(SERVER_URL)
        scheduleDim()
    }

    private fun wakeUp() {
        if (isDimmed) {
            dimOverlay.animate().alpha(0f).setDuration(200).start()
            isDimmed = false
        }
        scheduleDim()
    }

    private fun scheduleDim() {
        handler.removeCallbacks(dimRunnable)
        handler.postDelayed(dimRunnable, dimDelay)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(dimRunnable)
    }
}
