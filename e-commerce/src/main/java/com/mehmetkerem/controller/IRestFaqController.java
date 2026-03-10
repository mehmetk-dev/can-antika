package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.FaqItemRequest;
import com.mehmetkerem.dto.response.FaqItemResponse;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestFaqController {
    ResultData<List<FaqItemResponse>> getActiveFaqs();
    ResultData<List<FaqItemResponse>> getAllFaqs();
    ResultData<FaqItemResponse> createFaq(FaqItemRequest faq);
    ResultData<FaqItemResponse> updateFaq(Long id, FaqItemRequest faq);
    Result deleteFaq(Long id);
}
