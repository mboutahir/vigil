package com.ft_transcendence.vigil.services;

import com.ft_transcendence.vigil.configuration.VigilProperties;
import com.ft_transcendence.vigil.domain.entities.Alerts.AlertHistory;
import com.ft_transcendence.vigil.domain.entities.Webhook.Webhook;
import com.ft_transcendence.vigil.repositories.webhook.WebhookRepository;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
public class WebhookDeliveryService {
    private static final int MAX_MESSAGE_LENGTH = 2_000;

    private final WebhookRepository webhookRepository;
    private final VigilProperties vigilProperties;
    private final WebhookUrlValidator webhookUrlValidator;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public WebhookDeliveryService(WebhookRepository webhookRepository, VigilProperties vigilProperties,
                                  WebhookUrlValidator webhookUrlValidator, ObjectMapper objectMapper) {
        this.webhookRepository = webhookRepository;
        this.vigilProperties = vigilProperties;
        this.webhookUrlValidator = webhookUrlValidator;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public void sendWebhooksService(AlertHistory alertHistory, String analysis) {
        List<Webhook> webhooks = webhookRepository.findAll();
        if (webhooks.isEmpty())
            return;

        UUID alertId = alertHistory.getId();
        String message = alertHistory.getSeverity() + " alert: " + alertHistory.getMetricName()
                + " on " + alertHistory.getService();
        if (analysis != null && !analysis.isBlank())
            message += "\n" + analysis;
        String link = "\n" + vigilProperties.getFrontendBaseUrl() + "/alerts?alert=" + alertId;
        int end = Math.min(message.length(), MAX_MESSAGE_LENGTH - link.length());
        message = message.substring(0, end) + link;

        String requestBody = objectMapper.writeValueAsString(new WebhookRequestDto(message, message));
        executor.execute(() -> {
            for (Webhook webhook : webhooks)
                sendWebhook(webhook, alertId, requestBody);
        });
    }

    private void sendWebhook(Webhook webhook, UUID alertId, String requestBody) {
        try {
            String url = webhook.getUrl();
            webhookUrlValidator.validate(url);
            ResponseEntity<Void> response = restClient.post()
                    .uri(URI.create(url))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();
            if (!response.getStatusCode().is2xxSuccessful())
                log.error("Webhook {} failed for alert {} with HTTP status {}",
                        webhook.getId(), alertId, response.getStatusCode().value());
        } catch (RestClientResponseException e) {
            log.error("Webhook {} failed for alert {} with HTTP status {}",
                    webhook.getId(), alertId, e.getStatusCode().value());
        } catch (RuntimeException e) {
            log.error("Webhook {} failed for alert {} ({})", webhook.getId(), alertId, e.getClass().getSimpleName());
        }
    }

    @PreDestroy
    public void close() {
        executor.shutdownNow();
    }

    private record WebhookRequestDto(String content, String text) {
    }
}
