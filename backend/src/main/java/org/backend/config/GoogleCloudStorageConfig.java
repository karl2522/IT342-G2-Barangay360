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
        
        try {
            // Validate required credentials
            if (!StringUtils.hasText(privateKeyId) || !StringUtils.hasText(privateKey) || 
                !StringUtils.hasText(clientEmail)) {
                logger.warning("Missing required GCP credentials. Using mock Storage implementation.");
                return getMockStorage();
            }
            
            // Properly format the private key by ensuring it has the right format
            // The private key in environment variables often has double-escaped newlines (\\n)
            // We need to make sure they're properly converted to actual newlines for the JSON
            String formattedPrivateKey = privateKey;
            if (formattedPrivateKey.contains("\\n")) {
                // Handle case where newlines are escaped as \\n (common in environment variables)
                formattedPrivateKey = formattedPrivateKey.replace("\\n", "\n");
            }
            
            // Create the JSON structure required by Google Cloud
            String jsonCredentials = "{\n" +
                "  \"type\": \"" + credentialsType + "\",\n" +
                "  \"project_id\": \"" + credentialsProjectId + "\",\n" +
                "  \"private_key_id\": \"" + privateKeyId + "\",\n" +
                "  \"private_key\": \"" + formattedPrivateKey + "\",\n" +
                "  \"client_email\": \"" + clientEmail + "\",\n" +
                "  \"client_id\": \"" + clientId + "\",\n" +
                "  \"auth_uri\": \"" + authUri + "\",\n" +
                "  \"token_uri\": \"" + tokenUri + "\",\n" +
                "  \"auth_provider_x509_cert_url\": \"" + authProviderX509CertUrl + "\",\n" +
                "  \"client_x509_cert_url\": \"" + clientX509CertUrl + "\"\n" +
                "}";
    
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
                logger.info("Using mock Storage implementation as fallback");
                return getMockStorage();
            }
        } catch (Exception e) {
            logger.severe("Exception while creating GCS credentials: " + e.getMessage());
            logger.info("Using mock Storage implementation as fallback");
            return getMockStorage();
        }
    }
    
    /**
     * Creates a mock Storage implementation for development/testing when real GCS credentials are not available
     */
    private Storage getMockStorage() {
        logger.warning("USING MOCK STORAGE - Images and file uploads will not work correctly");
        
        // Create mock storage using an empty project and no credentials
        return StorageOptions.newBuilder()
                .setProjectId("mock-project-id")
                .build()
                .getService();
    }
} 