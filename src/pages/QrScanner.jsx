import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import FullScreenCamera from "../components/FullScreenCamera";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const audioRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [busNumber, setBusNumber] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const busNumberPattern = /^\d{2}-\d{2}-\d{3}$/;

  // Initialize audio only once
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/success-beep.mp3");
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startScanner = async () => {
    if (!qrRef.current || hasScanned) return;

    setCameraError(null);
    setScanSuccess(false);

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
            if (busNumberPattern.test(decodedText) && !hasScanned) {
              setBusNumber(decodedText);
              setScanSuccess(true);
              setHasScanned(true);

              // Play success sound only once
              if (audioRef.current) {
                audioRef.current
                  .play()
                  .catch((e) => console.log("Audio play error:", e));
              }

              setTimeout(() => {
                stopScanner();
                setShowCamera(true);
              }, 1000);
            }
          },
          () => {} // Quiet error handling
        );
      } else {
        setCameraError("No camera found on this device.");
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err.message.includes("Permission")) {
        setCameraError("Please allow camera access to scan QR codes");
      } else {
        setCameraError(
          err.message || "Failed to access camera. Please try again."
        );
      }
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

  const handlePhotoTaken = async (photoData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      return false;
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setHasScanned(false); // Allow scanning again
    startScanner();
  };

  const requestCameraAccess = () => {
    // Modern way to request camera without page reload
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setCameraError(null);
        startScanner();
      })
      .catch((err) => {
        setCameraError("Camera access was denied. Please enable permissions.");
      });
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  if (showCamera) {
    return (
      <FullScreenCamera
        onPhotoTaken={handlePhotoTaken}
        onClose={handleCloseCamera}
        busNumber={busNumber}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      <div className="relative flex-1">
        <div
          ref={qrRef}
          id="qr-reader"
          className={`w-full h-full bg-black transition-opacity duration-500 ${
            isInitialized ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        {/* Scanner UI elements remain the same */}
        {/* ... */}

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
              onClick={requestCameraAccess}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
            >
              Allow Camera Access
            </button>
          </div>
        )}

        {scanSuccess && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white p-6 rounded-lg max-w-xs text-center">
            <div className="text-green-400 mb-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="mb-4">Bus number verified: {busNumber}</p>
            <p>Opening camera...</p>
          </div>
        )}
      </div>

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
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
