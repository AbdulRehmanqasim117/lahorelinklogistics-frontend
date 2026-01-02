import React from 'react';
import ShippingLabel from '../components/ShippingLabel.jsx';

/**
 * Demo page showing the shipping label with sample data from the provided image
 */
const LabelDemo = () => {
  // Sample data matching the image provided
  const sampleOrderData = {
    consigneeName: 'Tanzeela Naci',
    consigneePhone: '0336246312',
    consigneeAddress: 'C 25 block 9 gulshan e Iqbal karachi-021-',
    destinationCity: 'Karachi',
    bookingId: '14764',
    
    shipperName: 'NEON COTHING',
    shipperAddress: 'PLOT NO.1, GHAZNAVI STREET NEAR SHER E RABANI CHOWK KATCHI KOTHI STOP RAIWIND ROAD LAHORE.',
    shipperPhone: '04235232866',
    
    courier: 'Active Courier',
    trackingId: '1110528',
    serviceType: 'COD',
    date: '2025-10-13',
    weight: '0.5 KG',
    fragile: true,
    pieces: 3,
    
    codAmount: 9997,
    remarks: 'Allow to open infront of rider',
    
    products: [
      { quantity: 1, name: 'Woven Collar Sweater', sku: '1-2 Y-BSWT20-W25' },
      { quantity: 1, name: 'Zipper Hoodie', sku: '1-2 Y-BH08W25' },
      { quantity: 1, name: 'Stripper Sweater', sku: '1-2 Y-BSWT28-W25' }
    ]
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .label-container, .label-container * { visibility: visible !important; }
          .label-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 0; 
          }
          .no-print { display: none !important; }
        }
        @page {
          size: 4in 6in;
          margin: 0;
        }
      `}</style>
      
      <div className="no-print" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Shipping Label Preview</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Professional shipping label design - optimized for thermal printing (4x6 inches)
        </p>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Print Label
        </button>
      </div>

      <div className="label-container">
        <ShippingLabel orderData={sampleOrderData} />
      </div>

      <div className="no-print" style={{ 
        marginTop: '30px', 
        maxWidth: '600px',
        padding: '15px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Label Features:</h2>
        <ul style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
          <li>✅ Three-column layout (Customer | Brand | Parcel)</li>
          <li>✅ Professional borders and spacing</li>
          <li>✅ Barcode placeholders (ready for integration)</li>
          <li>✅ QR code placeholder</li>
          <li>✅ Courier logo placeholder</li>
          <li>✅ Print-optimized for 4x6 thermal labels</li>
          <li>✅ Black & white design (cost-effective printing)</li>
          <li>✅ Clear section separation</li>
          <li>✅ Products list with SKU codes</li>
          <li>✅ Remarks section</li>
        </ul>
      </div>
    </div>
  );
};

export default LabelDemo;

