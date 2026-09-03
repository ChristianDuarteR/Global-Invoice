export interface Client {
  id: number;
  documentType: string;
  documentNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ClientPage {
  content: Client[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
