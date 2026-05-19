package com.example.documentanalyzer.controller;

import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DocumentController.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @Test
    void upload_returnsOkWithDocumentResponse() throws Exception {
        UUID id = UUID.randomUUID();
        DocumentResponse response = new DocumentResponse(
                id, "invoice.pdf", "application/pdf", "COMPLETED",
                "Invoice summary", "raw text", "{}", LocalDateTime.now()
        );
        when(documentService.upload(any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", "pdf bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/documents").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.fileName").value("invoice.pdf"));
    }

    @Test
    void findAll_returnsEmptyList() throws Exception {
        when(documentService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void findById_returnsDocument() throws Exception {
        UUID id = UUID.randomUUID();
        DocumentResponse response = new DocumentResponse(
                id, "receipt.png", "image/png", "COMPLETED",
                "Receipt summary", "raw text", "{}", LocalDateTime.now()
        );
        when(documentService.findById(id)).thenReturn(response);

        mockMvc.perform(get("/api/documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("receipt.png"));
    }

    @Test
    void upload_withInvalidType_returnsBadRequest() throws Exception {
        when(documentService.upload(any()))
                .thenThrow(new IllegalArgumentException("File type not allowed: text/plain"));

        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "content".getBytes()
        );

        mockMvc.perform(multipart("/api/documents").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
