package org.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.logging.Logger;

@Configuration
public class GoogleCloudStorageConfig {
    private static final Logger logger = Logger.getLogger(GoogleCloudStorageConfig.class.getName());

    @Value("${gcp.storage.project-id}")
    private String projectId;

    @Value("${gcp.storage.credentials.type:service_account}")
    private String credentialsType;

    @Value("${gcp.storage.credentials.project-id:${gcp.storage.project-id}}")
    private String credentialsProjectId;

    @Value("${gcp.storage.credentials.private-key-id:}")
    private String privateKeyId;

    @Value("${gcp.storage.credentials.private-key:}")
    private String privateKey;

    @Value("${gcp.storage.credentials.client-email:}")
    private String clientEmail;

    @Value("${gcp.storage.credentials.client-id:}")
    private String clientId;

    @Value("${gcp.storage.credentials.auth-uri:https://accounts.google.com/o/oauth2/auth}")
    private String authUri;

    @Value("${gcp.storage.credentials.token-uri:https://oauth2.googleapis.com/token}")
    private String tokenUri;

    @Value("${gcp.storage.credentials.auth-provider-x509-cert-url:https://www.googleapis.com/oauth2/v1/certs}")
    private String authProviderX509CertUrl;

    @Value("${gcp.storage.credentials.client-x509-cert-url:}")
    private String clientX509CertUrl;

    @Bean
    public Storage storage() throws IOException {
        logger.info("Initializing Google Cloud Storage with project ID: " + projectId);
        
        // Validate required credentials
        if (!StringUtils.hasText(privateKeyId) || !StringUtils.hasText(privateKey) || 
            !StringUtils.hasText(clientEmail)) {
            logger.severe("Missing required GCP credentials. Please check your environment variables.");
            throw new IllegalStateException("Missing required GCP credentials. Check GCP_PRIVATE_KEY_ID, GCP_PRIVATE_KEY, and GCP_CLIENT_EMAIL environment variables.");
        }
        
        // Create the JSON structure required by Google Cloud
        String jsonCredentials = String.format("""
            {
              "type": "%s",
              "project_id": "%s",
              "private_key_id": "%s",
              "private_key": "%s",
              "client_email": "%s",
              "client_id": "%s",
              "auth_uri": "%s",
              "token_uri": "%s",
              "auth_provider_x509_cert_url": "%s",
              "client_x509_cert_url": "%s"
            }""",
            credentialsType,
            credentialsProjectId,
            privateKeyId,
            privateKey.replace("\\n", "\n"), // Ensure proper newline handling
            clientEmail,
            clientId,
            authUri,
            tokenUri,
            authProviderX509CertUrl,
            clientX509CertUrl
        );

        logger.info("Creating Google credentials for service account: " + clientEmail);
        
        try {
            // Create credentials from the JSON string
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                new ByteArrayInputStream(jsonCredentials.getBytes())
            ).createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));
    
            // Create and return the Storage service
            logger.info("Successfully initialized Google Cloud Storage");
            return StorageOptions.newBuilder()
                    .setProjectId(projectId)
                    .setCredentials(credentials)
                    .build()
                    .getService();
        } catch (IOException e) {
            logger.severe("Failed to initialize Google Cloud Storage: " + e.getMessage());
            throw e;
        }
    }
} 