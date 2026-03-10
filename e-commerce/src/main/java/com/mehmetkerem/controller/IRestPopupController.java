package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.PopupRequest;
import com.mehmetkerem.dto.response.PopupResponse;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestPopupController {
    ResultData<List<PopupResponse>> getActivePopups();
    ResultData<List<PopupResponse>> getAllPopups();
    ResultData<PopupResponse> createPopup(PopupRequest req);
    ResultData<PopupResponse> updatePopup(Long id, PopupRequest req);
    Result deletePopup(Long id);
}

