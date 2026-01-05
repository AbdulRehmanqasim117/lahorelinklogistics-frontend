import React from "react";
import Barcode from "./Barcode.jsx";

/**
 * Professional Shipping Label Component
 * Designed for thermal printing (4x6 label format)
 * Based on industry standards (Leopard Courier, TCS, PostEx style)
 */
const ShippingLabel = ({ orderData }) => {
  // Extract data with fallbacks
  const customer = {
    name: orderData?.consigneeName || orderData?.consignee?.name || "N/A",
    phone: orderData?.consigneePhone || orderData?.consignee?.phone || "N/A",
    address:
      orderData?.consigneeAddress || orderData?.consignee?.address || "N/A",
    destination:
      orderData?.destinationCity ||
      orderData?.consignee?.destinationCity ||
      "N/A",
    orderNumber: orderData?.bookingId || orderData?.order?.bookingId || "N/A",
  };

  const shipper = {
    name: orderData?.shipperName || orderData?.shipper?.name || "N/A",
    address: orderData?.shipperAddress || orderData?.shipper?.address || "N/A",
    phone: orderData?.shipperPhone || orderData?.shipper?.phone || "N/A",
  };

  const formatWeight = (raw) => {
    if (raw === null || typeof raw === "undefined") return null;
    const num = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (!Number.isFinite(num) || num <= 0) return null;
    const rounded = Math.round(num * 100) / 100;
    return rounded
      .toFixed(2)
      .replace(/\.0+$/, "")
      .replace(/\.([1-9])0$/, ".$1");
  };

  const parcel = {
    courier: orderData?.courier || "Active Courier",
    trackingId: orderData?.trackingId || orderData?.order?.trackingId || "N/A",
    service: orderData?.serviceType || orderData?.order?.serviceType || "COD",
    date:
      orderData?.date || orderData?.order?.createdAt
        ? new Date(orderData.order.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    weight: (() => {
      const weightNumberStr = formatWeight(
        typeof orderData?.weightKg !== "undefined" && orderData?.weightKg !== null
          ? orderData.weightKg
          : (typeof orderData?.order?.weightKg !== "undefined" && orderData?.order?.weightKg !== null
              ? orderData.order.weightKg
              : (orderData?.weight || orderData?.order?.weight))
      );
      return weightNumberStr ? `${weightNumberStr} KG` : "N/A";
    })(),
    fragile:
      orderData?.fragile !== undefined
        ? orderData.fragile
        : orderData?.order?.fragile || false,
    pieces: orderData?.pieces || orderData?.order?.pieces || 1,
  };

  const codAmountRaw = Number(
    orderData?.codAmount ?? orderData?.order?.codAmount ?? 0,
  );
  const serviceCharges = Number(
    orderData?.serviceCharges ?? orderData?.order?.serviceCharges ?? 0,
  );
  const paymentTypeRaw =
    orderData?.paymentType ||
    orderData?.order?.paymentType ||
    orderData?.serviceType ||
    orderData?.order?.serviceType ||
    parcel.service ||
    "COD";
  const paymentType = String(paymentTypeRaw).toUpperCase();

  const codComponent = paymentType === "ADVANCE" ? 0 : codAmountRaw;
  const finalAmount = codComponent;
  const remarks =
    orderData?.remarks ||
    orderData?.order?.remarks ||
    "Allow to open in front of rider";
  const products = orderData?.products || orderData?.order?.products || [];

  return (
    <div className="shipping-label">
      <style>{`
        .shipping-label {
          width: 4in;
          max-width: 4in;
          min-height: 6in;
          padding: 8px;
          font-family: 'Arial', 'Helvetica', sans-serif;
          background: white;
          color: black;
          box-sizing: border-box;
          border: 2px solid #000;
        }

        .label-header {
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }

        .label-section {
          border: 1px solid #333;
          padding: 6px;
          margin-bottom: 6px;
          background: #fafafa;
        }

        .section-title {
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
          margin-bottom: 4px;
        }

        .label-row {
          font-size: 9px;
          line-height: 1.3;
          margin: 2px 0;
        }

        .label-row strong {
          font-weight: bold;
        }

        .barcode-container {
          margin: 4px 0;
          text-align: center;
          padding: 4px;
          background: white;
          border: 1px solid #ccc;
        }

        .barcode-placeholder {
          width: 100%;
          height: 40px;
          border: 1px dashed #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #666;
          background: #f5f5f5;
        }

        .qr-placeholder {
          width: 60px;
          height: 60px;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7px;
          text-align: center;
          background: white;
        }

        .logo-placeholder {
          width: 80px;
          height: 30px;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
          background: white;
        }

        .three-column {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 6px;
        }

        .amount-highlight {
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          padding: 4px;
          background: white;
          border: 2px solid #000;
        }

        .products-list {
          font-size: 8px;
          line-height: 1.4;
        }

        .product-item {
          margin: 2px 0;
          padding-left: 8px;
        }

        @media print {
          .shipping-label {
            width: 4in;
            height: 6in;
            page-break-inside: avoid;
            margin: 0;
            padding: 8px;
          }

          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* Header with Courier Logo */}
      <div className="label-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="logo-placeholder">[COURIER LOGO HERE]</div>
          <div style={{ fontSize: "10px", fontWeight: "bold" }}>
            {parcel.courier}
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="three-column">
        {/* Customer Information Column */}
        <div className="label-section">
          <div className="section-title">Customer Information</div>
          <div className="label-row">
            <strong>Name:</strong> {customer.name}
          </div>
          <div className="label-row">
            <strong>Phone:</strong> {customer.phone}
          </div>
          <div className="label-row">
            <strong>Address:</strong> {customer.address}
          </div>
          <div className="label-row">
            <strong>Destination:</strong> {customer.destination}
          </div>
          <div className="label-row">
            <strong>Order:</strong> {customer.orderNumber}
          </div>
          <div className="barcode-container">
            <div className="barcode-placeholder">[BARCODE HERE]</div>
            <div style={{ fontSize: "7px", marginTop: "2px" }}>
              {customer.orderNumber}
            </div>
          </div>
          <div style={{ marginTop: "4px", textAlign: "center" }}>
            <div className="qr-placeholder">[QR CODE HERE]</div>
          </div>
        </div>

        {/* Brand/Shipper Information Column */}
        <div className="label-section">
          <div className="section-title">Brand Information</div>
          <div className="label-row">
            <strong>Shipper:</strong> {shipper.name}
          </div>
          <div className="label-row">
            <strong>Address:</strong> {shipper.address}
          </div>
          <div className="label-row">
            <strong>Phone:</strong> {shipper.phone}
          </div>
          <div className="amount-highlight">
            <div style={{ fontSize: "9px" }}>Amount</div>
            <div>Rs {Number(finalAmount).toLocaleString()}</div>
          </div>
          <div className="barcode-container">
            <div className="barcode-placeholder">[COD BARCODE HERE]</div>
            <div style={{ fontSize: "7px", marginTop: "2px" }}>
              Rs {Number(finalAmount).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Parcel Information Column */}
        <div className="label-section">
          <div className="section-title">Parcel Information</div>
          <div className="label-row">
            <strong>Courier:</strong> {parcel.courier}
          </div>
          <div className="barcode-container">
            <Barcode
              value={String(parcel.trackingId).replace(/[^0-9]/g, "")}
              height={35}
              barWidth={1}
              targetWidth={120}
            />
            <div
              style={{ fontSize: "8px", marginTop: "2px", fontWeight: "bold" }}
            >
              {parcel.trackingId}
            </div>
          </div>
          <div className="label-row">
            <strong>Service:</strong> {parcel.service}
          </div>
          <div className="label-row">
            <strong>Date:</strong> {parcel.date}
          </div>
          <div className="label-row">
            <strong>Weight:</strong> {parcel.weight}
          </div>
          <div className="label-row">
            <strong>Fragile:</strong> {parcel.fragile ? "true" : "false"}
          </div>
          <div className="label-row">
            <strong>Pieces:</strong> {parcel.pieces}
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="label-section">
        <div className="section-title">Remarks</div>
        <div className="label-row">{remarks}</div>
      </div>

      {/* Products Section */}
      <div className="label-section">
        <div className="section-title">Products</div>
        <div className="products-list">
          {products.length > 0 ? (
            products.map((product, idx) => (
              <div key={idx} className="product-item">
                [{product.quantity || 1} x{" "}
                {product.name || product.description || "Product"} -{" "}
                {product.sku || product.code || ""}]
              </div>
            ))
          ) : (
            <div className="product-item">
              [Product information not available]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingLabel;
