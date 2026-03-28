package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.PeriodRequest;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Period;
import com.mehmetkerem.repository.PeriodRepository;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.service.IPeriodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PeriodServiceImpl implements IPeriodService {

    private final PeriodRepository periodRepository;
    private final ProductRepository productRepository;

    @Override
    public PeriodResponse savePeriod(PeriodRequest request) {
        String normalizedName = normalizeRequired(request.getName());
        if (periodRepository.findByNameIgnoreCase(normalizedName).isPresent()) {
            throw new BadRequestException("Bu dönem zaten mevcut: " + normalizedName);
        }

        Period period = Period.builder()
                .name(normalizedName)
                .active(request.getActive() == null || request.getActive())
                .build();
        return toResponse(periodRepository.save(period));
    }

    @Override
    public PeriodResponse updatePeriod(Long id, PeriodRequest request) {
        Period period = getPeriodById(id);
        String normalizedName = normalizeRequired(request.getName());

        periodRepository.findByNameIgnoreCase(normalizedName)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Bu dönem adı zaten kullanılıyor: " + normalizedName);
                });

        period.setName(normalizedName);
        if (request.getActive() != null) {
            period.setActive(request.getActive());
        }
        return toResponse(periodRepository.save(period));
    }

    @Override
    public String deletePeriod(Long id) {
        if (productRepository.existsByPeriodId(id)) {
            throw new BadRequestException("Bu döneme bağlı ürünler var. Önce ürünlerde dönemi güncelleyin.");
        }
        Period period = getPeriodById(id);
        periodRepository.delete(period);
        return "Dönem silindi: " + id;
    }

    @Override
    public PeriodResponse getPeriodResponseById(Long id) {
        return toResponse(getPeriodById(id));
    }

    @Override
    public Period getPeriodById(Long id) {
        return periodRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Dönem bulunamadı: " + id));
    }

    @Override
    public List<PeriodResponse> findAllPeriods() {
        return periodRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<PeriodResponse> findActivePeriods() {
        return periodRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Map<Long, PeriodResponse> getPeriodResponsesByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return periodRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Period::getId, this::toResponse));
    }

    @Override
    @Transactional
    public Period findOrCreateByName(String periodName) {
        String normalizedName = normalizeRequired(periodName);
        return periodRepository.findByNameIgnoreCase(normalizedName)
                .orElseGet(() -> {
                    try {
                        return periodRepository.save(
                                Period.builder().name(normalizedName).active(true).build());
                    } catch (DataIntegrityViolationException ex) {
                        log.warn("Dönem kaydetme çakışması, mevcut kayıt aranıyor: {}", normalizedName);
                        return periodRepository.findByNameIgnoreCase(normalizedName)
                                .orElseThrow(() -> ex);
                    }
                });
    }

    private PeriodResponse toResponse(Period period) {
        return PeriodResponse.builder()
                .id(period.getId())
                .name(period.getName())
                .active(period.isActive())
                .build();
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new BadRequestException("Dönem adı boş olamaz.");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
