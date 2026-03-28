export interface AddressResponse {
    id: number;
    title: string;
    country: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
}

export interface AddressRequest {
    title: string;
    country: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
}
