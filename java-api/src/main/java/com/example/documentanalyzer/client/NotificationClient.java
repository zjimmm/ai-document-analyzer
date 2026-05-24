package com.example.documentanalyzer.client;

import io.netty.channel.ChannelOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.Map;

@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final WebClient webClient;

    public NotificationClient(
            WebClient.Builder webClientBuilder,
            @Value("${notification-service.base-url:http://localhost:8001}") String baseUrl
    ) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                .responseTimeout(Duration.ofSeconds(5));

        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    public void notify(String documentId, String fileName, String status, String summary) {
        try {
            Map<String, Object> body = Map.of(
                    "documentId", documentId,
                    "fileName", fileName,
                    "status", status,
                    "summary", summary != null ? summary : ""
            );

            webClient.post()
                    .uri("/notify")
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .subscribe(
                            response -> log.debug("Notification sent for document {}", documentId),
                            error -> log.warn("Notification failed for document {}: {}", documentId, error.getMessage())
                    );
        } catch (Exception e) {
            log.warn("Failed to send notification for document {}: {}", documentId, e.getMessage());
        }
    }
}
