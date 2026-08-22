FROM arangodb:3.11.8

# The base image already provides the data directories and runs as root during build.
# Avoid chowning to a non-existent build-time user.

# Expose ports
EXPOSE 8529

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD nc -z 127.0.0.1 8529 || exit 1

# Set environment variables
ENV ARANGO_ROOT_PASSWORD=${ARANGO_ROOT_PASSWORD:-arangodb123}

# Start ArangoDB
CMD ["/entrypoint.sh", "arangod"]
