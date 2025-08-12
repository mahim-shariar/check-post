import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import FullScreenCamera from "../components/FullScreenCamera";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [busNumber, setBusNumber] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const hasScannedRef = useRef(false);
  const [torchOn, setTorchOn] = useState(false);

  const busNumberPattern = /^\d{2}-\d{2}-\d{3}$/;

  const startScanner = async () => {
    if (!qrRef.current) return;

    setCameraError(null);
    setScanSuccess(false);
    hasScannedRef.current = false;

    try {
      const html5QrCode = new Html5Qrcode(qrRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setIsScanning(true);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
          },
          (decodedText) => {
            if (busNumberPattern.test(decodedText) && !hasScannedRef.current) {
              hasScannedRef.current = true;
              setBusNumber(decodedText);
              setScanSuccess(true);

              if (typeof window !== "undefined") {
                const audio = new Audio("/success-beep.mp3");
                audio.play().catch((e) => console.log("Audio play error:", e));
              }

              stopScanner().then(() => {
                // Add a 1.5 second delay before showing camera
                setTimeout(() => {
                  setShowCamera(true);
                }, 1500);
              });
            }
          },
          () => {}
        );
      } else {
        setCameraError("No camera available");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Camera access denied");
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

  const toggleTorch = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.error("Torch error:", err);
      }
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    startScanner();
  };

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  if (showCamera) {
    return (
      <FullScreenCamera
        onPhotoTaken={() => new Promise((resolve) => setTimeout(resolve, 1500))}
        onClose={handleCloseCamera}
        busNumber={busNumber}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center">
      {/* Scanner container */}
      <div className="relative w-full max-w-md h-96 rounded-xl overflow-hidden shadow-2xl">
        <div
          ref={qrRef}
          id="qr-reader"
          className="w-full h-full bg-black"
        ></div>

        {/* Scanner overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Frame border */}
            <div className="absolute inset-0 border-4 border-white/10 rounded-lg"></div>

            {/* Corner markers */}
            {[
              { position: "top-0 left-0", borders: "border-t-4 border-l-4" },
              { position: "top-0 right-0", borders: "border-t-4 border-r-4" },
              { position: "bottom-0 left-0", borders: "border-b-4 border-l-4" },
              {
                position: "bottom-0 right-0",
                borders: "border-b-4 border-r-4",
              },
            ].map((corner, i) => (
              <div
                key={i}
                className={`absolute w-16 h-16 border-blue-500 ${corner.position} ${corner.borders}`}
              ></div>
            ))}

            {/* Scanning line */}
            {isScanning && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-scan-line"></div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          <button
            onClick={toggleTorch}
            className="p-3 bg-black/50 rounded-full backdrop-blur-sm"
            aria-label="Toggle torch"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${
                torchOn ? "text-yellow-300" : "text-white"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center px-4 max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Scan Bus QR Code</h1>
        <p className="text-gray-300">
          Point your camera at the QR code to scan. Make sure it's well lit and
          within the frame.
        </p>
      </div>

      {/* Status indicators */}
      {cameraError && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm text-center">
            <div className="text-red-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
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
            <h2 className="text-xl font-semibold text-white mb-2">
              Camera Error
            </h2>
            <p className="text-gray-300 mb-6">{cameraError}</p>
            <button
              onClick={startScanner}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {scanSuccess && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm text-center animate-pop-in">
            <div className="text-green-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Scan Successful
            </h2>
            <p className="text-gray-300 mb-1">Bus Number:</p>
            <p className="text-2xl font-bold text-blue-400 mb-6">{busNumber}</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 mt-4 text-sm">Preparing camera...</p>
          </div>
        </div>
      )}

      {/* Global styles */}
      <style jsx global>{`
        @keyframes scan-line {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(79vh);
            opacity: 0;
          }
        }

        @keyframes pop-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }

        .animate-pop-in {
          animation: pop-in 0.3s ease-out forwards;
        }

        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
