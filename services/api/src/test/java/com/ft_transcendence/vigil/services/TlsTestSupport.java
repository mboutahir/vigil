package com.ft_transcendence.vigil.services;

public final class TlsTestSupport {
    private TlsTestSupport() {}

    // Public certificates only; the test keys were discarded when these fixtures were generated.
    public static final String CA = """
            -----BEGIN CERTIFICATE-----
            MIIDETCCAfmgAwIBAgIUUOR2sKgxc6Yodhp2PykrLiWgDFYwDQYJKoZIhvcNAQEL
            BQAwGDEWMBQGA1UEAwwNVmlnaWwtVGVzdC1DQTAeFw0yNjExMTQxMzExMzNaFw0z
            NjExMTExMzExMzNaMBgxFjAUBgNVBAMMDVZpZ2lsLVRlc3QtQ0EwggEiMA0GCSqG
            SIb3DQEBAQUAA4IBDwAwggEKAoIBAQCQ5kst9saXiSZS0qR3ttQv8RSjNEykq5sg
            ri8PRELYbwtcPDdp+qxuc1OcBy8+8Z0XNZLCCzbGJiXe4jaXj/ouzY0C+xQXvxhw
            xjZrZyuZUNft7pWQ82vIYoYR7JLDh+jr0ezC7vIGnZkx9Q4SbpxCSKCn+lSlER8V
            RN0g8x8X8iJjx4pko+ykqlBZ3kG2nwkYC55jgl2seOFPQHQYPcUdia62Rj8BHAFE
            CbOz6xjyLkk8f8MfMPftIyE5lietNX9ugOPZOuFF11SJjUqgYX88MpLkGYzbiTj2
            UUp5IU/yPbjY0DdQj84EoE9anM7rjT+q6WzCcg6ErQe/3ATCsMxnAgMBAAGjUzBR
            MB0GA1UdDgQWBBQ04srisCqY/gwYy7U2T7ixbDY+VjAfBgNVHSMEGDAWgBQ04sri
            sCqY/gwYy7U2T7ixbDY+VjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA
            A4IBAQAql37owDawKYsApiaDid+ZN9lXCPax3b/fWPYweFLe7IMSrL03kXYGKM59
            4zjfhA8Ust+IXjcXRTSLJAHTgS8zqF3ExfAR+3e3CfLSxLapkr4PjybcmT6r1FTm
            cpjwL6HKPBfxL3khli7Dic3atV2Wg6tUNSle+NRD46OxtjfZbIrbglu9Zu8OAxhD
            BLnhfGhRFBTRDI4B4AFLOqU1i4h7ALAqxUdAMoptPrFcwOeagZ7SkjOTqgBgq6i7
            x9tst2KBTxpXfd0f5PezhrbfCiepvgoRxaOaHP+CfzGQ5Z0W4mgDGpQD8Hq3BqmD
            LgUQiaFAs6Iw6wqm/Pa83Afoy1fG
            -----END CERTIFICATE-----
            """;

    public static final String LEAF = """
            -----BEGIN CERTIFICATE-----
            MIIDEjCCAfqgAwIBAgIUf/sE7rE1vOl1Rd3Kz3vDIVeQbs8wDQYJKoZIhvcNAQEL
            BQAwGjEYMBYGA1UEAwwPVmlnaWwtVGVzdC1MZWFmMB4XDTI2MTExNDEzMTEzM1oX
            DTM2MTExMTEzMTEzM1owGjEYMBYGA1UEAwwPVmlnaWwtVGVzdC1MZWFmMIIBIjAN
            BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9Mj8AF8OzRNdUH3lw1moF3x3HP/P
            ekMO79UXGX71BsbNzrbW4abAUILlse7ZLVobjGIH6r7mQS1q23IzsLfMXbdO26RI
            Jx47coHXR2Sm02sUIlIp4Gn4Agcrp9bxFWx7ERJ/uZS+mbC3bgbhOvcqo4cPhQkq
            mPu3f+gF5HikQLy0XcTO3l4wZkhN5T7lZ31RtCeMy5cAkcrbwYsOSej8p9oKXzS+
            KEsja2tpl0uUSrnxelu7TdBt2bLJAtg1ORH4LouDl8bJo5IlEU8ChAVEd2w3hZOD
            FAXDR9RiyK6hHXArJCtK8wFyT1oO+vs381hRsf5FxWo2oRB09Mm2ruN6+wIDAQAB
            o1AwTjAdBgNVHQ4EFgQUSU2NImMrQMb4NMYUieD5baYGcmswHwYDVR0jBBgwFoAU
            SU2NImMrQMb4NMYUieD5baYGcmswDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsF
            AAOCAQEA6l5C0Uut2+LA8E3yF2f2ZYkIom84hDElwyMgb2UU8Pq8pWWGy1sTW3G2
            RglHALMcZwk5QNTFuRywWerCwyZiurHJJmnFMvdWD6c3V13Dt4cDb/llZsDBPEoK
            HYeDyDLx9HUqZklOFNIU6GE6rbg5fYtSieXUyXBwc3aIBm3cxcYhA2UkZMqhKxhL
            Rd/WMcoRTD1rrHU2ZkXCHfzc1bV9O13yXiFzWQ8zFXH+FBJmglKVEmHZVbBkXtuj
            SQJ0r4f/65C5e4b6AK6mqyJ0OqdVGxrc4iDeMp+OdGG/4nmsBfKN0W2b3Bg6VUma
            kcYTWm0i5MoUTIvT4wmG+gpMEvAt6w==
            -----END CERTIFICATE-----
            """;
}
