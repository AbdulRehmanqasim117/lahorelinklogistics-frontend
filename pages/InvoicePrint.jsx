import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../src/contexts/AuthContext";

const InvoicePrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyProfile, setCompanyProfile] = useState(null);

  const token = localStorage.getItem("token");

  const handleBack = () => {
    // If this window was opened from another page (e.g. ManagerInvoice), prefer closing it
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    // If there is actual browser history, go back
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    // Fallback: navigate to appropriate invoice list based on role
    if (user?.role === "CEO") {
      navigate("/ceo/finance/invoice");
    } else if (user?.role === "MANAGER") {
      navigate("/manager/finance/invoice");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
    loadCompanyProfile();
  }, [id]);

  useEffect(() => {
    // Auto-print when invoice loads
    if (invoice && !loading) {
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error("Print failed:", e);
        }
      }, 500);
    }
  }, [invoice, loading]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoice/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to load invoice");
      }

      const data = await res.json();
      setInvoice(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyProfile = async () => {
    try {
      const res = await fetch("/api/company-profile/public");
      const data = await res.json();

      if (res.ok && data.success) {
        setCompanyProfile(data.data);
      } else {
        // Set default fallback
        setCompanyProfile({
          companyName: "LahoreLink Courier Services",
          logoUrl: "",
          address: {
            line1: "Office # 123, Main Boulevard, Gulberg III",
            city: "Lahore",
            country: "Pakistan",
          },
          phone: "+92-42-111-LINK (5465)",
          email: "finance@lahorelink.com",
          website: "www.lahorelink.com",
          footerNote:
            "For support contact: +92-42-111-LINK (5465) | Email: support@lahorelink.com",
        });
      }
    } catch (error) {
      console.error("Error loading company profile:", error);
      // Set default fallback on error
      setCompanyProfile({
        companyName: "LahoreLink Courier Services",
        logoUrl: "",
        address: {
          line1: "Office # 123, Main Boulevard, Gulberg III",
          city: "Lahore",
          country: "Pakistan",
        },
        phone: "+92-42-111-LINK (5465)",
        email: "finance@lahorelink.com",
        website: "www.lahorelink.com",
        footerNote:
          "For support contact: +92-42-111-LINK (5465) | Email: support@lahorelink.com",
      });
    }
  };

  const formatCurrency = (amount) => {
    return `PKR ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            {error || "Invoice not found"}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const codTotalValue = invoice.codTotal || 0;
  const serviceChargesValue =
    (invoice.serviceChargesTotal != null
      ? invoice.serviceChargesTotal
      : invoice.flyerChargesTotal) || 0;
  const whtItValue = invoice.whtIt || 0;
  const whtStValue = invoice.whtSt || 0;
  const computedNet =
    codTotalValue + serviceChargesValue - whtItValue - whtStValue;
  const netPayableValue =
    invoice.netPayable != null ? invoice.netPayable : computedNet;

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-page {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
          @page { size: A4; margin: 15mm; }
        }
        .invoice-table th, .invoice-table td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        .invoice-table {
          border-collapse: collapse;
          width: 100%;
        }
      `}</style>

      <div className="no-print flex justify-between items-center p-4 bg-white border-b">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded"
        >
          Print Invoice
        </button>
      </div>

      <div className="print-page max-w-4xl mx-auto bg-white p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <img
                src={companyProfile?.logoUrl || "/logo.png"}
                alt={companyProfile?.companyName || "Company Logo"}
                className="w-32 h-16 object-contain"
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <div>Email: {companyProfile?.email || "info@lahorelink.com"}</div>
              {companyProfile?.website && (
                <div>Website: {companyProfile.website}</div>
              )}
              <div>
                Phone: {companyProfile?.phone || "+92-42-111-LINK (5465)"}
              </div>
              <div>
                Address:{" "}
                {companyProfile?.address
                  ? `${companyProfile.address.line1}, ${companyProfile.address.city}, ${companyProfile.address.country}`
                  : "Lahore, Pakistan"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              Inv.No# {invoice.invoiceNumber}
            </div>
            <div className="text-sm text-gray-600">
              Date: {formatDate(invoice.invoiceDate)}
            </div>
          </div>
        </div>

        {/* Customer & Invoice Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Bill To:
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Account Name:</strong> {invoice.accountName}
              </div>
              {invoice.accountNumber && (
                <div>
                  <strong>Account Number:</strong> {invoice.accountNumber}
                </div>
              )}
              <div>
                <strong>Customer:</strong>{" "}
                {invoice.shipper?.companyName || invoice.shipper?.name}
              </div>
              {invoice.shipper?.address && (
                <div>
                  <strong>Address:</strong> {invoice.shipper.address}
                </div>
              )}
              {invoice.shipper?.email && (
                <div>
                  <strong>Email:</strong> {invoice.shipper.email}
                </div>
              )}
              {invoice.shipper?.phone && (
                <div>
                  <strong>Phone:</strong> {invoice.shipper.phone}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Invoice Details:
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Invoice Date:</strong> {formatDate(invoice.invoiceDate)}
              </div>
              <div>
                <strong>Period:</strong> {formatDate(invoice.parcelFrom)} -{" "}
                {formatDate(invoice.parcelTo)}
              </div>
              <div>
                <strong>Total Orders:</strong> {invoice.orders?.length || 0}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span className="text-green-600 font-medium">
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Order Details:
          </h3>
          <table className="invoice-table text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th>CN/Booking ID</th>
                <th>Date</th>
                <th>Consignee</th>
                <th>Destination</th>
                <th>Weight (kg)</th>
                <th className="text-right">COD Amount</th>
                <th className="text-right">Service Charges</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoice.orders?.map((order) => (
                <tr key={order._id}>
                  <td className="font-mono text-xs">{order.bookingId}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.consigneeName}</td>
                  <td>{order.destinationCity}</td>
                  <td>{order.weightKg}</td>
                  <td className="text-right">
                    {formatCurrency(order.codAmount)}
                  </td>
                  <td className="text-right">
                    {formatCurrency(order.serviceCharges)}
                  </td>
                  <td>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!invoice.orders || invoice.orders.length === 0) && (
                <tr>
                  <td colSpan="8" className="text-center text-gray-500 py-4">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">COD Total:</span>
                <span className="font-medium">
                  {formatCurrency(codTotalValue)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Service Charges:</span>
                <span className="font-medium">
                  {formatCurrency(serviceChargesValue)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">
                  WHT IT u/s 6A of ITO, 2001 (2.0%):
                </span>
                <span className="font-medium">
                  {formatCurrency(whtItValue)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">
                  WHT ST u/s 3 of STA, 1990 (2.0%):
                </span>
                <span className="font-medium">
                  {formatCurrency(whtStValue)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-gray-400 mt-4">
                <span className="text-lg font-bold text-gray-900">
                  Net Payable:
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(netPayableValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold text-gray-900 mb-2">
              Contact Information:
            </h4>
            <p>For any queries regarding this invoice, please contact:</p>
            <p>Email: {companyProfile?.email || "finance@lahorelink.com"}</p>
            <p>Phone: {companyProfile?.phone || "+92-42-111-LINK (5465)"}</p>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            {companyProfile?.footerNote && (
              <p className="mb-2">{companyProfile.footerNote}</p>
            )}
            <p>This is a computer generated invoice. No signature required.</p>
            <p>
              Generated on {new Date().toLocaleDateString()} by{" "}
              {companyProfile?.companyName || "LahoreLink Logistics"} Management
              System
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePrint;
