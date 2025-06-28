
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Print() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Print Documents</h1>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print Document
        </Button>
      </div>
      
      {/* Document container */}
      <div className="print-document bg-white shadow-lg mx-auto" style={{ width: '8.5in', minHeight: '11in' }}>
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="font-bold text-lg">AMERICA'S AUTO TOWING LLC</div>
            <div className="mt-1">4735 Cecilia St</div>
            <div>Cudahy, Ca 90201</div>
            <div className="mt-4 font-bold text-xl underline">Buyer / Seller Agreement</div>
          </div>

          {/* Vehicle Information Section */}
          <div className="mb-6">
            <div className="font-bold underline mb-3">Vehicle Information</div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>Year: _____________</div>
              <div>Make: _____________</div>
            </div>
            <div className="mb-2">
              <span>VIN: _____________</span>
              <span className="ml-8">Model: _____________</span>
            </div>
            <div className="mb-2">Odometer/Mileage: _____________</div>
            <div className="grid grid-cols-2 gap-4">
              <div>License: _____________</div>
              <div>State: _____________</div>
            </div>
            <div>Color: _____________</div>
          </div>

          {/* Customer Information Section */}
          <div className="mb-6">
            <div className="font-bold underline mb-3">Customer Information</div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>First Name: _____________</div>
              <div>Last Name: _____________</div>
            </div>
            <div className="mb-2">Address: _____________</div>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div>City: _____________</div>
              <div>State: _____________</div>
              <div>Zip: _____________</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>Phone:( ) _____________</div>
              <div>Alt Phone:( ) _____________</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>Driver's License: _____________</div>
              <div>State: _____________</div>
              <div>Exp: ___/___/_____</div>
            </div>
          </div>

          {/* Affidavit Section */}
          <div className="mb-6">
            <div className="text-center font-bold mb-3">Affidavit</div>
            <div className="text-sm leading-relaxed mb-4">
              Please be advised that I have today assigned America's Auto Towing LLC the vehicle described herein and wish to confirm the 
              following: The undersigned has assumed or acquired legal ownership to said vehicle and is authorized to assign the vehicle to 
              America's Auto Towing LLC.
            </div>
            <div className="text-sm mb-4">
              The undersigned provider/seller states that he has the lawful right to possess this vehicle because:
            </div>
            <div className="text-sm ml-6 mb-4">
              <div>1. The undersigned provider/seller purchased the vehicle from the previous owner.</div>
              <div>2. The previous owner gifted the vehicle _____ OR</div>
              <div>3. Other basis of rightful possession.</div>
            </div>
            <div className="text-sm mb-4">
              Note: All transactions are reported to the Department of Motor Vehicles. YOU are required by law to notify the DMV within 5 
              days from the date you sell or otherwise dispose of a vehicle.
            </div>
            <div className="text-sm mb-4">
              NOTE: If for any reason you change your mind and want to cancel the transaction a $100.00 CANCELLATION FEE WILL BE CHARGED. 
              IF THE TOW TRUCK IS THERE TO PICK UP THE VEHICLE AND YOU WANT TO CANCEL IT WE CHARGE $150.00. FEE TO RUN A RECORD 
              IS $35.00
            </div>
            <div className="text-sm mb-4">
              AMERICA'S Auto Towing, LLC will <span className="font-bold underline">NOT</span> be responsible for any damage caused to your property, building structure or any other 
              vehicle while removing the vehicle from your location. Please make clearance for our tow trucks to safely remove your junk car. As 
              a REMINDER, please remove ALL your BELONGINGS BEFORE we pick up the vehicle, we are not responsible once we tow it.
            </div>
            <div className="text-sm mb-4">
              If the vehicle is reported stolen, we will exercise our right to seek legal remedy to recover our funds by suing the seller.
            </div>
            <div className="text-sm mb-6">
              Atención: Si el vehículo es reportado robado, haremos uso de nuestro derecho de recuperar nuestra inversión y PODREMOS 
              demandandarnos al vendedor para recuperar nuestro dinero. No se olvide de dar de baja el vehículo en el DMV es su responsabilidad 
              en los siguientes 5 días después de la venta.
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>Amount Paid: $___________</div>
            <div>Date: ___________</div>
          </div>
          <div className="mb-4">Seller's Finger Print: ___________________________</div>
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>Seller's Name: ___________________________</div>
            <div>Signature: ___________________________</div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>Driver Name: ___________________________</div>
            <div>Driver Signature: ___________________________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
