package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.backend.model.Appeal;
import org.backend.payload.request.AppealRequest;
import org.backend.payload.response.AppealResponse;
import org.backend.payload.response.MessageResponse;
import org.backend.service.AppealService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appeals")
@Tag(name = "Appeals Management", description = "APIs for submitting and managing account reactivation appeals")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, maxAge = 3600) // Adjust CORS as needed
public class AppealController {

    @Autowired
    private AppealService appealService;

    @PostMapping
    @Operation(summary = "Submit a new appeal", description = "Public endpoint for deactivated users to submit an appeal.")
    @ApiResponse(responseCode = "201", description = "Appeal submitted successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input or user not found/active")
    // NO @PreAuthorize - this endpoint must be public
    public ResponseEntity<?> submitAppeal(@Valid @RequestBody AppealRequest appealRequest) {
        try {
            Appeal submittedAppeal = appealService.submitAppeal(appealRequest);
            // Return AppealResponse or just a success message
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(AppealResponse.fromAppeal(submittedAppeal));
        } catch (Exception e) {
            // Handle specific exceptions like NotFoundException differently if needed
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Get all appeals", description = "Retrieve all appeals (Officials/Admins only).",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "List of appeals")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<List<AppealResponse>> getAllAppeals() {
        List<Appeal> appeals = appealService.getAllAppeals();
        List<AppealResponse> response = appeals.stream()
                .map(AppealResponse::fromAppeal)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // Optional: Endpoint to get only PENDING appeals
    @GetMapping("/pending")
    @Operation(summary = "Get pending appeals", description = "Retrieve only PENDING appeals (Officials/Admins only).",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "List of pending appeals")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<List<AppealResponse>> getPendingAppeals() {
        List<Appeal> appeals = appealService.getPendingAppeals();
        List<AppealResponse> response = appeals.stream()
                .map(AppealResponse::fromAppeal)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{appealId}/approve")
    @Operation(summary = "Approve an appeal", description = "Approve a pending appeal and reactivate the user account (Officials/Admins only).",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Appeal approved successfully")
    @ApiResponse(responseCode = "404", description = "Appeal not found")
    @ApiResponse(responseCode = "400", description = "Appeal not in PENDING status or error during activation")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<?> approveAppeal(@PathVariable Long appealId) {
        try {
            Appeal approvedAppeal = appealService.approveAppeal(appealId);
            return ResponseEntity.ok(AppealResponse.fromAppeal(approvedAppeal));
        } catch (Exception e) {
            // Handle specific exceptions (NotFound, IllegalState) differently?
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{appealId}/reject")
    @Operation(summary = "Reject an appeal", description = "Reject a pending appeal (Officials/Admins only).",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Appeal rejected successfully")
    @ApiResponse(responseCode = "404", description = "Appeal not found")
    @ApiResponse(responseCode = "400", description = "Appeal not in PENDING status")
    @PreAuthorize("hasRole('OFFICIAL') or hasRole('ADMIN')")
    public ResponseEntity<?> rejectAppeal(@PathVariable Long appealId) {
        try {
            Appeal rejectedAppeal = appealService.rejectAppeal(appealId);
            return ResponseEntity.ok(AppealResponse.fromAppeal(rejectedAppeal));
        } catch (Exception e) {
            // Handle specific exceptions (NotFound, IllegalState) differently?
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}