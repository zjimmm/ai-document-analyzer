package com.example.documentanalyzer.controller;

import com.example.documentanalyzer.client.ExportClient;
import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.dto.ExportRequest;
import com.example.documentanalyzer.entity.Document;
import com.example.documentanalyzer.repository.DocumentRepository;
import com.example.documentanalyzer.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final ExportClient exportClient;

    @PostMapping
    public ResponseEntity<DocumentResponse> upload(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(documentService.upload(file));
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> findAll() {
        return ResponseEntity.ok(documentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.findById(id));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportDocument(@PathVariable UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));

        if (!"COMPLETED".equals(document.getStatus())) {
            return ResponseEntity.unprocessableEntity().build();
        }

        ExportRequest exportRequest = new ExportRequest(
                document.getFileName(),
                document.getStatus(),
                document.getSummary(),
                document.getExtractedText(),
                document.getExtractedJson()
        );

        byte[] pdfBytes = exportClient.export(exportRequest);

        String safeFileName = document.getFileName().replaceAll("[^a-zA-Z0-9._-]", "_");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName + ".pdf\"")
                .body(pdfBytes);
    }
}
