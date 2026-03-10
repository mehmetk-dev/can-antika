package com.mehmetkerem.service;

import com.mehmetkerem.model.FaqItem;
import java.util.List;

public interface IFaqService {
    List<FaqItem> getActiveFaqs();
    List<FaqItem> getAllFaqs();
    FaqItem saveFaq(FaqItem faq);
    FaqItem updateFaq(Long id, FaqItem faq);
    void deleteFaq(Long id);
}
