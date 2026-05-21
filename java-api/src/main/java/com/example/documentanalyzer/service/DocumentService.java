package com.example.documentanalyzer.service;

import com.example.documentanalyzer.client.PythonAiClient;
import com.example.documentanalyzer.dto.AnalyzeRequest;
import com.example.documentanalyzer.dto.AnalyzeResponse;
import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.entity.Document;
import com.example.documentanalyzer.mapper.DocumentMapper;
import com.example.documentanalyzer.repository.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PythonAiClient pythonAiClient;
    private final ObjectMapper objectMapper;
    private final DocumentMapper documentMapper;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf", "image/png", "image/jpg", "image/jpeg"
    );

    public DocumentResponse upload(MultipartFile file) throws IOException {
        validateFile(file);

        Document document = new Document();
        document.setFileName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setStatus("PENDING");
        documentRepository.save(document);

        try {
            document.setStatus("PROCESSING");
            documentRepository.save(document);

            String base64Content = Base64.getEncoder().encodeToString(file.getBytes());
            AnalyzeRequest request = new AnalyzeRequest(
                    base64Content, file.getOriginalFilename(), file.getContentType()
            );

            AnalyzeResponse response = pythonAiClient.analyze(request);
            document.setStatus("COMPLETED");
            document.setSummary(response.summary());
            document.setExtractedText(response.extractedText());
            if (response.structuredData() != null) {
                document.setExtractedJson(objectMapper.writeValueAsString(response.structuredData()));
            }
        } catch (Exception e) {
            document.setStatus("FAILED");
            document.setSummary("Analysis failed: " + e.getMessage());
        }

        documentRepository.save(document);
        return documentMapper.toResponse(document);
    }

    public List<DocumentResponse> findAll() {
        return documentRepository.findAll().stream()
                .map(documentMapper::toResponse)
                .toList();
    }

    public DocumentResponse findById(UUID id) {
        return documentRepository.findById(id)
                .map(documentMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }
    }
}
