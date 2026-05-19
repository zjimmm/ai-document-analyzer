package com.example.documentanalyzer.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String fileName,
        String fileType,
        String status,
        String summary,
        String extractedText,
        String extractedJson,
        LocalDateTime createdAt
) {}
