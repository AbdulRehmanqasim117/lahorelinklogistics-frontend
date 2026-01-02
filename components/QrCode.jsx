import React from 'react';
import QRCode from 'react-qr-code';

const QrCode = ({ value, size = "w-8 h-8" }) => {
  if (!value) return null; // Agar koi value nahi hai toh QR code render na karein

  return (
    <div className={`${size} flex items-center justify-center bg-white p-1`}>
      <QRCode
        value={value}
        size={256} // Default size, CSS se adjust hoga
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        viewBox={`0 0 256 256`}
      />
    </div>
  );
};

export default QrCode;

