import { api } from "../../api-client";
import type { AddressResponse, AddressRequest } from "../../types";

export const addressApi = {
    getMyAddresses: () =>
        api.get<AddressResponse[]>("/v1/address/my-addresses"),

    getById: (id: number) =>
        api.get<AddressResponse>(`/v1/address/${id}`),

    save: (data: AddressRequest) =>
        api.post<AddressResponse>("/v1/address/save", { body: data }),

    update: (id: number, data: AddressRequest) =>
        api.put<AddressResponse>(`/v1/address/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/address/${id}`),

    findAll: () =>
        api.get<AddressResponse[]>("/v1/address/find-all"),
};
