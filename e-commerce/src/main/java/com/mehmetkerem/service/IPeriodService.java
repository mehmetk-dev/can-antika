package com.mehmetkerem.service;

import com.mehmetkerem.dto.request.PeriodRequest;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.model.Period;

import java.util.List;
import java.util.Map;

public interface IPeriodService {
    PeriodResponse savePeriod(PeriodRequest request);

    PeriodResponse updatePeriod(Long id, PeriodRequest request);

    String deletePeriod(Long id);

    PeriodResponse getPeriodResponseById(Long id);

    Period getPeriodById(Long id);

    List<PeriodResponse> findAllPeriods();

    List<PeriodResponse> findActivePeriods();

    Map<Long, PeriodResponse> getPeriodResponsesByIds(List<Long> ids);

    Period findOrCreateByName(String periodName);
}
