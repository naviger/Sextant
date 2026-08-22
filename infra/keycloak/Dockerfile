FROM quay.io/keycloak/keycloak:24.0.0

# Environment variables
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Expose ports
EXPOSE 8080 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD bash -lc 'exec 3<>/dev/tcp/localhost/8080 && printf "GET /health/ready HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n" >&3 && grep -q "200 OK" <&3 || exit 1'

# Start Keycloak in dev mode so runtime environment settings are honored
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--health-enabled=true", "--metrics-enabled=true"]
