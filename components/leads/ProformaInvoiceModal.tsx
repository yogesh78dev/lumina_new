import React, { useMemo, useState } from "react";
import { Lead } from "../../types";
import { useCrm } from "../../hooks/useCrm";

interface ProformaInvoiceModalProps {
  lead: Lead;
  onBack?: () => void;
}

const KOTAK_PAYMENT_QR = "/assets/proforma-kotak-qr.jpg";
const UNION_PAYMENT_QR = "/assets/proforma-union-qr.jpg";
const DEFAULT_LOGO_URL = "https://www.luminainfotech.com/assets/img/logo.svg";
const DEFAULT_HANDLING_TAX_PERCENT = "18";
const DEFAULT_TCS_PERCENT = "5";

const chargeLabels = {
  serviceCharge: "Description of Goods & Services Charges",
  handlingCharges: "Handling Charges",
  otherCharges: "Other",
} as const;

type ChargeKey = keyof typeof chargeLabels;

const formatAmount = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2 });

const ProformaInvoiceModal: React.FC<ProformaInvoiceModalProps> = ({
  lead,
  onBack,
}) => {
  const { companyDetails } = useCrm();
  const [serviceName, setServiceName] = useState(lead.service || "");
  const [charges, setCharges] = useState<Record<ChargeKey, string>>({
    serviceCharge: "",
    handlingCharges: "",
    otherCharges: "",
  });
  const [quantities, setQuantities] = useState<Record<ChargeKey, string>>({
    serviceCharge: "1",
    handlingCharges: "1",
    otherCharges: "1",
  });
  const [handlingTaxPercent, setHandlingTaxPercent] = useState(
    DEFAULT_HANDLING_TAX_PERCENT,
  );
  const [tcsPercent, setTcsPercent] = useState(DEFAULT_TCS_PERCENT);
  const [gstRegistration, setGstRegistration] = useState<
    "registered" | "unregistered"
  >("unregistered");
  const [gstNumber, setGstNumber] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");

  const proformaNumber = useMemo(() => {
    const idPart =
      String(lead.id).replace(/\D/g, "").slice(-6) || String(lead.id);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `PFI-${stamp}-${idPart}`;
  }, [lead.id]);

  const chargeItems = useMemo(() => {
    return (Object.keys(chargeLabels) as ChargeKey[]).map((key) => {
      const rate = Number(charges[key] || 0);
      const quantity = Number(quantities[key] || 0);
      const safeRate = Number.isFinite(rate) ? rate : 0;
      const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
      return {
        key,
        label: chargeLabels[key],
        rate: safeRate,
        quantity: safeQuantity,
        amount: safeRate * safeQuantity,
      };
    });
  }, [charges, quantities]);

  const totalAmount = useMemo(
    () => chargeItems.reduce((sum, item) => sum + item.amount, 0),
    [chargeItems],
  );
  const additionalChargesTaxAmount = useMemo(() => {
    const handlingCharge =
      chargeItems.find((item) => item.key === "handlingCharges")?.amount || 0;
    const otherCharge =
      chargeItems.find((item) => item.key === "otherCharges")?.amount || 0;
    const taxPercent = Number(handlingTaxPercent || 0);
    if (!Number.isFinite(taxPercent)) return 0;
    return (handlingCharge + otherCharge) * (taxPercent / 100);
  }, [chargeItems, handlingTaxPercent]);
  const totalAfterTax = totalAmount + additionalChargesTaxAmount;
  const tcsAmount = useMemo(() => {
    const percent = Number(tcsPercent || 0);
    if (!Number.isFinite(percent)) return 0;
    return totalAfterTax * (percent / 100);
  }, [tcsPercent, totalAfterTax]);
  const grandTotal = totalAfterTax + tcsAmount;
  const displayGstNumber =
    gstRegistration === "registered" ? gstNumber.trim() || "N/A" : "N/A";
  const logoUrl = companyDetails.logoUrl || DEFAULT_LOGO_URL;

  const handlePrint = () => {
    window.print();
  };

  const handleChargeChange = (key: ChargeKey, value: string) => {
    setCharges((prev) => ({ ...prev, [key]: value }));
  };

  const handleQuantityChange = (key: ChargeKey, value: string) => {
    setQuantities((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Generate Proforma Invoice
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and print a proforma invoice for {lead.name}
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5">
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description of Goods & Services
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="mt-1 input-field"
              placeholder="Enter goods or service description"
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-800">GST Details</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGstRegistration("registered")}
                className={`gst-option ${gstRegistration === "registered" ? "gst-option-active" : ""}`}
              >
                Registered GST
              </button>
              <button
                type="button"
                onClick={() => {
                  setGstRegistration("unregistered");
                  setGstNumber("");
                }}
                className={`gst-option ${gstRegistration === "unregistered" ? "gst-option-active" : ""}`}
              >
                Unregistered GST
              </button>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                GST No.
              </label>
              <input
                type="text"
                value={gstRegistration === "registered" ? gstNumber : "N/A"}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                disabled={gstRegistration === "unregistered"}
                className="mt-1 input-field disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Enter GST number"
              />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">Charges</p>
            {chargeItems.map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700">
                  {item.label}
                  {item.key === "serviceCharge" && (
                    <span className="text-primary"> *</span>
                  )}
                </label>

                <div className="mt-1 grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={charges[item.key]}
                    onChange={(e) => handleChargeChange(item.key, e.target.value)}
                    className="input-field"
                    placeholder="Unit Price"
                  />

                  <div className="relative">
                    <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500">
                      Quantity
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantities[item.key] ?? 1}
                      onChange={(e) => handleQuantityChange(item.key, e.target.value)}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tax on Handling + Other (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={handlingTaxPercent}
                onChange={(e) => setHandlingTaxPercent(e.target.value)}
                className="mt-1 input-field"
                placeholder="18"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                TCS (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tcsPercent}
                onChange={(e) => setTcsPercent(e.target.value)}
                className="mt-1 input-field"
                placeholder="5"
              />
              <p className="mt-1 text-xs text-gray-500">
                Applied on total after GST/tax.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1 input-field resize-y"
              placeholder="Payment terms, notes, etc."
            />
          </div>
          <button
            onClick={handlePrint}
            disabled={totalAmount <= 0}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-printer-line mr-2"></i>
            Print Proforma
          </button>
        </div>

        <div className="lg:col-span-2 bg-white proforma-print-area">
          <div className="invoice-sheet">
            <div className="invoice-header">
              <div className="logo-block">
                <img
                  src={logoUrl}
                  alt={companyDetails.companyName || "Company Logo"}
                  className="invoice-logo"
                />
                <div>
                  <h2>{companyDetails.companyName || "Lumina Infotech"}</h2>
                  <p className="powered-by-line">
                    Powered by My Way Destination
                  </p>
                  <p>
                    {companyDetails.address ||
                      "BILL ADDRESS: C11/33, 2nd Floor, Near Amul Booth"}
                  </p>
                  <p>
                    {[
                      companyDetails.city,
                      companyDetails.state,
                      companyDetails.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Sector 03, Rohini, 110085"}
                  </p>
                  {companyDetails.gstNo && <p>GST-{companyDetails.gstNo}</p>}
                </div>
              </div>
              <div className="invoice-meta">
                <h1>PROFORMA INVOICE</h1>
                <p>
                  <span>Date:</span> {new Date().toLocaleDateString()}
                </p>
                <p>
                  <span>Proforma Invoice:</span> {proformaNumber}
                </p>
                <p>
                  <span>Due:</span> {dueDate || "-"}
                </p>
              </div>
            </div>

            <div className="address-grid">
              <div>
                <p className="section-label">Bill Address</p>
                <p>
                  {companyDetails.address ||
                    "C11/33, 2nd Floor, Near Amul Booth"}
                </p>
                <p>
                  {[
                    companyDetails.city,
                    companyDetails.state,
                    companyDetails.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Sector 03, Rohini, 110085"}
                </p>
                {companyDetails.gstNo && <p>GST-{companyDetails.gstNo}</p>}
              </div>
              <div>
                <p className="section-label">Buyer / Bill To</p>
                <p className="buyer-name">{lead.name}</p>
                <p>{lead.phone}</p>
                <p>{lead.email || "-"}</p>
                <p>{lead.country || ""}</p>
                <p>
                  <strong>GST Status:</strong>{" "}
                  {gstRegistration === "registered"
                    ? "Registered GST"
                    : "Unregistered GST"}
                </p>
                <p>
                  <strong>GST No.:</strong> {displayGstNumber}
                </p>
              </div>
            </div>

            <div className="description-line">
              <span>Description of Goods & Services</span>
              <strong>{serviceName || lead.service || "Lead Service"}</strong>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {chargeItems.map((item) => (
                  <tr key={item.key}>
                    <td>
                      {item.label}
                      {item.key === "serviceCharge" && (
                        <span>
                          {serviceName || lead.service || "Lead Service"}
                        </span>
                      )}
                    </td>
                    <td>{formatAmount(item.rate)}</td>
                    <td>
                      {item.quantity.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{formatAmount(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="payment-grid">
              <div className="bank-panel">
                <h3>Bank Detail</h3>
                <div className="bank-detail-list">
                  <div className="bank-detail-row">
                    <div>
                      <p>
                        <strong>Bank Name :</strong> KOTAK MAHINDRA BANK
                      </p>
                      <p>
                        <strong>Account Name :</strong> MYWAY DESTINATION
                      </p>
                      <p>
                        <strong>Account no :</strong> 5448071728
                      </p>
                      <p>
                        <strong>IFSC code :</strong> KKBK0000197
                      </p>
                      <p>
                        <strong>Branch :</strong> Rohini Sec 8
                      </p>
                    </div>
                    <img
                      src={KOTAK_PAYMENT_QR}
                      alt="Kotak payment QR"
                      className="bank-qr"
                    />
                  </div>
                  <div className="bank-detail-row">
                    <div>
                      <p>
                        <strong>Bank Name :</strong> UNION BANK
                      </p>
                      <p>
                        <strong>Account Name :</strong> MYWAY DESTINATION
                      </p>
                      <p>
                        <strong>Account no :</strong> 254911010000044
                      </p>
                      <p>
                        <strong>IFSC code :</strong> UBIN0825492
                      </p>
                      <p>
                        <strong>Branch :</strong> Rohini Sector 3
                      </p>
                    </div>
                    <img
                      src={UNION_PAYMENT_QR}
                      alt="Union Bank payment QR"
                      className="bank-qr"
                    />
                  </div>
                </div>
                <div className="upi-grid">
                  <p>
                    <strong>UPI PAY ID</strong>
                  </p>
                  <p>mywaydestination@kotak</p>
                  <p>
                    <strong>UPI PAY ID</strong>
                  </p>
                  <p>mywaydestination@uboi</p>
                </div>
              </div>

              <div className="summary-panel">
                <div>
                  <span>Total</span>
                  <strong>{formatAmount(totalAmount)}</strong>
                </div>
                <div>
                  <span>
                    CGST + SGST @
                    {Number(handlingTaxPercent || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                  <strong>{formatAmount(additionalChargesTaxAmount)}</strong>
                </div>
                <div>
                  <span>Total After Tax</span>
                  <strong>{formatAmount(totalAfterTax)}</strong>
                </div>
                <div>
                  <span>
                    TCS @
                    {Number(tcsPercent || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </span>
                  <strong>{formatAmount(tcsAmount)}</strong>
                </div>
                <div className="grand-total">
                  <span>Grand Total</span>
                  <strong>{formatAmount(grandTotal)}</strong>
                </div>
                <section className="mt-2">
                  <p>
                    <strong>* RECEIPT :</strong> Receipt on our official receipt
                    duly signed by our cashier only will be considered valid.
                  </p>
                  <p>
                    <strong>* CHEQUE :</strong> All cheques should be drawn in
                    favour of "MYWAY DESTINATION" and crossed A/C Payee.
                  </p>
                  <p>
                    * Please add bank charges. Interest @18% per annum will be
                    charged if not paid within 15 days.
                  </p>
                </section>
              </div>
            </div>

            <div className="invoice-notes">
              {/* <p><strong>* RECEIPT :</strong> Receipt on our official receipt duly signed by our cashier only will be considered valid.</p>
                <p><strong>* CHEQUE :</strong> All cheques should be drawn in favour of "MYWAY DESTINATION" and crossed A/C Payee.</p>
                <p>* Please add bank charges. Interest @18% per annum will be charged if not paid within 15 days.</p> */}
              <p>
                Note: This is to be informed that after generating proforma
                invoice, if anyone fails to update GST number within 4 days
                Myway Destination will not be liable for any amendment in bill
                or to add GST number.
              </p>
              {remarks && (
                <p>
                  <strong>Remarks:</strong> {remarks}
                </p>
              )}
            </div>

            <div className="declaration">
              I declare that the info. mentioned above is true and correct to
              the best of my knowledge.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input-field {
          display: block;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
          border-color: #c4161c;
          box-shadow: 0 0 0 2px #c4161c20;
        }
        .charge-input-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(74px, 0.65fr) minmax(96px, 0.9fr);
          gap: 0.5rem;
          align-items: end;
        }
        .mini-label {
          display: block;
          margin-bottom: 0.2rem;
          color: #6b7280;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .line-total-box {
          min-height: 2.55rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0.6rem 0.65rem;
          font-size: 0.82rem;
          font-weight: 800;
        }
        .gst-option {
          border: 1px solid #d1d5db;
          border-radius: 0.65rem;
          background: #ffffff;
          color: #4b5563;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.55rem 0.45rem;
          transition: all 0.18s ease;
        }
        .gst-option-active {
          border-color: #c4161c;
          background: #fff1f2;
          color: #991b1b;
          box-shadow: 0 0 0 2px #c4161c18;
        }
        .invoice-sheet {
          width: 100%;
          max-width: 794px;
          min-height: 1123px;
          margin: 0 auto;
          padding: 22px;
          border: 1px solid #111827;
          color: #111827;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.35;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 2px solid #111827;
          padding-bottom: 12px;
        }
        .logo-block {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 68%;
        }
        .invoice-logo {
          width: 125px;
          max-height: 64px;
          object-fit: contain;
        }
        .logo-block h2 {
          font-size: 17px;
          font-weight: 800;
          margin: 0 0 4px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .logo-block p,
        .invoice-meta p,
        .address-grid p,
        .bank-panel p,
        .invoice-notes p {
          margin: 0;
        }
        .powered-by-line {
          font-size: 11px;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 4px !important;
          text-transform: uppercase;
        }
        .invoice-meta {
          text-align: right;
          min-width: 210px;
        }
        .invoice-meta h1 {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0;
        }
        .invoice-meta span {
          font-weight: 700;
        }
        .address-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
          border: 1px solid #111827;
        }
        .address-grid > div {
          padding: 10px;
        }
        .address-grid > div:first-child {
          border-right: 1px solid #111827;
        }
        .section-label {
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 4px !important;
        }
        .buyer-name {
          font-weight: 800;
          text-transform: uppercase;
        }
        .description-line {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          padding: 8px 10px;
          border: 1px solid #111827;
        }
        .description-line span {
          font-weight: 800;
          min-width: 170px;
        }
        .invoice-table {
          width: 100%;
          margin-top: 12px;
          border-collapse: collapse;
        }
        .invoice-table th,
        .invoice-table td {
          border: 1px solid #111827;
          padding: 8px;
          vertical-align: top;
        }
        .invoice-table th {
          background: #f3f4f6;
          text-align: left;
          font-weight: 800;
        }
        .invoice-table th:nth-child(n+2),
        .invoice-table td:nth-child(n+2) {
          text-align: right;
          width: 110px;
        }
        .invoice-table th:nth-child(3),
        .invoice-table td:nth-child(3) {
          width: 70px;
        }
        .invoice-table td span {
          display: block;
          color: #4b5563;
          font-size: 11px;
          margin-top: 2px;
        }
        .payment-grid {
          display: grid;
          grid-template-columns: 1fr 210px;
          gap: 14px;
          margin-top: 14px;
        }
        .bank-panel,
        .summary-panel {
          border: 1px solid #111827;
          padding: 10px;
        }
        .bank-panel h3 {
          margin: 0 0 8px;
          font-size: 13px;
          text-transform: uppercase;
          font-weight: 900;
        }
        .bank-detail-list {
          display: flex;
          flex-direction: column;
          border-top: 1px solid #111827;
        }
        .bank-detail-row {
          display: grid;
          grid-template-columns: 1fr 96px;
          gap: 12px;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #111827;
        }
        .bank-qr {
          width: 96px;
          height: 96px;
          object-fit: contain;
          justify-self: end;
        }
        .upi-grid {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 4px 12px;
          padding-top: 8px;
          font-size: 12px;
        }
        .summary-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: stretch;
        }
        .summary-panel > div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 6px;
        }
        .summary-panel .grand-total {
          border-bottom: 2px solid #111827;
          font-size: 15px;
          font-weight: 900;
        }
        .payment-terms {
          margin-top: auto;
          border-top: 1px solid #111827;
          padding-top: 10px;
          font-size: 11px;
        }
        .payment-terms h4 {
          margin: 0 0 6px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .payment-terms p {
          margin: 0 0 4px;
          font-weight: 700;
        }
        .invoice-notes {
          margin-top: 14px;
          border: 1px solid #111827;
          padding: 10px;
          font-size: 11px;
        }
        .declaration {
          margin-top: 14px;
          font-weight: 700;
          text-align: center;
        }
        @media (max-width: 520px) {
          .charge-input-grid {
            grid-template-columns: 1fr;
          }
          .line-total-box {
            justify-content: flex-start;
          }
        }
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden; }
          .proforma-print-area, .proforma-print-area * { visibility: visible; }
          .proforma-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
          }
          .invoice-sheet {
            width: 100%;
            min-height: auto;
            border: none;
            padding: 0;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ProformaInvoiceModal;
