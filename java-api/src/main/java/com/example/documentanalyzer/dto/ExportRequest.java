package com.example.documentanalyzer.dto;

public record ExportRequest(
        String fileName,
        String status,
        String summary,
        String extractedText,
        String structuredData
) {}
