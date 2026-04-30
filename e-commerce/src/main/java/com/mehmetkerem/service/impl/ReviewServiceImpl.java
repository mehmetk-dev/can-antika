package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.ReviewRequest;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.dto.response.ReviewResponse;
import com.mehmetkerem.dto.response.UserResponse;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.ReviewMapper;
import com.mehmetkerem.model.Review;
import com.mehmetkerem.repository.ReviewRepository;
import com.mehmetkerem.service.IReviewService;
import com.mehmetkerem.util.Messages;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReviewServiceImpl implements IReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;
    private final com.mehmetkerem.service.IUserService userService;
    private final com.mehmetkerem.service.IProductService productService;
    private final com.mehmetkerem.repository.OrderRepository orderRepository;
    private final com.mehmetkerem.service.INotificationService notificationService;
    private final com.mehmetkerem.service.IInAppNotificationService inAppNotificationService;

    @Transactional
    @Override
    public ReviewResponse saveReview(Long userId, ReviewRequest request) {
        log.info("Yeni yorum isteği. Kullanıcı ID: {}, Ürün ID: {}", userId, request.getProductId());

        // Verify purchase
        boolean hasPurchased = orderRepository.existsByUserIdAndOrderItemsProductId(userId,
                request.getProductId());

        if (!hasPurchased) {
            log.warn("Yorum reddedildi: Ürün satın alınmamış. Kullanıcı ID: {}, Ürün ID: {}", userId,
                    request.getProductId());
            throw new com.mehmetkerem.exception.BadRequestException(
                    "Bu ürünü satın almadığınız için yorum yapamazsınız.");
        }

        // Check if already reviewed
        boolean alreadyReviewed = reviewRepository.existsByUserIdAndProductId(userId,
                request.getProductId());
        if (alreadyReviewed) {
            log.warn("Yorum reddedildi: Mükerrer yorum. Kullanıcı ID: {}, Ürün ID: {}", userId,
                    request.getProductId());
            throw new com.mehmetkerem.exception.BadRequestException("Bu ürüne zaten yorum yapmışsınız.");
        }

        Review review = reviewMapper.toEntity(request);
        review.setUserId(userId);
        Review savedReview = reviewRepository.save(review);
        log.info("Yorum başarıyla kaydedildi. Yorum ID: {}", savedReview.getId());

        // Admin bildirimleri
        try {
            ProductResponse product = productService.getProductResponseById(request.getProductId());
            String productName = product != null ? product.getTitle() : "Bilinmeyen Ürün";
            notificationService.sendAdminNotification(
                    "Yeni Yorum - " + productName,
                    "<p><strong>Ürün:</strong> " + productName + "</p>"
                            + "<p><strong>Yorum:</strong> " + savedReview.getComment() + "</p>"
                            + "<p><strong>Puan:</strong> " + savedReview.getRating() + "/5</p>");
            inAppNotificationService.createForAdmins(
                    "Yeni Yorum: " + productName,
                    productName + " ürününe " + savedReview.getRating() + " yıldızlı yorum yapıldı.",
                    "NEW_REVIEW",
                    savedReview.getId());
        } catch (Exception e) {
            log.error("Admin yorum bildirimi gönderilemedi: {}", e.getMessage());
        }

        // Recalculate product rating
        recalculateProductRating(request.getProductId());

        return getDetails(savedReview);
    }

    private void recalculateProductRating(Long productId) {
        double avgRating = reviewRepository.averageRatingByProductId(productId);
        int count = reviewRepository.countByProductId(productId);
        productService.updateProductRating(productId, avgRating, count);
        log.debug("Ürün rating güncellendi. Ürün ID: {}, Ortalama: {}, Yorum Sayısı: {}",
                productId, avgRating, count);
    }

    @Transactional
    @Override
    public String deleteReview(Long userId, Long id) {
        Review review = getReviewById(id);
        if (!review.getUserId().equals(userId)) {
            throw new com.mehmetkerem.exception.BadRequestException("Bu yorumu silme yetkiniz yok.");
        }
        Long productId = review.getProductId();
        reviewRepository.delete(review);
        recalculateProductRating(productId);
        return String.format(Messages.DELETE_VALUE, id, "yorum");
    }

    @Transactional
    @Override
    public ReviewResponse updateReview(Long userId, Long id, ReviewRequest request) {
        Review currentReview = getReviewById(id);
        if (!currentReview.getUserId().equals(userId)) {
            throw new com.mehmetkerem.exception.BadRequestException("Bu yorumu güncelleme yetkiniz yok.");
        }
        reviewMapper.update(currentReview, request);
        ReviewResponse response = getDetails(reviewRepository.save(currentReview));
        recalculateProductRating(currentReview.getProductId());
        return response;
    }

    @Override
    public ReviewResponse getReviewResponseById(Long id) {
        return getDetails(getReviewById(id));
    }

    @Override
    public Review getReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, id, "yorum")));
    }

    private static final int MAX_FIND_ALL_RESULTS = 500;

    @Override
    public List<ReviewResponse> findAllReviews() {
        Page<Review> page = reviewRepository.findAll(PageRequest.of(0, MAX_FIND_ALL_RESULTS));
        if (page.isEmpty()) {
            return List.of();
        }

        List<Long> userIds = page.getContent().stream()
                .map(Review::getUserId)
                .distinct()
                .toList();
        List<Long> productIds = page.getContent().stream()
                .map(Review::getProductId)
                .distinct()
                .toList();

        java.util.Map<Long, UserResponse> userMap = userService.getUserResponsesByIds(userIds);
        java.util.Map<Long, ProductResponse> productMap = productService.getProductResponsesByIds(productIds).stream()
                .collect(java.util.stream.Collectors.toMap(ProductResponse::getId, p -> p, (a, b) -> a));

        return page.getContent().stream()
                .map(review -> reviewMapper.toResponseWithDetails(
                        review,
                        productMap.getOrDefault(review.getProductId(), null),
                        toPublicUser(userMap.get(review.getUserId()))))
                .toList();
    }

    @Override
    public CursorResponse<ReviewResponse> findAllReviewsPaged(int page, int size) {
        Page<Review> reviewPage = reviewRepository.findAll(PageRequest.of(page, size));
        if (reviewPage.isEmpty()) {
            return ResultHelper.toCursor(new org.springframework.data.domain.PageImpl<>(
                    List.<ReviewResponse>of(),
                    reviewPage.getPageable(),
                    reviewPage.getTotalElements()));
        }

        List<Long> userIds = reviewPage.getContent().stream()
                .map(Review::getUserId)
                .distinct()
                .toList();
        List<Long> productIds = reviewPage.getContent().stream()
                .map(Review::getProductId)
                .distinct()
                .toList();

        java.util.Map<Long, UserResponse> userMap = userService.getUserResponsesByIds(userIds);
        java.util.Map<Long, ProductResponse> productMap = productService.getProductResponsesByIds(productIds).stream()
                .collect(java.util.stream.Collectors.toMap(ProductResponse::getId, p -> p, (a, b) -> a));

        List<ReviewResponse> mapped = reviewPage.getContent().stream()
                .map(review -> reviewMapper.toResponseWithDetails(
                        review,
                        productMap.getOrDefault(review.getProductId(), null),
                        toPublicUser(userMap.get(review.getUserId()))))
                .toList();

        return ResultHelper.toCursor(
                new org.springframework.data.domain.PageImpl<>(mapped, reviewPage.getPageable(), reviewPage.getTotalElements()));
    }

    @Override
    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepository.findByProductId(productId);
        if (reviews.isEmpty()) {
            return List.of();
        }

        // Ürün bilgisi tek sorgu — hepsi aynı product
        ProductResponse productResponse = productService.getProductResponseById(productId);

        // Kullanıcı bilgilerini batch çek
        List<Long> userIds = reviews.stream()
                .map(Review::getUserId)
                .distinct()
                .toList();

        java.util.Map<Long, UserResponse> rawUserMap = userService.getUserResponsesByIds(userIds);
        java.util.Map<Long, UserResponse> userMap = new java.util.HashMap<>();
        for (var entry : rawUserMap.entrySet()) {
            userMap.put(entry.getKey(), toPublicUser(entry.getValue()));
        }

        return reviews.stream()
                .map(review -> reviewMapper.toResponseWithDetails(
                        review, productResponse, userMap.get(review.getUserId())))
                .toList();
    }

    private ReviewResponse getDetails(Review review) {
        UserResponse userResponse = toPublicUser(userService.getUserResponseById(review.getUserId()));
        ProductResponse productResponse = productService.getProductResponseById(review.getProductId());
        return reviewMapper.toResponseWithDetails(review, productResponse, userResponse);
    }

    private UserResponse toPublicUser(UserResponse user) {
        if (user == null) {
            return null;
        }
        UserResponse publicUser = new UserResponse();
        publicUser.setId(user.getId());
        publicUser.setName(user.getName());
        return publicUser;
    }
}
