
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const Print = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Print Documents</h1>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Document
          </Button>
        </div>
        
        {/* Document Container - Hidden from screen, visible in print */}
        <div className="bg-white shadow-lg print:shadow-none print:bg-white">
          <div className="document-content p-8 max-w-[8.5in] mx-auto print:p-0 print:max-w-none">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold">AMERICA'S AUTO TOWING LLC</h2>
              <p className="text-sm">4735 Cecilia St</p>
              <p className="text-sm">Cudahy, Ca 90201</p>
              <h3 className="text-xl font-bold mt-4">Buyer / Seller Agreement</h3>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold underline mb-3">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex">
                    <span className="w-16">Year:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-16">Make:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex">
                    <span className="w-16">Model:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-32">Odometer/Mileage:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex">
                    <span className="w-16">VIN:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-16">Color:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex">
                    <span className="w-16">License:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-16">State:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold underline mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex">
                    <span className="w-20">First Name:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-20">Last Name:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <div className="flex">
                    <span className="w-16">Address:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                  <div className="flex">
                    <span className="w-12">City:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-12">State:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-12">Zip:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex">
                    <span className="w-16">Phone:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-20">Alt Phone:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <div className="flex">
                    <span className="w-24">Driver's License:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                    <span className="w-12 ml-4">State:</span>
                    <span className="border-b border-black w-16 ml-2"></span>
                    <span className="w-12 ml-4">Exp:</span>
                    <span className="border-b border-black w-24 ml-2"></span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold">Affidavit</p>
              </div>

              <div className="text-xs space-y-2">
                <p>
                  Please be advised that I have today assigned America's Auto Towing LLC the vehicle described herein and wish to confirm the 
                  following: The undersigned has assumed or acquired legal ownership to said vehicle and is authorized to assign the vehicle to 
                  America's Auto Towing LLC.
                </p>
                
                <p>The undersigned provider/seller states that he has the lawful right to possess this vehicle because:</p>
                
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>The undersigned provider/seller purchased the vehicle from the previous owner.</li>
                  <li>The previous owner gifted the vehicle _______ OR</li>
                  <li>Other basis of rightful possession.</li>
                </ol>

                <p>
                  Note: All transactions are reported to the Department of Motor Vehicles. YOU are required by law to notify the DMV within 5 
                  days from the date you sell or otherwise dispose of a vehicle.
                </p>

                <p className="font-bold">
                  NOTE: If for any reason you change your mind and want to cancel the transaction a $100.00 CANCELLATION FEE WILL BE CHARGED. 
                  IF THE TOW TRUCK IS THERE TO PICK UP THE VEHICLE AND YOU WANT TO CANCEL IT WE CHARGE $150.00. FEE TO RUN A RECORD 
                  IS $50.00
                </p>

                <p>
                  AMERICA'S Auto Towing, LLC will NOT be responsible for any damage caused to your property, building structure or any other 
                  vehicle while removing the vehicle from your location. Please make clearance for our tow trucks to safely remove your junk car. As 
                  a REMINDER, please remove ALL your personal items BEFORE we pick up the vehicle, we are not responsible for any item you left it.
                </p>

                <p>
                  If the vehicle is reported stolen, we will exercise or right or seek legal remedy to recover our funds by suing the seller.
                </p>

                <p>
                  Atención: Si el vehículo es reportado robado, haremos uso de nuestro derecho de recuperar nuestra inversión y PODREMOS 
                  demandarnos al vendedor para recuperar nuestro dinero. No se olvide de dar de baja el vehículo en el DMV es su responsabilidad 
                  en los siguientes 5 días después de la venta.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex">
                    <span className="text-sm w-24">Amount Paid: $</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="text-sm w-16">Date:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex">
                    <span className="w-32">Seller's Finger Print:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div className="flex">
                    <span className="w-24">Seller's Name:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-20">Signature:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div className="flex">
                    <span className="w-24">Driver Name:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                  <div className="flex">
                    <span className="w-24">Driver Signature:</span>
                    <span className="border-b border-black flex-1 ml-2"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
