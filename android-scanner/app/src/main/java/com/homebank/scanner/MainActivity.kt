package com.homebank.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var previewView: PreviewView
    private lateinit var statusText: TextView
    private lateinit var lastScanText: TextView
    
    private var toneGenerator: ToneGenerator? = null
    
    private val client = OkHttpClient()
    private val SERVER_URL = "http://45.94.156.61:8081"
    
    private var lastScannedCode: String? = null
    private var lastScanTime: Long = 0
    private val SCAN_COOLDOWN = 2000L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        previewView = findViewById(R.id.previewView)
        statusText = findViewById(R.id.statusText)
        lastScanText = findViewById(R.id.lastScanText)
        
        toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100)
        
        cameraExecutor = Executors.newSingleThreadExecutor()
        
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS)
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }
            
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, QRAnalyzer { qrCode ->
                        handleQRCode(qrCode)
                    })
                }
            
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalyzer)
            } catch (e: Exception) {
                Log.e(TAG, "Camera binding failed", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun handleQRCode(qrCode: String) {
        val now = System.currentTimeMillis()
        if (qrCode == lastScannedCode && now - lastScanTime < SCAN_COOLDOWN) {
            return
        }
        
        lastScannedCode = qrCode
        lastScanTime = now
        
        runOnUiThread {
            statusText.text = "Отправка..."
            lastScanText.text = "Код: ${qrCode.take(20)}..."
        }
        
        sendToServer(qrCode)
    }

    private fun sendToServer(qrCode: String) {
        val json = JSONObject().apply {
            put("qrData", qrCode)
        }
        
        val body = json.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("$SERVER_URL/api/scanner/scan")
            .post(body)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    playError()
                    statusText.text = "Ошибка сети"
                    Toast.makeText(this@MainActivity, "Ошибка подключения", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                runOnUiThread {
                    if (response.isSuccessful) {
                        playSuccess()
                        val data = JSONObject(responseBody ?: "{}")
                        val userName = data.optJSONObject("data")?.optString("userName", "Unknown")
                        statusText.text = "✓ $userName"
                        lastScanText.text = "Готов к сканированию"
                    } else {
                        playError()
                        val error = try {
                            JSONObject(responseBody ?: "{}").optString("error", "Ошибка")
                        } catch (e: Exception) { "Ошибка" }
                        statusText.text = "✗ $error"
                    }
                }
            }
        })
    }

    private fun playSuccess() {
        toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 200)
    }

    private fun playError() {
        toneGenerator?.startTone(ToneGenerator.TONE_PROP_NACK, 300)
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Нужно разрешение камеры", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        toneGenerator?.release()
    }

    companion object {
        private const val TAG = "QRScanner"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }
}

class QRAnalyzer(private val onQRDetected: (String) -> Unit) : ImageAnalysis.Analyzer {
    private val scanner = BarcodeScanning.getClient()

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            
            scanner.process(image)
                .addOnSuccessListener { barcodes ->
                    for (barcode in barcodes) {
                        if (barcode.valueType == Barcode.TYPE_TEXT) {
                            barcode.rawValue?.let { onQRDetected(it) }
                        }
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }
}
