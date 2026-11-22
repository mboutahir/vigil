package com.ft_transcendence.vigil.services;

import com.ft_transcendence.vigil.exceptions.InvalidRequestException;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
@Component
public class WebhookUrlValidator {

    public void validate(String url) {
        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException | NullPointerException ex) {
            throw new InvalidRequestException("invalid webhook url");
        }

        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            throw new InvalidRequestException("webhook url must be https");
        }

        try {
            for (InetAddress a : InetAddress.getAllByName(uri.getHost())) {
                if (a.isAnyLocalAddress() || a.isLoopbackAddress()
                        || a.isLinkLocalAddress() || a.isSiteLocalAddress()
                        || a.isMulticastAddress()) {
                    throw new InvalidRequestException("webhook url must be public");
                }
            }
        } catch (UnknownHostException ex) {
            throw new InvalidRequestException("webhook hostname could not be resolved");
        }
    }
}