package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.FaqItem;
import com.mehmetkerem.repository.FaqRepository;
import com.mehmetkerem.service.IFaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FaqServiceImpl implements IFaqService {

    private final FaqRepository faqRepository;

    @Override
    public List<FaqItem> getActiveFaqs() {
        return faqRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    @Override
    public List<FaqItem> getAllFaqs() {
        return faqRepository.findAll();
    }

    @Override
    public FaqItem saveFaq(FaqItem faq) {
        return faqRepository.save(faq);
    }

    @Override
    public FaqItem updateFaq(Long id, FaqItem faq) {
        FaqItem existing = faqRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("SSS bulunamadı: " + id));
        existing.setQuestion(faq.getQuestion());
        existing.setAnswer(faq.getAnswer());
        existing.setSortOrder(faq.getSortOrder());
        existing.setActive(faq.isActive());
        return faqRepository.save(existing);
    }

    @Override
    public void deleteFaq(Long id) {
        faqRepository.deleteById(id);
    }
}
