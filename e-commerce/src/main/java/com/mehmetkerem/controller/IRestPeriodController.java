package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.PeriodRequest;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestPeriodController {
    ResultData<PeriodResponse> savePeriod(PeriodRequest request);

    ResultData<PeriodResponse> updatePeriod(Long id, PeriodRequest request);

    ResultData<String> deletePeriod(Long id);

    ResultData<PeriodResponse> getPeriodById(Long id);

    ResultData<List<PeriodResponse>> findAllPeriods();
}
