import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function TCModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-background border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">Terms & Conditions</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm leading-relaxed text-foreground">
          <p className="font-semibold text-base">
            Kavak has agreed to enter into this Agreement with the Customer to provide the periodic
            services to the Vehicle upon the terms and conditions set forth herein:
          </p>

          <section>
            <h3 className="font-bold mb-1">1. Provision of Services</h3>
            <p>
              Kavak agrees during the term to diligently and professionally carry out and supply the
              periodic services for the vehicle, as outlined in the Annexure attached herewith.
              Customer is required to follow the maintenance schedule as per the maintenance
              requirements. Customer agrees to have periodic services performed every 6 months /
              10,000 kilometers of the scheduled service intervals, whichever comes first, and to
              have all services performed by Kavak and in Kavak workshops. This Agreement shall only
              apply to the vehicle listed above.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">2. Exclusions</h3>
            <p className="mb-2">
              The following shall be excluded from the scope and/or definition of the Services:
            </p>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>
                Any loss caused by negligence, misuse, abuse, or failure by the Customer to perform
                required servicing or any mechanical failure caused by the lack of proper and
                necessary amounts of coolant or lubricants.
              </li>
              <li>
                Any loss or damage resulting from, related to, or arising out of an accident, a
                collision, falling objects, theft, vandalism, riot, fire, explosion, earthquake,
                sandstorm, thunderstorm, flood, or from any other acts of God.
              </li>
              <li>Any mechanical breakdown which is the direct result of a mechanical or structural defect.</li>
              <li>Any loss or repair if the vehicle has been used for competitive driving or racing.</li>
              <li>
                Any loss, repair or replacement if the odometer has been tampered with, altered, or
                broken, after the effective date of this Agreement.
              </li>
              <li>
                Repairs and/or replacements not authorized by Kavak or loss due to any mechanical
                alterations to the vehicle.
              </li>
              <li>
                Any further damage to the vehicle due to the failure to protect it shall not be
                recoverable. Continued operation of the vehicle after a Mechanical Breakdown occurs
                shall be considered failure to protect the vehicle.
              </li>
              <li>Repair of any body work or paint work.</li>
              <li>
                Replacement or repair of any glass fittings including windscreens, headlamps, sealed
                beam units, taillights or reversing lights.
              </li>
              <li>Replacement of tyres or repair of punctures.</li>
              <li>
                Any loss or expense for adjustments, tune-ups, alignments, towing, road service or
                assistance, or for repairs to or replacement of any parts not covered in this
                Agreement.
              </li>
              <li>Any mechanical breakdown occurring outside the United Arab Emirates.</li>
              <li>
                Maintenance which is carried out or completed at the request of the Customer outside
                of normal working hours, which for this purpose shall be 8:00 am to 6:00 pm, Monday
                to Saturday, public and general holidays excepted.
              </li>
              <li>
                Any additional costs for services or maintenance services not specifically covered by
                this Agreement. Customer agrees to pay for all costs and expenses of the items and
                services excluded from the scope of this service Agreement. The amount of the service
                and/or maintenance fee will be listed on the applicable Schedule/Invoice issued by
                Kavak and will be due and payable upon completion of the service.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold mb-1">3. Service Validity</h3>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>Periodic Service at 10,000 KM / 6 months whichever comes first.</li>
              <li>Service contract will be valid as per the package.</li>
              <li>Services after the End KM or End Date will be chargeable to the customer.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold mb-1">4. Customer's Covenants</h3>
            <p>
              The Customer hereby agrees to take proper care of the vehicle and shall (i) regularly
              check the oil and water and other fluid levels of the Vehicle in accordance with the
              recommendations as stated in the owner's manual; (ii) not use the Vehicle or allow it
              to be used for any purpose for which it is not designed; and (iii) use the vehicle in
              a proper and responsible manner. Customer hereby agrees to take a prior appointment
              with KAVAK to perform the periodic service / any additional services.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">5. Collection & Delivery</h3>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>
                Customer shall at their own cost to deliver the vehicle to and collect the vehicle
                from the workshops.
              </li>
              <li>
                Vehicle must be collected by the customer within 48 hours from the Ready message
                from the workshop, if fails to do so Customer will be imposed with a parking charges
                of AED 75/- per day.
              </li>
              <li>
                Customer can choose the delivery options like pick up & drop facility on chargeable
                basis.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold mb-1">6. Contract Transfer Option</h3>
            <p>
              Should the customer sell the vehicle within the period of service contract, it can be
              transferred to the new owner (individual only) with a transfer fee of AED 200/-, no
              refund on the existing contract is applicable to the existing customer.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">7. Warranty and Limitation of Liability</h3>
            <p>
              Kavak offers a six-month or a ten thousand kilometers workmanship warranty, whichever
              occurs first, with respect to any repairs or services provided by Kavak under this
              Agreement. However, Kavak makes no representation or warranty of any kind with respect
              to any products, repairs or services provided by third parties, including, without
              limitation, any representation or warranty as to merchantability, compliance with
              specifications, condition, suitability, performance, or quality. Any defect in the
              performance of any product, repair or service will not relieve the Customer of its
              obligations under this Agreement, including the payment to Kavak of the service and
              maintenance fees and/or any charges due under this Agreement. In any case, Kavak's
              liability towards the Customer cannot exceed the fee/price paid by the Customer for
              the Agreement less any maintenance services redeemed on the Vehicle.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">8. No Third-Party Workshops</h3>
            <p>
              The Customer shall ensure that no servicing, routine maintenance, or repairs are
              carried out upon the vehicle or any part thereof by any person or any workshop other
              than Kavak, provided however that in a case of emergency and the Customer being unable
              to deliver the vehicle to Kavak, minor repairs of an emergency nature may be carried
              out by a competent repairer but at the sole cost of the Customer.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">9. Notices</h3>
            <p>
              All notices and other communications hereunder shall be in writing and be given by
              email, or hand delivery to the other party or by registered mail addressed and sent to
              the party's address as set on the first page of this Agreement. Notices and
              communications shall be effective when received by the addressee.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">10. Governing Law</h3>
            <p>
              This Agreement is governed by and shall be construed in accordance with the applicable
              laws of the United Arab Emirates. Any disputes arising out of or in connection with
              this Agreement, including any question regarding its existence, interpretation,
              validity, or termination, shall be referred to and finally resolved by the Courts of
              Dubai.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-1">11. Miscellaneous</h3>
            <p>
              This Agreement runs concurrent with, and is secondary to, any applicable Extended
              Warranty. The Customer may not assign, transfer or delegate any of its rights or
              obligations under this Agreement without the prior written consent of Kavak. This
              Agreement embodies the entire Agreement between the parties relating to the subject
              matter hereof. This Agreement may be amended only by an agreement in writing signed by
              Kavak and the Customer. Any provision of this Agreement which is unenforceable shall
              be ineffective only to the extent of such unenforceability and without affecting the
              remaining provisions of this Agreement.
            </p>
          </section>

          <section className="border-t border-border pt-4">
            <p className="font-semibold">
              I ACKNOWLEDGE AND AGREE TO THE TERMS, CONDITIONS, LIMITATIONS AND PROVISIONS DETAILED
              HEREIN AND OVERLEAF. I hereby declare that I have not relied upon the statements or
              promises of any person unless those statements or promises are expressly set forth in
              this Agreement. I understand that I am required to schedule services and routine
              maintenance whenever alerted by my Vehicle or as per the advised schedule by Kavak to
              keep this Agreement in force.
            </p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
