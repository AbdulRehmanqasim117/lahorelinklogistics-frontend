import React from "react";

const Section = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-semibold text-secondary">{title}</h2>
    <div className="text-sm text-gray-700 space-y-1 leading-relaxed">{children}</div>
  </section>
);

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <header className="px-6 md:px-8 py-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-secondary">
              Standard Terms and Conditions of Carriage
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              These terms govern all shipments and related services provided by LahoreLink Logistics.
            </p>
          </div>
          <div className="text-right text-xs text-gray-400 flex flex-col items-end gap-1">
            <div className="flex justify-end">
              <img
                src="/logo.png"
                alt="LahoreLink Logistics logo"
                className="h-8 object-contain"
              />
            </div>
            <div>Last updated: {new Date().getFullYear()}</div>
          </div>
        </header>

        <div className="px-6 md:px-8 py-6 max-h-[75vh] overflow-y-auto space-y-6">
          <Section title="1. Definitions">
            <p>
              In these Terms, "Company", "we", "us" and "our" refer to LahoreLink Logistics.
              "Shipper" means the customer or account holder requesting carriage of a shipment.
              "Consignee" means the person or entity to whom the shipment is addressed.
              "Shipment" means any parcel, document, or goods that we accept for carriage.
            </p>
          </Section>

          <Section title="2. Scope of Service">
            <p>
              LahoreLink Logistics provides collection, transportation, and delivery services for
              shipments within its operational network. We may use our own fleet or authorized
              partners to perform all or part of the carriage.
            </p>
            <p>
              Service offerings (same day, overnight, economy, or any other product) and transit
              times are indicative only and are not guaranteed unless expressly confirmed in
              writing.
            </p>
          </Section>

          <Section title="3. Shipper Responsibilities">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                The shipper is responsible for providing complete and accurate details, including
                shipper information, consignee name, address, and contact number.
              </li>
              <li>
                Shipments must be properly packed so they can be safely handled, stacked and
                transported. Fragile or high-value items must be clearly declared and packed with
                appropriate protection.
              </li>
              <li>
                The shipper confirms that each shipment complies with all applicable laws and does
                not contain prohibited or dangerous goods.
              </li>
            </ul>
          </Section>

          <Section title="4. Prohibited and Restricted Items">
            <p>
              We do not accept shipments containing cash, precious metals, precious stones,
              negotiable instruments, illegal goods, explosives, hazardous materials or any other
              items restricted by law or by our internal policies.
            </p>
            <p>
              We reserve the right to refuse, return, hold, or dispose of any shipment that is, or
              is reasonably suspected to be, unsafe, illegal, improperly packaged, or otherwise in
              breach of these Terms.
            </p>
          </Section>

          <Section title="5. Cash on Delivery (COD)">
            <p>
              Where COD service is requested, LahoreLink Logistics will collect cash from the
              consignee on behalf of the shipper. COD amounts are considered funds of the shipper
              and are kept in trust until settlement.
            </p>
            <p>
              Settlement of COD to shippers is made as per the finance and payout schedule agreed
              with LahoreLink Logistics. Any banking charges, taxes or deductions required by law
              may be adjusted at the time of settlement.
            </p>
          </Section>

          <Section title="6. Inspection and Security">
            <p>
              We may, at our discretion or at the request of any competent authority, open and
              inspect any shipment for security, customs, or regulatory reasons. Such inspection
              will be carried out with reasonable care and without any obligation to the shipper
              for resulting delays, where permitted by law.
            </p>
          </Section>

          <Section title="7. Liability of LahoreLink Logistics">
            <p>
              Our liability for loss of or damage to a shipment, whether arising from negligence or
              otherwise, is limited to the lower of: (a) the declared value of the shipment, or
              (b) the actual direct loss proved by the shipper, subject to any statutory limits
              under applicable law.
            </p>
            <p>
              We are not liable for indirect, consequential, or special losses including, but not
              limited to, loss of profit, loss of business, or reputational damage.
            </p>
          </Section>

          <Section title="8. Claims and Time Limits">
            <p>
              Any claim for loss, damage, shortage, or COD discrepancy must be notified in writing
              to LahoreLink Logistics within 7 calendar days from the date of delivery (or
              expected delivery). Supporting documents, such as invoice copies and photographs,
              must be provided upon request.
            </p>
            <p>
              No claim will be entertained until all shipment charges have been paid in full. Our
              investigation and any goodwill settlement are without prejudice to these Terms.
            </p>
          </Section>

          <Section title="9. Customer Data and Communications">
            <p>
              The shipper authorizes LahoreLink Logistics to use shipment data, contact details,
              and tracking events for the purpose of providing services, sending notifications,
              and improving our operations, in accordance with applicable data protection laws.
            </p>
            <p>
              We may contact shippers or consignees via SMS, phone call, email, or in-app
              notifications in relation to pickup, delivery, COD reconciliation or service
              feedback.
            </p>
          </Section>

          <Section title="10. Charges, Taxes and Invoices">
            <p>
              All charges are based on the greater of actual weight or volumetric weight and the
              service type selected. Additional surcharges, fuel adjustments, or government taxes
              may apply and will be communicated in the prevailing tariff or commercial agreement.
            </p>
            <p>
              Shippers agree to pay all shipment charges, duties, taxes, penalties and storage
              charges, even if the shipment is refused by the consignee or returned.
            </p>
          </Section>

          <Section title="11. Governing Law and Jurisdiction">
            <p>
              These Terms and any dispute arising out of or in connection with the services of
              LahoreLink Logistics shall be governed by and construed in accordance with the laws
              of Pakistan. The courts of Lahore shall have exclusive jurisdiction, without
              prejudice to any mandatory jurisdiction prescribed by applicable law.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>
              LahoreLink Logistics may amend these Terms from time to time. The latest version will
              always be available on our portal or website. Continued use of our services after any
              change constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="13. Acceptance">
            <p>
              By creating an account, booking a shipment, or handing over goods to LahoreLink
              Logistics, the shipper confirms that they have read, understood and agreed to these
              Standard Terms and Conditions of Carriage on their own behalf and on behalf of the
              consignee and any other interested party.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
