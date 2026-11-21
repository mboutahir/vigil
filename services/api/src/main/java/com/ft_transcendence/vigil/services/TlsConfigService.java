package com.ft_transcendence.vigil.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class TlsConfigService {
    // the names caddy serves with its local CA (see services/reverse-proxy/Caddyfile)
    public static final Set<String> LOCAL_HOSTS = Set.of("localhost", "vigil.localhost", "host.docker.internal");
    private static final int MAX_CA_BYTES = 64 * 1024;
    private static final Pattern CERTIFICATE = Pattern.compile(
            "-----BEGIN CERTIFICATE-----\\s*([A-Za-z0-9+/=\\r\\n\\t ]+)\\s*-----END CERTIFICATE-----");
    private static final String INVALID_ADDRESS =
            "Invalid address. Use an HTTPS origin such as https://vigil.localhost:8443.";
    private static final String NOT_LOCAL =
            "Only local addresses are supported: localhost, vigil.localhost or host.docker.internal, "
                    + "with VIGIL's HTTPS port (for example vigil.localhost:8443).";
    private static final String CA_UNAVAILABLE =
            "The public TLS CA certificate is unavailable. Check that the public CA certificate is provisioned, then retry.";

    private final Path caPath;

    public TlsConfigService(@Value("${vigil.tls-ca-path:/etc/vigil/ca/root.crt}") String caPath) {
        this.caPath = Path.of(caPath);
    }

    public record ProtocolResult(int httpStatus, Map<String, Object> body) {}

    public static class UnavailableException extends RuntimeException {
        private UnavailableException(String message) {
            super(message);
        }
    }

    // caddy already serves every local name, so checking the address is enough: nothing to reload
    public ProtocolResult configure(String address) {
        URI uri;
        try {
            uri = new URI(address.trim());
        } catch (URISyntaxException | RuntimeException ex) {
            return error(INVALID_ADDRESS);
        }
        String path = uri.getRawPath();
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getRawUserInfo() != null
                || uri.getRawQuery() != null || uri.getRawFragment() != null
                || (path != null && !path.isEmpty()) || uri.getPort() == 0 || uri.getPort() > 65535) {
            return error(INVALID_ADDRESS);
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (!LOCAL_HOSTS.contains(host)) {
            return error(NOT_LOCAL);
        }
        String origin = "https://" + host + (uri.getPort() == -1 ? "" : ":" + uri.getPort());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("address", origin);
        body.put("configured", true);
        body.put("status", "verified");
        body.put("tls_mode", "local");
        body.put("otlp_endpoint", origin + "/otlp");
        body.put("ca_download_url", "/api/config/tls/ca");
        return new ProtocolResult(200, body);
    }

    private static ProtocolResult error(String message) {
        return new ProtocolResult(400, Map.of("message", message));
    }

    public byte[] publicCa() {
        try {
            if (!Files.isRegularFile(caPath)) {
                throw new IOException("Missing public CA file");
            }
            byte[] input;
            try (var stream = Files.newInputStream(caPath)) {
                input = stream.readNBytes(MAX_CA_BYTES + 1);
            }
            if (input.length > MAX_CA_BYTES) {
                throw new IOException("CA file exceeds limit");
            }
            String pem = new String(input, StandardCharsets.US_ASCII);
            var matcher = CERTIFICATE.matcher(pem);
            var factory = CertificateFactory.getInstance("X.509");
            StringBuilder output = new StringBuilder();
            int end = 0;
            while (matcher.find()) {
                if (!pem.substring(end, matcher.start()).isBlank()) {
                    throw new IOException("Unexpected PEM content");
                }
                byte[] der = Base64.getDecoder().decode(matcher.group(1).replaceAll("\\s", ""));
                X509Certificate certificate = (X509Certificate) factory.generateCertificate(new ByteArrayInputStream(der));
                if (certificate.getBasicConstraints() < 0 || !Arrays.equals(der, certificate.getEncoded())) {
                    throw new IOException("Not a CA certificate");
                }
                output.append("-----BEGIN CERTIFICATE-----\n")
                        .append(Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(certificate.getEncoded()))
                        .append("\n-----END CERTIFICATE-----\n");
                end = matcher.end();
            }
            if (output.isEmpty() || !pem.substring(end).isBlank() || output.length() > MAX_CA_BYTES) {
                throw new IOException("Invalid CA PEM");
            }
            return output.toString().getBytes(StandardCharsets.US_ASCII);
        } catch (Exception ex) {
            throw new UnavailableException(CA_UNAVAILABLE);
        }
    }
}
