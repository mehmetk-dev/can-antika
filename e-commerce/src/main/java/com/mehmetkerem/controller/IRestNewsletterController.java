package com.mehmetkerem.controller;

import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.NewsletterSubscriberResponse;
import com.mehmetkerem.util.ResultData;

import java.util.Map;

public interface IRestNewsletterController {
    ResultData<Map<String, String>> subscribe(Map<String, String> body);
    ResultData<Map<String, String>> unsubscribe(Map<String, String> body);
    ResultData<CursorResponse<NewsletterSubscriberResponse>> getAll(int page, int size);
    ResultData<Map<String, Long>> getCount();
    ResultData<Map<String, String>> delete(Long id);
}

