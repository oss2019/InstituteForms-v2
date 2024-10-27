import React, { useState, useEffect } from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library";

const BarcodeScanner = ({ onScan, onScanAgain }) => {
  const [result, setResult] = useState(null);
  const [videoDevice, setVideoDevice] = useState(null);
  const [scanning, setScanning] = useState(true); // Track scanning state

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    async function init() {
      try {
        const videoDevices = await reader.listVideoInputDevices();
        
        if (videoDevices.length > 0) {
          setVideoDevice(videoDevices[0]); // Use the first available video device
        }
      } catch (error) {
        console.error("Error listing video devices:", error);
      }
    }

    init();

    // Cleanup function for reader
    return () => {
      reader.reset(); // Ensure that the reader is reset when the component unmounts
    };
  }, []);

  useEffect(() => {
    const videoElement = document.getElementById('video');
    const reader = new BrowserMultiFormatReader();

    if (videoDevice && scanning) {
      reader.decodeFromVideoDevice(videoDevice.deviceId, videoElement, (result) => {
        if (result) {
          // Check if the result format is a barcode format
          if (
            result.format === BarcodeFormat.CODE_39 ||
            result.format === BarcodeFormat.CODE_128 ||
            result.format === BarcodeFormat.EAN_13 ||
            result.format === BarcodeFormat.EAN_8 ||
            result.format === BarcodeFormat.UPC_A ||
            result.format === BarcodeFormat.UPC_E ||
            result.format === BarcodeFormat.ITF
          ) {
            setResult(result.text);
            onScan(result.text); // Send the scanned result to the parent component
            setScanning(false); // Stop scanning after a successful scan
            reader.reset(); // Stop the reader
          }
        }
      }, {
        // Set the formats to only decode the desired barcode formats
        formats: [
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
        ],
      });

      // Cleanup function to stop the video stream when the videoDevice changes or scanning stops
      return () => {
        reader.reset(); // Stop the reader when cleaning up
      };
    }
  }, [videoDevice, scanning]);

  const handleScanAgain = () => {
    setResult(null); // Reset the result
    setScanning(true); // Start scanning again
    onScanAgain(); // Call the scan again function from props
  };

  return (
    <div>
      {result ? (
        <div>
          <p>Scanned Code: {result}</p>
          <button onClick={handleScanAgain}>Scan Again</button> {/* Button to scan again */}
        </div>
      ) : (
        <p>Scanning...</p>
      )}
      <video id="video" width="600" height="400" autoPlay />
    </div>
  );
};

export default BarcodeScanner;
