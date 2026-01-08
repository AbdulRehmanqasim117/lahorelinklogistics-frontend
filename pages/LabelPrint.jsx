import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Barcode from "../components/Barcode.jsx";
import QrCode from "../components/QrCode.jsx";
import { APP_BASE_URL } from "../src/config/env";

const LabelPrint = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState("");
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const load = async () => {
    setError("");
    try {
      const params = new URLSearchParams(location.search);
      const idsParam = params.get("ids");
      if (idsParam) {
        const res = await fetch(
          `/api/orders/labels?ids=${encodeURIComponent(idsParam)}`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load labels");
        setBatch(json.labels || []);
      } else {
        const res = await fetch(`/api/orders/${id}/label`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load label");
        setData(json);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id, location.search]);
  useEffect(() => {
    if (batch && batch.length > 0) {
      setTimeout(() => {
        try {
          window.print();
        } catch {}
      }, 200);
    }
  }, [batch]);
  useEffect(() => {
    return undefined;
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data && !batch) return <div className="p-6">Loading...</div>;

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

  const renderLabel = (labelData) => {
    const orderDate = labelData.order?.createdAt
      ? new Date(labelData.order.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const codAmountRaw = Number(labelData.order?.codAmount || 0);
    const serviceCharges = Number(labelData.order?.serviceCharges || 0);
    const paymentTypeRaw =
      labelData.order?.paymentType || labelData.shipper?.serviceType || "COD";
    const paymentType = String(paymentTypeRaw).toUpperCase();

    // Amount label par sirf COD amount show karna hai (service charges add nahi karne)
    const codComponent = paymentType === "ADVANCE" ? 0 : codAmountRaw;
    const finalAmount = codComponent;
    const rawRemarks = (labelData.order?.remarks || "").trim();
    const remarks =
      rawRemarks || (labelData.order?.fragile ? "FRAGILE - Handle with care" : "");
    const products = labelData.order?.productDescription || "N/A";
    const customerName = labelData.consignee?.name || "N/A";
    const customerPhone = labelData.consignee?.phone || "N/A";
    const customerAddress = labelData.consignee?.address || "N/A";
    const destination = labelData.consignee?.destinationCity || "N/A";
    const bookingId = labelData.bookingId || "N/A";
    const isIntegrated =
      typeof labelData.isIntegrated === "boolean"
        ? labelData.isIntegrated
        : !!labelData.order?.isIntegrated;
    const shopifyOrderNumber =
      labelData.shopifyOrderNumber || labelData.order?.shopifyOrderNumber || null;
    const displayOrderNumber =
      labelData.displayOrderNumber ||
      (isIntegrated ? shopifyOrderNumber || bookingId : bookingId);
    const shipperName = labelData.shipper?.name || "N/A";
    const shipperAddress =
      labelData.shipper?.address || labelData.shipper?.companyName || "N/A";
    const shipperPhone = labelData.shipper?.phone || "N/A";
    const trackingId = labelData.trackingId || "N/A";
    const service = paymentType;
    const weightNumberStr = formatWeight(
      typeof labelData.order?.weightKg !== "undefined" &&
      labelData.order?.weightKg !== null
        ? labelData.order.weightKg
        : labelData.order?.weight
    );
    const weight = weightNumberStr ? `${weightNumberStr} KG` : "N/A";
    const fragile = labelData.order?.fragile ? "true" : "false";
    const pieces = labelData.order?.pieces || 1;
    const warehouseQrValue = `LLL|${bookingId}`;
    const websiteQrValue = APP_BASE_URL;

    return (
      <div className="bg-white text-black w-full max-w-[800px] border-2 border-black box-border shadow-lg mx-auto print:shadow-none">
        {/* Top Section - 3 Columns */}
        <div className="grid grid-cols-12 divide-x-2 divide-black">
          {/* Column 1: Customer Information (Approx 33%) */}
          <div className="col-span-4 flex flex-col">
            <div className="border-b-2 border-black text-center font-bold text-sm py-1">
              Customer Information
            </div>
            <div className="p-2 text-xs leading-snug flex-grow">
              <div className="mb-1">
                <span className="font-bold text-gray-600 mr-1">Name:</span>
                <span className="font-bold">{customerName}</span>
              </div>
              <div className="mb-1">
                <span className="font-bold text-gray-600 mr-1">Phone:</span>
                <span className="font-bold">{customerPhone}</span>
              </div>
              <div className="mb-2">
                <span className="font-bold text-gray-600 mr-1">Address:</span>
                <span>{customerAddress}</span>
              </div>

              <div className="border-t border-black my-1"></div>

              <div className="font-bold text-sm mt-1">
                Destination: {destination}
              </div>

              <div className="border-t border-black my-1"></div>
              <div className="mt-2">
                <span className="font-bold">Order: {displayOrderNumber}</span>
                <div className="mt-1 w-3/4">
                  <Barcode
                    value={String(displayOrderNumber).replace(/[^0-9]/g, "")}
                    height="h-6"
                    showValue={false}
                  />
                </div>
                {bookingId !== "N/A" && (
                  <div className="mt-1 flex justify-center">
                    <QrCode value={warehouseQrValue} size="w-[70px] h-[70px]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Brand Information (Approx 33%) */}
          <div className="col-span-4 flex flex-col">
            <div className="border-b-2 border-black text-center font-bold text-sm py-1">
              Brand Information
            </div>
            <div className="p-2 text-[10px] leading-tight font-condensed">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold">Shipper: {shipperName}</span>
                <span className="font-bold">{shipperPhone}</span>
              </div>
              <div className="mb-2">
                <span className="font-bold mr-1">Shipper Address:</span>
                <span>{shipperAddress}</span>
              </div>
            </div>
            {/* Amount Box */}
            <div className="border-t-2 border-black flex-grow flex flex-col items-center justify-center p-2">
              <div className="font-black text-lg mb-1">
                Amount: Rs {finalAmount.toLocaleString()}
              </div>
              <div className="w-3/4">
                <Barcode
                  value={String(finalAmount).replace(/[^0-9]/g, "")}
                  height="h-8"
                  showValue={false}
                />
              </div>
            </div>
          </div>

          {/* Column 3: Parcel Information (Approx 33%) */}
          <div className="col-span-4 flex flex-col">
            <div className="border-b-2 border-black text-center font-bold text-sm py-1">
              Parcel Information
            </div>

            {/* Logo Section */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-black">
              <div className="flex items-center">
                {/* Company Logo */}
                <img src="/logo.png" alt="Company Logo" className="h-[74px]" />
              </div>
              {/* QR Code for warehouse scanning - Format: LLL|<bookingId> */}
              {bookingId !== "N/A" && (
                <div className="flex flex-col items-center">
                  <QrCode value={websiteQrValue} size="w-[70px] h-[70px]" />
                </div>
              )}
            </div>
            {/* Big Tracking Barcode */}
            <div className="p-2 flex flex-col items-center border-b border-black">
              <div className="w-full">
                <Barcode
                  value={String(trackingId).replace(/[^0-9]/g, "")}
                  height="h-10"
                  className="w-full"
                />
              </div>
            </div>
            {/* Details Grid */}
            <div className="flex-grow text-xs font-bold">
              <div className="p-1 border-b border-black">
                Service: {service}
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="p-1 border-r border-black">
                  Date: {orderDate}
                </div>
                <div className="p-1 text-right">Weight: {weight}</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="p-1 border-r border-black">
                  Fragile: {fragile}
                </div>
                <div className="p-1 text-right">Pieces: {pieces}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Row */}
        <div className="border-t-2 border-black p-1 text-xs">
          <span className="font-bold mr-1">Remarks:</span>
          <span className="font-bold">{remarks ? `- ${remarks}` : ""}</span>
        </div>

        {/* Products Row - reduced height so top sections remain prominent on label */}
        <div className="border-t-2 border-black p-0.5 text-[10px] leading-tight font-condensed h-10 overflow-hidden">
          <span className="font-bold mr-1">Products:</span>
          <span>
            {products !== "N/A"
              ? `[ ${pieces} x ${products} ]`
              : "[Product information not available]"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* Screen */
        .no-print { display: inline-flex; }
        @media print { .no-print { display: none !important; } }

        /* Print: only label content */
        @media print {
          body * { visibility: hidden !important; }
          #label-root, #label-root * { visibility: visible !important; }
          #label-root { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .space-y-6 > * + * { margin-top: 0 !important; }
          .print\\:space-y-0 > * + * { margin-top: 0 !important; }
          .print\\:mb-0 { margin-bottom: 0 !important; }
          .print\\:page-break-after-always { page-break-after: always; }
        }
        @page { size: A4 portrait; margin: 8mm; }
      `}</style>
      <div className="flex justify-between px-6 pt-6">
        <button
          className="no-print px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <button
          className="no-print px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded border border-primary"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>
      <div id="label-root" className="p-8 print:p-0">
        {batch ? (
          <div className="w-full space-y-6 print:space-y-0">
            {batch.map((labelData, idx) => (
              <div
                key={idx}
                className="w-full flex justify-center mb-6 print:mb-0 print:page-break-after-always"
              >
                {renderLabel(labelData)}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full flex justify-center">
            {data && renderLabel(data)}
          </div>
        )}
      </div>
    </>
  );
};

export default LabelPrint;
