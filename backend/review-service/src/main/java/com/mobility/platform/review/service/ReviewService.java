package com.mobility.platform.review.service;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.common.exception.BusinessException;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import com.mobility.platform.review.client.BookingClient;
import com.mobility.platform.review.client.VehicleClient;
import com.mobility.platform.review.client.dto.BookingInfoDto;
import com.mobility.platform.review.dto.ReviewRequest;
import com.mobility.platform.review.dto.ReviewResponse;
import com.mobility.platform.review.entity.Review;
import com.mobility.platform.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private static final String STATUS_COMPLETED = "COMPLETED";
    
    private final ReviewRepository reviewRepository;
    private final BookingClient bookingClient;
    private final VehicleClient vehicleClient;
    
    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {
        log.info("Creating review for booking: {}", request.getBookingId());
        
        validateReviewEligibility(request);
        
        Review review = new Review();
        review.setUserId(request.getUserId());
        review.setBookingId(request.getBookingId());
        review.setVehicleId(request.getVehicleId());
        review.setDriverId(request.getDriverId());
        review.setReviewType(request.getReviewType());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setVerified(true);
        review.setApproved(true);
        
        review = reviewRepository.save(review);
        
        if (request.getReviewType() == Review.ReviewType.VEHICLE && request.getVehicleId() != null) {
            updateVehicleRatingAfterReview(request.getVehicleId());
        }
        
        return mapToResponse(review);
    }
    
    private void updateVehicleRatingAfterReview(Long vehicleId) {
        try {
            Double avgRating = reviewRepository.getAverageRatingForVehicle(vehicleId);
            Long count = reviewRepository.countReviewsForVehicle(vehicleId);
            if (avgRating != null && count != null) {
                vehicleClient.updateVehicleRating(vehicleId, avgRating, count.intValue());
                log.info("Updated vehicle {} rating to {} ({} reviews)", vehicleId, avgRating, count);
            }
        } catch (Exception e) {
            log.warn("Failed to update vehicle rating for vehicle {}: {}", vehicleId, e.getMessage());
        }
    }
    
    /**
     * Only users who have completed a booking for this vehicle/driver can submit a review.
     * Validates: booking exists, belongs to user, is COMPLETED, vehicle/driver matches, no duplicate review.
     */
    private void validateReviewEligibility(ReviewRequest request) {
        ApiResponse<BookingInfoDto> apiResponse;
        try {
            apiResponse = bookingClient.getBookingById(request.getBookingId());
        } catch (Exception e) {
            log.warn("Failed to fetch booking {} for review validation: {}", request.getBookingId(), e.getMessage());
            throw new BusinessException("امکان بررسی رزرو وجود ندارد. لطفاً بعداً تلاش کنید.", "BOOKING_SERVICE_UNAVAILABLE");
        }
        
        if (apiResponse == null || !apiResponse.isSuccess() || apiResponse.getData() == null) {
            throw new ResourceNotFoundException("Booking", "id", request.getBookingId());
        }
        
        BookingInfoDto booking = apiResponse.getData();
        
        if (!booking.getUserId().equals(request.getUserId())) {
            throw new BusinessException("فقط کاربری که این وسیله نقلیه را رزرو کرده می‌تواند نظر ثبت کند.", "NOT_BOOKING_RENTER");
        }
        
        if (!STATUS_COMPLETED.equals(booking.getStatus())) {
            throw new BusinessException("فقط برای رزروهای تکمیل‌شده امکان ثبت نظر وجود دارد.", "BOOKING_NOT_COMPLETED");
        }
        
        if (request.getReviewType() == Review.ReviewType.VEHICLE) {
            if (request.getVehicleId() == null || !request.getVehicleId().equals(booking.getVehicleId())) {
                throw new BusinessException("شناسه وسیله نقلیه با رزرو مطابقت ندارد.", "VEHICLE_MISMATCH");
            }
        } else if (request.getReviewType() == Review.ReviewType.DRIVER) {
            if (booking.getDriverId() == null) {
                throw new BusinessException("این رزرو بدون راننده بوده و امکان ثبت نظر برای راننده وجود ندارد.", "NO_DRIVER");
            }
            if (request.getDriverId() == null || !request.getDriverId().equals(booking.getDriverId())) {
                throw new BusinessException("شناسه راننده با رزرو مطابقت ندارد.", "DRIVER_MISMATCH");
            }
        }
        
        if (reviewRepository.existsByBookingIdAndReviewType(request.getBookingId(), request.getReviewType())) {
            throw new BusinessException("شما قبلاً برای این رزرو نظر ثبت کرده‌اید.", "DUPLICATE_REVIEW");
        }
    }
    
    public List<ReviewResponse> getVehicleReviews(Long vehicleId) {
        return reviewRepository.findByVehicleId(vehicleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<ReviewResponse> getDriverReviews(Long driverId) {
        return reviewRepository.findByDriverId(driverId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<ReviewResponse> getUserReviews(Long userId) {
        return reviewRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public Double getAverageRatingForVehicle(Long vehicleId) {
        return reviewRepository.getAverageRatingForVehicle(vehicleId);
    }
    
    public Double getAverageRatingForDriver(Long driverId) {
        return reviewRepository.getAverageRatingForDriver(driverId);
    }
    
    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setUserId(review.getUserId());
        response.setBookingId(review.getBookingId());
        response.setVehicleId(review.getVehicleId());
        response.setDriverId(review.getDriverId());
        response.setReviewType(review.getReviewType());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setResponse(review.getResponse());
        response.setVerified(review.getVerified());
        response.setApproved(review.getApproved());
        response.setHelpfulCount(review.getHelpfulCount());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }
}






