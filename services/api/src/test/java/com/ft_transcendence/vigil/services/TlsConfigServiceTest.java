package com.ft_transcendence.vigil.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Map;
import java.util.stream.Stream;

import static com.ft_transcendence.vigil.services.TlsTestSupport.*;
import static org.junit.jupiter.api.Assertions.*;

class TlsConfigServiceTest {
    @TempDir Path temporary;

    private TlsConfigService service() {
        return new TlsConfigService(temporary.resolve("root.crt").toString());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void caPathSupportsDefaultAndDeploymentEnvironmentName(boolean overrides) {
        try (var context = new AnnotationConfigApplicationContext()) {
            if (overrides) {
                context.getEnvironment().getPropertySources().addFirst(new SystemEnvironmentPropertySource(
                        "tls-test-env", Map.of("VIGIL_TLS_CA_PATH", "/test/public.crt")));
            }
            context.register(TlsConfigService.class);
            context.refresh();
            TlsConfigService service = context.getBean(TlsConfigService.class);
            assertEquals(Path.of(overrides ? "/test/public.crt" : "/etc/vigil/ca/root.crt"),
                    ReflectionTestUtils.getField(service, "caPath"));
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://vigil.localhost:8443", "https://localhost:8443", "https://host.docker.internal:8443",
            "https://VIGIL.localhost:8443", " https://vigil.localhost:8443 ", "https://vigil.localhost"})
    void localAddressesAreVerifiedWithLocalTls(String address) {
        var result = service().configure(address);
        assertEquals(200, result.httpStatus());
        String origin = (String) result.body().get("address");
        assertTrue(origin.startsWith("https://") && origin.equals(origin.toLowerCase()), origin);
        assertEquals(true, result.body().get("configured"));
        assertEquals("verified", result.body().get("status"));
        assertEquals("local", result.body().get("tls_mode"));
        assertEquals(origin + "/otlp", result.body().get("otlp_endpoint"));
        assertEquals("/api/config/tls/ca", result.body().get("ca_download_url"));
    }

    @Test
    void keepsThePortInTheOriginAndOtlpEndpoint() {
        var result = service().configure("https://vigil.localhost:8443");
        assertEquals("https://vigil.localhost:8443", result.body().get("address"));
        assertEquals("https://vigil.localhost:8443/otlp", result.body().get("otlp_endpoint"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://vigil.example.com", "https://192.168.1.20:8443", "https://[::1]:8443",
            "https://localhost.evil.com", "https://evil.localhost:8443"})
    void nonLocalAddressesAreRefusedWithAClearMessage(String address) {
        var result = service().configure(address);
        assertEquals(400, result.httpStatus());
        assertEquals(1, result.body().size());
        assertTrue(result.body().get("message").toString().contains("vigil.localhost"));
    }

    static Stream<String> malformedAddresses() {
        return Stream.of("", "   ", "vigil.localhost:8443", "http://vigil.localhost:8443",
                "https://user:password@vigil.localhost:8443", "https://vigil.localhost:8443/otlp",
                "https://vigil.localhost:8443?x=1", "https://vigil.localhost:8443#x",
                "https://vigil.localhost:99999", "https://vigil.localhost:0", "https://vig il.localhost", "https://");
    }

    @ParameterizedTest
    @MethodSource("malformedAddresses")
    void malformedAddressesAreRefused(String address) {
        var result = service().configure(address);
        assertEquals(400, result.httpStatus());
        assertEquals(1, result.body().size());
        assertTrue(result.body().get("message").toString().startsWith("Invalid address"));
    }

    @Test
    void downloadsOnlyParsedCaCertificatesAndCanonicalizesPem() throws Exception {
        Files.writeString(temporary.resolve("root.crt"), " \n" + CA.replace("\n", "\r\n") + "\n" + CA);
        byte[] pem = service().publicCa();
        assertEquals(CA + CA, new String(pem, java.nio.charset.StandardCharsets.US_ASCII));
        var certificates = CertificateFactory.getInstance("X.509").generateCertificates(new ByteArrayInputStream(pem));
        assertEquals(2, certificates.size());
        certificates.forEach(certificate -> assertTrue(((X509Certificate) certificate).getBasicConstraints() >= 0));
        assertFalse(new String(pem, java.nio.charset.StandardCharsets.US_ASCII).contains("PRIVATE KEY"));
    }

    static Stream<String> invalidCaFiles() {
        return Stream.of("", "garbage", LEAF, CA + LEAF, "junk\n" + CA, CA + "junk",
                CA.replace("MIIDET", "!IIDET"),
                "-----BEGIN CERTIFICATE-----\nYWJj\n-----END CERTIFICATE-----\n",
                CA + "-----BEGIN PRIVATE KEY-----\nYWJj\n-----END PRIVATE KEY-----\n",
                "-----BEGIN RSA PRIVATE KEY-----\nYWJj\n-----END RSA PRIVATE KEY-----\n" + CA,
                CA + "-----BEGIN PUBLIC KEY-----\nYWJj\n-----END PUBLIC KEY-----\n",
                " ".repeat(64 * 1024 + 1));
    }

    @ParameterizedTest
    @MethodSource("invalidCaFiles")
    void refusesMalformedNonCaOversizedOrMixedPrivateContent(String content) throws Exception {
        Files.writeString(temporary.resolve("root.crt"), content);
        assertCaUnavailable();
    }

    @Test
    void missingCaFileFailsSafely() {
        assertCaUnavailable();
    }

    private void assertCaUnavailable() {
        var ex = assertThrows(TlsConfigService.UnavailableException.class, () -> service().publicCa());
        assertFalse(ex.getMessage().contains(temporary.toString()));
        assertFalse(ex.getMessage().contains("PRIVATE KEY"));
        assertTrue(ex.getMessage().contains("provisioned"));
        assertNull(ex.getCause());
    }
}
