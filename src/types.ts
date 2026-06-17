export interface Transaction {
  id: string;
  city: string;
  district: string;
  propertyType: string;
  address: string;
  area: number;
  price: number;
  unitPrice: number;
  date: string;
}

export interface SystemStatus {
  lastUpdated: string;
  scheduleInterval: string;
}

export interface TransactionResponse {
  data: Transaction[];
  lastUpdated: string;
  scheduleInterval: string;
  total: number;
}
