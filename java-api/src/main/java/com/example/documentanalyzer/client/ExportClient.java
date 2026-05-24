package com.example.documentanalyzer.client;

import com.example.documentanalyzer.dto.ExportRequest;
import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;

import java.time.Duration;

@Component
public class ExportClient {

    private final WebClient webClient;

    public ExportClient(
            WebClient.Builder webClientBuilder,
            @Value("${export-service.base-url:http://localhost:8002}") String baseUrl
    ) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30_000)
                .responseTimeout(Duration.ofSeconds(30));

        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    public byte[] export(ExportRequest request) {
        try {
            return webClient.post()
                    .uri("/export")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .blockOptional()
                    .orElseThrow(() -> new RuntimeException("Export service returned empty response"));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Export service call failed: " + e.getMessage(), e);
        }
    }
}
