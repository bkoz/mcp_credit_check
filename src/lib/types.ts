export interface ConsumerFormData {
  firstName: string;
  lastName: string;
  ssn: string;
  houseNumber: string;
  streetName: string;
  streetType: string;
  city: string;
  state: string;
  zip: string;
}

export interface CreditReportResponse {
  summary?: string;
  error?: string;
}
