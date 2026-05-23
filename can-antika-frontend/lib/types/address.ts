export interface AddressResponse {
    id: number;
    title: string;
    country: string;
    city: string;
    district: string;
    neighborhood?: string | null;
    phone?: string | null;
    postalCode: string;
    addressLine: string;
}

export interface AddressRequest {
    title: string;
    country: string;
    city: string;
    district: string;
    neighborhood: string;
    phone: string;
    postalCode: string;
    addressLine: string;
}
