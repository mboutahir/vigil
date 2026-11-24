# CRS 4.30.0 on Nginx Alpine, using the dated release tag.
FROM owasp/modsecurity-crs:4.30.0-nginx-alpine-202611190211

# Keep the image's supported templating/entrypoint mechanism.
COPY nginx/default.conf.template /etc/nginx/templates/conf.d/default.conf.template
COPY nginx/proxy_backend.conf.template /etc/nginx/templates/includes/proxy_backend.conf.template

# Load Vigil-specific rules before CRS.
COPY rules/REQUEST-899-CUSTOM.conf /etc/modsecurity.d/owasp-crs/rules/REQUEST-899-CUSTOM.conf
