package org.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.backend.service.QRCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr-code")
@Tag(name = "QR Codes", description = "API for generating QR codes for service requests")
public class QRCodeController {

    @Autowired
    private QRCodeService qrCodeService;

    @Operation(summary = "Generate QR code for service request", description = "Generate a QR code for a specific service type and mode")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "QR code generated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "401", description = "Not authorized to generate QR codes")
    })
    @GetMapping("/generate")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<Map<String, String>> generateQRCode(
            @Parameter(description = "Service type", required = true)
            @RequestParam String serviceType,
            @Parameter(description = "Mode (auto/form)", required = true)
            @RequestParam String mode,
            @Parameter(description = "User ID", required = true)
            @RequestParam Long userId) {
        try {
            String qrContent = qrCodeService.createServiceRequestQRContent(serviceType, mode, userId);
            String qrCodeBase64 = qrCodeService.generateQRCodeBase64(qrContent, 300, 300);
            
            Map<String, String> response = new HashMap<>();
            response.put("qrCode", qrCodeBase64);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 