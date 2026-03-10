package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.ContactRequestDto;
import com.mehmetkerem.dto.response.ContactRequestResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.util.ResultData;

import java.util.Map;

public interface IRestContactRequestController {
    ResultData<Map<String, String>> submitContact(ContactRequestDto request);
    ResultData<CursorResponse<ContactRequestResponse>> getAll(int page, int size);
    ResultData<Map<String, Long>> getUnreadCount();
    ResultData<ContactRequestResponse> updateRequest(Long id, ContactRequestDto request);
    ResultData<Map<String, String>> deleteRequest(Long id);
}

