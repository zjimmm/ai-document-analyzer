package com.example.documentanalyzer.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record AnalyzeResponse(
        String summary,
        String extractedText,
        JsonNode structuredData
) {}
