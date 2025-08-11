import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [qrResult, setQrResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const startScanner = async () => {
    if (!qrRef.current) {
      console.error("QR container not available.");
      return;
    }

    // Clear previous error
    setCameraError(null);

    try {
      const html5QrCode = new Html5Qrcode(qrRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setIsScanning(true);
        setIsInitialized(true);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setQrResult(decodedText);
            setScanCount((prev) => prev + 1);
            // Optional: play success sound
            if (typeof window !== "undefined") {
              const audio = new Audio("/success-beep.mp3"); // Add this file to your public folder
              audio.play().catch((e) => console.log("Audio play error:", e));
            }
          },
          (errorMessage) => {
            // Ignore common scanning errors
          }
        );
      } else {
        setCameraError("No camera found on this device.");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        err.message || "Failed to access camera. Please check permissions."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn("Stop error:", err.message);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const resetScanner = () => {
    setQrResult("");
    setScanCount(0);
    if (!isScanning) {
      startScanner();
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Scanner Window - Full Screen */}
      <div className="relative flex-1">
        <div
          ref={qrRef}
          id="qr-reader"
          className={`w-full h-full bg-black transition-opacity duration-500 ${
            isInitialized ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        {/* Scanner Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80">
            {/* Frame Border */}
            <div className="absolute inset-0 border-2 border-blue-400 rounded-lg opacity-80"></div>

            {/* Animated Corner Borders */}
            {[0, 90, 180, 270].map((rotation, i) => (
              <div
                key={i}
                className="absolute w-12 h-12 border-t-4 border-r-4 border-blue-500"
                style={{
                  top: i < 2 ? "0" : "auto",
                  bottom: i >= 2 ? "0" : "auto",
                  left: i === 0 || i === 3 ? "0" : "auto",
                  right: i === 1 || i === 2 ? "0" : "auto",
                  transform: `rotate(${rotation}deg)`,
                  opacity: isScanning ? 1 : 0.5,
                  transition: "opacity 0.3s ease",
                }}
              ></div>
            ))}

            {isScanning && (
              <>
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-0 right-0 h-px bg-blue-400 opacity-20"
                      style={{
                        top: `${(i * 100) / 20}%`,
                        animation: `scanLine 2s ${i * 0.1}s infinite linear`,
                      }}
                    ></div>
                  ))}
                </div>

                {/* Pulsing Center Dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Scanning Status Indicator */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="px-4 py-2 bg-black bg-opacity-70 rounded-full text-white text-sm flex items-center">
            {isScanning ? (
              <>
                <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse"></span>
                Scanning...
              </>
            ) : (
              <>
                <span className="w-2 h-2 mr-2 rounded-full bg-yellow-500"></span>
                Scanner paused
              </>
            )}
          </div>
        </div>

        {/* Camera Error */}
        {cameraError && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white p-6 rounded-lg max-w-xs text-center">
            <div className="text-red-400 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="mb-4">{cameraError}</p>
            <button
              onClick={startScanner}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Results Panel */}
      {qrResult && (
        <div className="bg-gray-800 text-white p-4 border-t border-gray-700 animate-slide-up">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">
              Scan Result{" "}
              <span className="text-gray-400 text-sm">#{scanCount}</span>
            </h3>
            <div className="text-gray-400 text-sm">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="p-3 bg-gray-700 rounded-md font-mono text-sm break-all mb-3">
            {qrResult}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={resetScanner}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
            >
              Scan Again
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(qrResult)}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {!qrResult && (
        <div className="p-4 bg-gray-900 bg-opacity-80 flex justify-center space-x-4">
          {isScanning ? (
            <button
              onClick={stopScanner}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg"
              title="Stop Scanner"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={startScanner}
              className="p-3 bg-green-600 hover:bg-green-700 rounded-full text-white shadow-lg"
              title="Start Scanner"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes scanLine {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
