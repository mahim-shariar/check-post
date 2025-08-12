import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import FullScreenCamera from "../components/FullScreenCamera";
import {
  FiCamera,
  FiRotateCw,
  FiX,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [busNumber, setBusNumber] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [activeCamera, setActiveCamera] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const hasScannedRef = useRef(false);

  const busNumberPattern = /^\d{2}-\d{2}-\d{3}$/;

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        return devices[0].id; // Return default camera ID
      }
      throw new Error("No cameras found");
    } catch (err) {
      console.error("Camera enumeration error:", err);
      setCameraError("Could not access camera devices");
      return null;
    }
  };

  const startScanner = async (cameraId = null) => {
    if (!qrRef.current) {
      console.error("QR container not available.");
      return;
    }

    setCameraError(null);
    setScanSuccess(false);
    hasScannedRef.current = false;

    try {
      const html5QrCode = new Html5Qrcode(qrRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      const cameraToUse = cameraId || (await getCameras());
      if (!cameraToUse) return;

      setIsScanning(true);
      setIsInitialized(true);
      setActiveCamera(cameraToUse);

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      };

      await html5QrCode.start(
        cameraToUse,
        config,
        (decodedText) => {
          if (busNumberPattern.test(decodedText) && !hasScannedRef.current) {
            hasScannedRef.current = true;
            setBusNumber(decodedText);
            setScanSuccess(true);

            // Play success sound
            playSound("/success-beep.mp3");

            // Stop scanner and open camera
            stopScanner().then(() => {
              setShowCamera(true);
            });
          }
        },
        (errorMessage) => {
          // Optional: Handle scanning errors
        }
      );

      // Check if torch is supported
      if (html5QrCode.isTorchSupported()) {
        // Can show torch button in UI
      }
    } catch (err) {
      console.error("Camera error:", err);
      handleCameraError(err);
      setIsScanning(false);
    }
  };

  const handleCameraError = (error) => {
    let errorMessage = "Failed to access camera. Please check permissions.";

    if (error.message.includes("NotAllowedError")) {
      errorMessage = "Camera access denied. Please allow camera permissions.";
    } else if (error.message.includes("NotFoundError")) {
      errorMessage = "No camera found on this device.";
    } else if (error.message.includes("NotSupportedError")) {
      errorMessage = "Camera not supported in this browser.";
    }

    setCameraError(errorMessage);
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
        if (torchOn) {
          await html5QrCodeRef.current.turnOffTorch();
        } else {
          await html5QrCodeRef.current.turnOnTorch();
        }
        setTorchOn(!torchOn);
      } catch (err) {
        console.error("Torch error:", err);
      }
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length < 2) return;

    const currentIndex = availableCameras.findIndex(
      (cam) => cam.id === activeCamera
    );
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex].id;

    await stopScanner();
    await startScanner(nextCamera);
  };

  const playSound = (soundFile) => {
    if (typeof window !== "undefined") {
      const audio = new Audio(soundFile);
      audio.play().catch((e) => console.log("Audio play error:", e));
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    startScanner(activeCamera);
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
        torchEnabled={torchOn}
        onTorchToggle={toggleTorch}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Scanner View */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={qrRef}
          id="qr-reader"
          className={`w-full h-full bg-black transition-opacity duration-300 ${
            isInitialized ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Scanner UI Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col">
          {/* Top Bar */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="pointer-events-auto">
              {isScanning && (
                <div className="flex items-center bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse" />
                  Scanning...
                </div>
              )}
            </div>
          </div>

          {/* Center Frame */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-square">
              {/* Frame Border */}
              <div className="absolute inset-0 border-4 border-blue-400/80 rounded-xl opacity-90" />

              {/* Corner Indicators */}
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
                />
              ))}

              {/* Scanning Animation */}
              {isScanning && (
                <>
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 left-0 right-0 h-px bg-blue-400/20"
                        style={{
                          top: `${(i * 100) / 20}%`,
                          animation: `scanLine 2s ${i * 0.1}s infinite linear`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex justify-center items-center gap-4 pointer-events-auto">
              {availableCameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-3 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors"
                  title="Switch Camera"
                >
                  <FiRotateCw size={24} />
                </button>
              )}

              <button
                onClick={toggleTorch}
                className={`p-3 rounded-full transition-colors ${
                  torchOn
                    ? "bg-yellow-400/90 text-black"
                    : "bg-black/70 text-white hover:bg-black/90"
                }`}
                title={torchOn ? "Turn off Flash" : "Turn on Flash"}
                disabled={!html5QrCodeRef.current?.isTorchSupported()}
              >
                <FiCamera size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="max-w-md text-center">
              <div className="text-red-400 mb-4">
                <FiAlertCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Camera Error
              </h3>
              <p className="text-gray-300 mb-6">{cameraError}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={startScanner}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex items-center gap-2"
                >
                  <FiRotateCw /> Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {scanSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="max-w-md text-center animate-fade-in">
              <div className="text-green-400 mb-4">
                <FiCheck size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                Scan Successful
              </h3>
              <p className="text-gray-300 mb-1">Bus Number:</p>
              <p className="text-2xl font-bold text-white mb-6">{busNumber}</p>
              <p className="text-blue-300 animate-pulse">Preparing camera...</p>
            </div>
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
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
