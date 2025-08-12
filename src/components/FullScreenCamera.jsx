import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { FaCamera, FaRedo, FaCheck, FaTimes } from "react-icons/fa";

const FullScreenCamera = ({ onPhotoTaken, onClose, busNumber }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Check and request camera permissions
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        // Check if we already have permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasPermissions = devices.some(
          (device) => device.kind === "videoinput" && device.label
        );

        if (!hasPermissions) {
          // Request permission by trying to access the camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((track) => track.stop());
        }

        setHasCameraPermission(true);
        setCameraError(null);
      } catch (err) {
        console.error("Camera permission error:", err);
        setCameraError(err);
        setHasCameraPermission(false);
      }
    };

    checkCameraPermissions();
  }, []);

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
      console.error("Upload error:", error);
      setUploadError(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Video constraints for the camera
  const videoConstraints = {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  };

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
        <>
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-4 text-center z-20">
              <div className="bg-red-500 rounded-full p-4 mb-4">
                <FaTimes className="text-2xl" />
              </div>
              <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
              <p className="mb-4 text-gray-300 max-w-md">
                Please allow camera permissions to verify the bus. Refresh the
                page and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                Refresh Page
              </button>
            </div>
          ) : hasCameraPermission ? (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
              forceScreenshotSourceSize={true}
              onUserMedia={() => setHasCameraPermission(true)}
              onUserMediaError={(err) => {
                console.error("Webcam error:", err);
                setCameraError(err);
                setHasCameraPermission(false);
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
              <p>Requesting camera access...</p>
            </div>
          )}
        </>
      )}

      {/* Upload status messages */}
      {uploadSuccess ? (
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
          </div>
        </div>
      ) : uploadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center z-20">
          <div className="bg-red-500 rounded-full p-4 mb-4">
            <FaTimes className="text-2xl" />
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
      ) : (
        /* Camera controls - only show if we have camera permission and no error */
        hasCameraPermission &&
        !cameraError && (
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
        )
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
