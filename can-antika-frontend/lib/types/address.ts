export interface AddressResponse {
    id: number;
    title: string;
    country: string;
    city: string;
    district: string;
    phone?: string | null;
    postalCode: string;
    addressLine: string;
}

export interface AddressRequest {
    title: string;
    country: string;
    city: string;
    district: string;
    phone: string;
    postalCode: string;
    addressLine: string;
}
