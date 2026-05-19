package com.example.documentanalyzer.dto;

public record AnalyzeRequest(
        String fileContent,
        String fileName,
        String fileType
) {}
