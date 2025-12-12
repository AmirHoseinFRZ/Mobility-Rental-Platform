package com.mobility.platform.review.service;

import com.mobility.platform.common.exception.ResourceNotFoundException;
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
    
    private final ReviewRepository reviewRepository;
    
    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {
        log.info("Creating review for booking: {}", request.getBookingId());
        
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
        return mapToResponse(review);
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





