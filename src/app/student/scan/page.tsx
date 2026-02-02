"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function StudentScanPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Check Location Permission usage roughly or just wait for scan
  }, []);

  const calculateLocation = (): Promise<{lat: number, lng: number}> => {
      return new Promise((resolve, reject) => {
          if (!navigator.geolocation) reject("Geolocation not supported");
          navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => reject(err.message),
              { enableHighAccuracy: true }
          );
      });
  };

  const handleScanSuccess = async (decodedText: string) => {
      // Pause scanner logic would go here if managing instance directly
      // With Html5QrcodeScanner it continues unless cleared. 
      // We should ideally stop scanning.
      // For now, let's just ignore subsequent scans or handle one.
      if (scanning) return; 
      setScanning(true);
      setError("");

      try {
          // Decode payload if possible to double check format, but we just send it.
          let token = "";
          try {
              const parsed = JSON.parse(decodedText);
              token = parsed.t; // Our format is { t: token, s: site, e: expires }
          } catch {
              token = decodedText; // Fallback if raw token
          }

          if (!token) throw new Error("Invalid QR Code format");

          const loc = await calculateLocation();
          
          const res = await fetch("/api/mobile/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  qrToken: token,
                  lat: loc.lat,
                  lng: loc.lng
              })
          });

          const data = await res.json();
          setScanResult(data);
          
      } catch (err: any) {
          setError(err.message || "Scan failed");
      } finally {
          setScanning(false);
          // Stop scanner? We need reference to logic.
          // In simple UI, we can just hide the container.
          const element = document.getElementById("reader");
          if(element) element.style.display = "none";
      }
  };

  const startScanner = () => {
      setScanResult(null);
      setError("");
      setPermissionGranted(true);
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        scanner.render(handleScanSuccess, (err) => {
            // console.warn(err); // Ignore frame errors
        });
      }, 100);
      
      const element = document.getElementById("reader");
      if(element) element.style.display = "block";
  };
  
  const reset = () => {
      window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary">Attendance Scan</h1>

        {!permissionGranted && !scanResult && (
             <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="w-32 h-32 bg-[#291934] rounded-full flex items-center justify-center mb-8 animate-pulse">
                      <span className="material-symbols-outlined text-6xl text-primary">qr_code_scanner</span>
                 </div>
                 <p className="text-center text-gray-400 mb-8 max-w-xs">
                     Ensure you are within the classroom range and have your GPS enabled.
                 </p>
                 <button 
                    onClick={startScanner}
                    className="bg-primary w-full max-w-xs py-4 rounded-xl font-bold shadow-lg shadow-primary/20"
                 >
                     Start Scanner
                 </button>
             </div>
        )}

        <div id="reader" className="rounded-xl overflow-hidden mb-6"></div>

        {scanning && (
            <div className="text-center py-4">
                <p className="text-primary font-bold animate-pulse">Validating...</p>
            </div>
        )}

        {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <h3 className="text-red-500 font-bold text-xl mb-1">Scan Failed</h3>
                <p className="text-gray-300">{error}</p>
                <button onClick={reset} className="mt-4 bg-[#291934] text-white px-6 py-2 rounded-lg text-sm">Try Again</button>
            </div>
        )}

        {scanResult && (
            <div className={`border rounded-xl p-8 text-center ${scanResult.ok ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                {scanResult.ok ? (
                    <>
                        <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                        <h2 className="text-2xl font-bold text-green-500 mb-2">{scanResult.status === "LATE" ? "Late Attendance" : "On Time!"}</h2>
                        <p className="text-white text-lg mb-1">{scanResult.siteName}</p>
                        <p className="text-gray-400 text-sm mb-4">Recorded at {scanResult.arrivalTime}</p>
                        
                        {scanResult.status === "LATE" && (
                            <p className="text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded mb-4">You arrived after the tolerance period.</p>
                        )}
                    </>
                ) : (
                    <>
                         <span className="material-symbols-outlined text-6xl text-red-500 mb-4">cancel</span>
                         <h2 className="text-2xl font-bold text-red-500 mb-2">Check-in Rejected</h2>
                         <p className="text-white mb-4">{scanResult.message}</p>
                         {scanResult.distance && (
                             <p className="text-gray-400 text-xs">Distance check failed</p>
                         )}
                    </>
                )}
                <button onClick={reset} className="mt-4 bg-black/20 hover:bg-black/40 text-white px-8 py-3 rounded-lg font-bold">Done</button>
            </div>
        )}
    </div>
  );
}
