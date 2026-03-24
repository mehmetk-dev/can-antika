package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestPeriodController;
import com.mehmetkerem.dto.request.PeriodRequest;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.service.IPeriodService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/period")
@RequiredArgsConstructor
public class RestPeriodControllerImpl implements IRestPeriodController {

    private final IPeriodService periodService;

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/save")
    public ResultData<PeriodResponse> savePeriod(@Valid @RequestBody PeriodRequest request) {
        return ResultHelper.success(periodService.savePeriod(request));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/{id}")
    public ResultData<PeriodResponse> updatePeriod(@PathVariable Long id, @Valid @RequestBody PeriodRequest request) {
        return ResultHelper.success(periodService.updatePeriod(id, request));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/{id}")
    public ResultData<String> deletePeriod(@PathVariable Long id) {
        return ResultHelper.success(periodService.deletePeriod(id));
    }

    @Override
    @GetMapping("/{id}")
    public ResultData<PeriodResponse> getPeriodById(@PathVariable Long id) {
        return ResultHelper.success(periodService.getPeriodResponseById(id));
    }

    @Override
    @GetMapping("/find-all")
    public ResultData<List<PeriodResponse>> findAllPeriods() {
        return ResultHelper.success(periodService.findActivePeriods());
    }
}
