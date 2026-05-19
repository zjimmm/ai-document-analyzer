package com.example.documentanalyzer.client;

import com.example.documentanalyzer.dto.AnalyzeRequest;
import com.example.documentanalyzer.dto.AnalyzeResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class PythonAiClient {

    private final WebClient webClient;

    public PythonAiClient(@Qualifier("pythonAiWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public AnalyzeResponse analyze(AnalyzeRequest request) {
        return webClient.post()
                .uri("/analyze")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AnalyzeResponse.class)
                .block();
    }
}
