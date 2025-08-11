import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [qrResult, setQrResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanCount, setScanCount] = useState(0);

  const startScanner = () => {
    if (!qrRef.current) {
      console.error("QR container not available.");
      return;
    }

    const html5QrCode = new Html5Qrcode(qrRef.current.id);
    html5QrCodeRef.current = html5QrCode;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setIsScanning(true);
          setCameraError(null);

          html5QrCode
            .start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              (decodedText) => {
                console.log("Scanned:", decodedText);
                setQrResult(decodedText);
                setScanCount((prev) => prev + 1);
                // Don't stop automatically - let user decide when to stop
              },
              (errorMessage) => {
                // Ignore common scanning errors
              }
            )
            .catch((err) => {
              console.error("Camera access error:", err);
              setCameraError(
                "Failed to access camera. Please check permissions."
              );
              setIsScanning(false);
            });
        } else {
          setCameraError("No camera found on this device.");
        }
      })
      .catch((err) => {
        console.error("Camera fetch error:", err);
        setCameraError("Could not access camera devices.");
      });
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err) => {
          console.warn("Stop error:", err.message);
        });
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Professional QR Scanner
      </h2>

      {/* Scanner Status */}
      <div className="mb-4 text-center">
        {isScanning ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse"></span>
            Scanning...
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Scanner inactive
          </span>
        )}
      </div>

      {/* Scanner Window */}
      <div className="relative">
        <div
          ref={qrRef}
          id="qr-reader"
          className="w-full aspect-square rounded-lg border-2 border-blue-400 overflow-hidden shadow-md"
        ></div>

        {/* Scanner Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner borders */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

            {/* Scanning line animation */}
            <div
              className="absolute left-0 right-0 h-1 bg-blue-400 rounded-full shadow-lg"
              style={{
                boxShadow: "0 0 10px rgba(59, 130, 246, 0.8)",
                animation: "scan 2s infinite linear",
              }}
            ></div>
          </div>
        )}
      </div>

      {/* Camera Error */}
      {cameraError && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {cameraError}
        </div>
      )}

      {/* Scan Results */}
      {qrResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500 animate-fade-in">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Scan Result{" "}
            <span className="text-sm font-normal text-gray-500">
              (#{scanCount})
            </span>
          </h3>
          <div className="p-3 bg-white rounded-md border border-gray-200 font-mono text-sm break-all">
            {qrResult}
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Scanned at: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {isScanning ? (
          <button
            onClick={stopScanner}
            className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition duration-200"
          >
            Stop Scanner
          </button>
        ) : (
          <button
            onClick={startScanner}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition duration-200"
          >
            Start Scanner
          </button>
        )}

        {qrResult && (
          <button
            onClick={resetScanner}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition duration-200"
          >
            Scan Another
          </button>
        )}
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0.7;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
