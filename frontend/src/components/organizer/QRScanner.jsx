import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { attendanceAPI, eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import { FiCamera, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const QRScanner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanner, setScanner] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Clean up scanner on unmount or when scanning stops
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  // Initialize scanner when scanning starts
  useEffect(() => {
    if (scanning && selectedEvent) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: 250 },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanError);
      setScanner(html5QrcodeScanner);
    }
  }, [scanning, selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getMyEvents();
      const ongoingEvents = response.data.events.filter(
        (e) => e.status === 'ongoing' || e.status === 'published'
      );
      setEvents(ongoingEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const startScanning = () => {
    if (!selectedEvent) {
      alert('Please select an event first');
      return;
    }

    setScanResult(null);
    setScanning(true); // This will trigger the useEffect above
  };

  const onScanSuccess = async (decodedText) => {
    try {
      // Parse QR data
      //const qrData = JSON.parse(decodedText);

      // Mark attendance
      const response = await attendanceAPI.scanQR({
        qrData: decodedText,
        eventId: selectedEvent,
      });

      setScanResult({
        success: true,
        message: 'Attendance marked successfully!',
        data: response.data.attendance,
      });

      // Stop scanner after successful scan
      stopScanning();
    } catch (error) {
      setScanResult({
        success: false,
        message: error.response?.data?.message || 'Invalid QR code or scan failed',
      });
    }
  };

  const onScanError = (error) => {
    // Ignore scanning errors (common when camera is initializing)
    console.log('Scan error:', error);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">QR Scanner</h1>

          {/* Event Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="input"
              disabled={scanning}
            >
              <option value="">-- Select Event --</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name} ({event.currentRegistrations} registered)
                </option>
              ))}
            </select>
          </div>

          {/* Scanner Controls */}
          <div className="mb-6">
            {!scanning ? (
              <button
                onClick={startScanning}
                disabled={!selectedEvent}
                className="btn-primary w-full py-3 flex items-center justify-center disabled:opacity-50"
              >
                <FiCamera className="mr-2" size={20} />
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="btn-secondary w-full py-3 flex items-center justify-center"
              >
                Stop Scanning
              </button>
            )}
          </div>

          {/* QR Scanner Display - This must render BEFORE initializing */}
          {scanning && (
            <div className={`mb-6 ${!scanning ? 'hidden' : ''}`}>
              <div id="qr-reader" className="w-full"></div>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div
              className={`p-4 rounded-lg ${
                scanResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center">
                {scanResult.success ? (
                  <FiCheckCircle className="text-green-600 mr-3" size={24} />
                ) : (
                  <FiXCircle className="text-red-600 mr-3" size={24} />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      scanResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {scanResult.message}
                  </p>
                  {scanResult.success && scanResult.data && (
                    <p className="text-sm text-gray-600 mt-1">
                      Participant: {scanResult.data.participant?.firstName}{' '}
                      {scanResult.data.participant?.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Select the event you want to scan tickets for</li>
              <li>Click "Start Scanning" to activate the camera</li>
              <li>Point the camera at the participant's QR code</li>
              <li>The system will automatically mark attendance</li>
              <li>Each ticket can only be scanned once</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;