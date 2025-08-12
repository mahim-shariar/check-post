import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import {
  FaCamera,
  FaRedo,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";

const FullScreenCamera = ({ onPhotoTaken, onClose, busNumber }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraSupported, setIsCameraSupported] = useState(true);

  // Check camera permission and support
  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if browser supports media devices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsCameraSupported(false);
          return;
        }

        // Check camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setHasPermission(true);
        // Clean up
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        if (err.name === "NotAllowedError") {
          setHasPermission(false);
        } else if (
          err.name === "NotFoundError" ||
          err.name === "OverconstrainedError"
        ) {
          setIsCameraSupported(false);
        } else {
          console.error("Camera error:", err);
          setIsCameraSupported(false);
        }
      }
    };

    checkCamera();
  }, []);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      console.error("Permission request failed:", err);
      return false;
    }
    setHasPermission(true);
    return true;
  };

  const capture = () => {
    if (!webcamRef.current) return;

    setFlashEffect(true);
    setTimeout(() => {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      setFlashEffect(false);
    }, 200);
  };

  const retake = () => {
    setImgSrc(null);
    setUploadSuccess(false);
    setUploadError(false);
  };

  const savePhoto = async () => {
    if (!imgSrc) return;

    setIsUploading(true);
    try {
      const success = await onPhotoTaken(imgSrc);
      if (success) {
        setUploadSuccess(true);
      } else {
        setUploadError(true);
      }
    } catch (error) {
      setUploadError(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Camera not supported
  if (!isCameraSupported) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-red-500 rounded-full p-4 mb-4">
          <FaExclamationTriangle className="text-2xl" />
        </div>
        <h2 className="text-xl font-bold mb-2">Camera Not Available</h2>
        <p className="mb-6 text-gray-300">
          Your device doesn't have a camera or it's not supported.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-yellow-500 rounded-full p-4 mb-4">
          <FaExclamationTriangle className="text-2xl" />
        </div>
        <h2 className="text-xl font-bold mb-2">Camera Permission Required</h2>
        <p className="mb-6 text-gray-300">
          Please enable camera permissions in your browser settings to use this
          feature.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={requestPermission}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Permission not determined yet (loading)
  if (hasPermission === null) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-gray-300">Checking camera permissions...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Flash effect when capturing */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white animate-flash"></div>
      )}

      {/* Bus number display */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="px-4 py-2 bg-black bg-opacity-70 rounded-full text-white text-sm">
          Bus: {busNumber}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white"
        aria-label="Close camera"
      >
        <FaTimes className="text-xl" />
      </button>

      {/* Camera preview or captured image */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="Captured bus"
          className="w-full h-full object-cover"
        />
      ) : (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }}
          className="w-full h-full object-cover"
        />
      )}

      {/* Upload success message */}
      {uploadSuccess && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center z-20">
          <div className="bg-green-500 rounded-full p-4 mb-4">
            <FaCheck className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Complete!</h2>
          <p className="mb-4 text-gray-300">
            Bus {busNumber} has been successfully verified.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            >
              Done
            </button>
            <button
              onClick={retake}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
            >
              Take Another
            </button>
          </div>
        </div>
      )}

      {/* Upload error message */}
      {uploadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center z-20">
          <div className="bg-red-500 rounded-full p-4 mb-4">
            <FaExclamationTriangle className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Upload Failed</h2>
          <p className="mb-4 text-gray-300">
            Could not verify bus. Please try again.
          </p>
          <button
            onClick={retake}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Camera controls */}
      {!uploadSuccess && !uploadError && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
          {imgSrc ? (
            <div className="flex gap-6 bg-black bg-opacity-40 backdrop-blur-sm rounded-full p-3">
              <button
                onClick={retake}
                className="flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all"
                aria-label="Retake photo"
                disabled={isUploading}
              >
                <FaRedo className="text-black text-xl" />
              </button>

              <button
                onClick={savePhoto}
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full p-4 transition-all"
                aria-label="Save photo"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <FaCheck className="text-white text-xl" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={capture}
              className="relative h-16 w-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-all flex items-center justify-center"
              aria-label="Take photo"
            >
              <FaCamera className="text-white text-xl" />
            </button>
          )}
        </div>
      )}

      {/* Flash animation style */}
      <style jsx global>{`
        @keyframes flash {
          0% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-flash {
          animation: flash 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FullScreenCamera;
