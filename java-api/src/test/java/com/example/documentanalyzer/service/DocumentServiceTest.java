package com.example.documentanalyzer.service;

import com.example.documentanalyzer.client.PythonAiClient;
import com.example.documentanalyzer.dto.AnalyzeResponse;
import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.entity.Document;
import com.example.documentanalyzer.mapper.DocumentMapper;
import com.example.documentanalyzer.repository.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private PythonAiClient pythonAiClient;

    @Spy
    private ObjectMapper objectMapper;

    @Spy
    private DocumentMapper documentMapper = Mappers.getMapper(DocumentMapper.class);

    @InjectMocks
    private DocumentService documentService;

    @Test
    void upload_withValidPdf_returnsCompletedDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", "pdf content".getBytes()
        );

        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document doc = inv.getArgument(0);
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });
        when(pythonAiClient.analyze(any())).thenReturn(
                new AnalyzeResponse("Invoice summary", "raw text", null)
        );

        DocumentResponse result = documentService.upload(file);

        assertThat(result.fileName()).isEqualTo("invoice.pdf");
        assertThat(result.status()).isEqualTo("COMPLETED");
    }

    @Test
    void upload_whenPythonFails_returnsFailedDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", "pdf content".getBytes()
        );

        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document doc = inv.getArgument(0);
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });
        when(pythonAiClient.analyze(any())).thenThrow(new RuntimeException("Python down"));

        DocumentResponse result = documentService.upload(file);

        assertThat(result.status()).isEqualTo("FAILED");
        assertThat(result.summary()).contains("Python down");
    }

    @Test
    void upload_withUnsupportedType_throwsIllegalArgumentException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "content".getBytes()
        );

        assertThatThrownBy(() -> documentService.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not allowed");
    }
}
