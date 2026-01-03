import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Type,
  AlertCircle,
  CheckCircle,
  Loader,
  Play,
  Square,
} from "lucide-react";

// CSS to hide unwanted html5-qrcode UI elements
const scannerStyles = `
  #qr-scanner-container #html5-qrcode-button-camera-permission,
  #qr-scanner-container #html5-qrcode-button-file-selection,
  #qr-scanner-container select,
  #qr-scanner-container button:not(.custom-scanner-button),
  #qr-scanner-container .html5-qrcode-element button,
  #qr-scanner-container div[style*="text-align: center"] button,
  #qr-scanner-container div[style*="text-align:center"] button {
    display: none !important;
  }

  #qr-scanner-container > div > div:last-child {
    display: none !important;
  }
`;

const QRScanner = ({
  onScan,
  onError,
  isActive = true,
  className = "",
  showManualInput = true,
  pauseAfterScan = true,
}) => {
  const [scannerMode, setScannerMode] = useState("camera");
  const [manualInput, setManualInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [streamInfo, setStreamInfo] = useState({
    active: false,
    width: 0,
    height: 0,
    constraints: null,
  });

  const html5Qrcode = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);

  // Inject CSS to hide unwanted elements
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = scannerStyles;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // React to isActive flag from parent (e.g. pause when modal opens)
  useEffect(() => {
    if (!isActive) {
      if (cameraStarted || scannerReady) {
        console.log("[QrScanner] isActive=false -> stopping scanner");
      }
      stopScanning();
    }
  }, [isActive]);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setScannerError("");
      setScannerReady(false);
      setCameraStarted(true);
      setStreamInfo({ active: false, width: 0, height: 0, constraints: null });

      console.log("🔥 Starting camera initialization...");

      // Clear any existing scanner
      if (html5Qrcode.current) {
        await html5Qrcode.current.stop();
        html5Qrcode.current = null;
      }

      // Stop any existing stream
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera is not supported in this browser. Please use manual input.",
        );
      }

      console.log("📱 getUserMedia available");

      // Check for secure context (HTTPS origin)
      const isSecure = window.isSecureContext || window.location.protocol === "https:";

      if (!isSecure) {
        throw new Error(
          "Camera requires a secure (HTTPS) connection. Please use HTTPS or manual input.",
        );
      }

      console.log("🔒 Secure context verified");

      // Test camera permissions with back camera preference
      let stream = null;
      let constraints = null;

      try {
        console.log("📹 Trying back camera (environment)...");
        constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("✅ Back camera successful");
      } catch (backCameraError) {
        console.log("⚠️ Back camera failed:", backCameraError.message);

        try {
          console.log("📹 Trying front camera (user)...");
          constraints = {
            video: {
              facingMode: "user",
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
            audio: false,
          };

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("✅ Front camera successful");
        } catch (frontCameraError) {
          console.log("⚠️ Front camera failed:", frontCameraError.message);

          console.log("📹 Trying any camera...");
          constraints = {
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
            audio: false,
          };

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("✅ Any camera successful");
        }
      }

      if (!stream) {
        throw new Error("No camera stream available");
      }

      console.log("📹 Stream obtained:", {
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      // Store stream reference
      videoStreamRef.current = stream;

      // Get video track info
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log("📱 Video track settings:", settings);

        setStreamInfo({
          active: true,
          width: settings.width || 0,
          height: settings.height || 0,
          constraints: constraints,
        });
      }

      // Wait for container to be rendered
      console.log("⏳ Waiting for DOM container...");
      await new Promise((resolve) => {
        const checkContainer = () => {
          const container = document.getElementById("qr-scanner-container");
          if (container) {
            console.log("✅ DOM container found");
            resolve();
          } else {
            setTimeout(checkContainer, 50);
          }
        };
        checkContainer();
      });

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            console.log("🎥 Video metadata loaded");
            resolve();
          };
        });
        
        // Play the video
        try {
          await videoRef.current.play();
          console.log("▶️ Video playback started");
        } catch (playError) {
          console.error("❌ Video playback error:", playError);
          throw new Error("Failed to start video playback");
        }
      }

      // Initialize scanner
      console.log("🔍 Initializing QR scanner...");

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      html5Qrcode.current = new Html5Qrcode("qr-scanner-container");
      
      // Start scanning
      await html5Qrcode.current.start(
        { deviceId: { exact: videoTrack.getSettings().deviceId } },
        config,
        (decodedText) => {
          console.log("✅ QR Code detected:", decodedText);
          handleScanSuccess(decodedText);
        },
        (error) => {
          // Ignore frequent scanning errors
          if (
            !error.includes("No MultiFormat Readers") &&
            !error.includes("NotFoundException") &&
            !error.includes("No QR code found")
          ) {
            console.warn("QR scan error:", error);
          }
        }
      );

      console.log("✅ Scanner initialization complete");
      setScannerReady(true);
      setIsScanning(false);
    } catch (error) {
      console.error("❌ Scanner initialization error:", error);

      let errorMessage =
        error.message || "Failed to initialize camera scanner.";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera access denied. Please allow camera permissions and refresh the page.";
      } else if (error.name === "NotFoundError") {
        errorMessage =
          "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage =
          "Camera constraints not supported. Please try manual input.";
      }

      setScannerError(errorMessage);
      setIsScanning(false);
      setCameraStarted(false);
      setStreamInfo({ active: false, width: 0, height: 0, constraints: null });

      // Clean up any partial setup
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }

      if (html5Qrcode.current) {
        await html5Qrcode.current.stop();
        html5Qrcode.current = null;
      }

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const stopScanning = async () => {
    try {
      console.log("🛑 Stopping scanner...");

      if (html5Qrcode.current) {
        await html5Qrcode.current.stop();
        html5Qrcode.current = null;
      }

      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log("🔌 Stopped track:", track.kind);
        });
        videoStreamRef.current = null;
      }

      setScannerReady(false);
      setIsScanning(false);
      setScannerError("");
      setCameraStarted(false);
      setStreamInfo({ active: false, width: 0, height: 0, constraints: null });

      console.log("✅ Scanner stopped");
    } catch (error) {
      console.error("Error stopping scanner:", error);
      setScannerReady(false);
      setIsScanning(false);
      setCameraStarted(false);
      setStreamInfo({ active: false, width: 0, height: 0, constraints: null });
    }
  };

  const handleScanSuccess = (decodedText) => {
    const trimmed = (decodedText || "").trim();
    console.log("[QrScanner] Scan detected", { raw: decodedText, trimmed });

    if (!trimmed) return;

    if (onScan) {
      onScan(trimmed);
    }

    // Prevent multiple rapid callbacks for the same QR by pausing the scanner
    if (pauseAfterScan) {
      stopScanning();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const input = manualInput.trim();
    if (input && onScan) {
      onScan(input);
      setManualInput("");
    }
  };

  const switchToCamera = () => {
    setScannerMode("camera");
    setManualInput("");
  };

  const switchToManual = () => {
    setScannerMode("manual");
    stopScanning();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mode Toggle Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={switchToCamera}
          className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
            scannerMode === "camera"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          disabled={isScanning}
        >
          <Camera className="w-4 h-4 mr-2" />
          Camera Scan
        </button>

        {showManualInput && (
          <button
            onClick={switchToManual}
            className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
              scannerMode === "manual"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Type className="w-4 h-4 mr-2" />
            Manual Input
          </button>
        )}
      </div>

      {/* Scanner Content */}
      {scannerMode === "camera" ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative">
            {/* Inactive State - Show placeholder */}
            {!cameraStarted && (
              <div className="min-h-[320px] bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <Camera className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-6">Ready to scan QR codes</p>

                {/* Start Scanning Button */}
                <button
                  onClick={startScanning}
                  disabled={isScanning}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Scanning
                </button>
              </div>
            )}

            {/* Loading State */}
            {isScanning && (
              <div className="min-h-[320px] bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                <Loader className="w-8 h-8 mb-4 animate-spin text-green-600" />
                <p className="text-sm text-gray-600">Initializing camera...</p>
              </div>
            )}

            {/* Error State */}
            {scannerError && cameraStarted && (
              <div className="min-h-[320px] bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-red-300">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <CameraOff className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Camera Unavailable
                </h3>
                <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                  {scannerError}
                </p>

                <div className="flex flex-col space-y-3">
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={startScanning}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Try Again
                    </button>

                    {showManualInput && (
                      <button
                        onClick={switchToManual}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Manual Input
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    <p className="mb-1">Troubleshooting:</p>
                    <p>• Refresh the page and allow camera permissions</p>
                    <p>• Make sure no other app is using the camera</p>
                    <p>• Try using HTTPS instead of HTTP</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scanner Container - Always present when camera is started */}
            {cameraStarted && !scannerError && (
              <div className="relative">
                {/* Scanner Container with fixed height */}
                <div
                  id="qr-scanner-container"
                  ref={containerRef}
                  className="rounded-lg overflow-hidden bg-gray-900 relative"
                  style={{ height: "320px" }} // Fixed height ensures proper positioning
                >
                  {/* Video element we control */}
                  <video 
                    ref={videoRef} 
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Stop Scanning Button - Bottom Center Overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <button
                      onClick={stopScanning}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Scanning
                    </button>
                  </div>
                </div>

                {/* Debug Info */}
                {streamInfo.active && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>
                        Stream: Active ({streamInfo.width}×{streamInfo.height})
                      </span>
                      <span className="text-green-600">●</span>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <Camera className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      Position the QR code within the scan area above
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Type className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Manual Input
            </h3>
            <p className="text-sm text-gray-600">
              Enter the Booking ID manually if camera scanning is not available
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="manual-booking-id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Booking ID
              </label>
              <input
                id="manual-booking-id"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter booking ID (e.g., LLL12345)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-lg font-mono"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Scan Order
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
