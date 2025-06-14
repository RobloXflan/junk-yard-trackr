
export interface ExtractedVehicleInfo {
  year?: string;
  make?: string;
  model?: string;
  vehicleId?: string;
  [key: string]: any;
}

export interface PendingIntakeDocument {
  id: string;
  name: string;
  size: number;
  url: string;
  contentType?: string;
}

export interface PendingIntake {
  id: string;
  email_from: string;
  email_subject: string;
  email_received_at: string;
  confidence_score: number;
  status: string;
  documents: PendingIntakeDocument[];
  extracted_info: ExtractedVehicleInfo;
}
