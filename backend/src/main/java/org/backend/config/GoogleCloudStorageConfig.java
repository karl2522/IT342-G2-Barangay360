package org.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.logging.Level;
import java.util.logging.Logger;

@Configuration
public class GoogleCloudStorageConfig {
    private static final Logger logger = Logger.getLogger(GoogleCloudStorageConfig.class.getName());
    
    private final Environment environment;
    
    public GoogleCloudStorageConfig(Environment environment) {
        this.environment = environment;
    }
    
    @Value("${gcp.storage.project-id:}")
    private String projectId;
    
    @Bean
    public Storage storage() throws IOException {
        logger.info("Initializing Google Cloud Storage");
        
        // First try to load from credentials file
        try {
            ClassPathResource resource = new ClassPathResource("gcp-credentials.json");
            if (resource.exists()) {
                logger.info("Found gcp-credentials.json file, attempting to load credentials");
                GoogleCredentials credentials = GoogleCredentials.fromStream(resource.getInputStream())
                    .createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));
                
                // Get project ID from the credentials file
                String projectIdFromFile = environment.getProperty("GOOGLE_CLOUD_PROJECT_ID", projectId);
                
                logger.info("Successfully loaded credentials from file");
                return StorageOptions.newBuilder()
                    .setProjectId(projectIdFromFile)
                    .setCredentials(credentials)
                    .build()
                    .getService();
            }
        } catch (Exception e) {
            logger.warning("Failed to load credentials from file: " + e.getMessage());
        }
        
        // Fall back to environment variables
        String privateKeyId = environment.getProperty("GOOGLE_CLOUD_PRIVATE_KEY_ID");
        String privateKey = environment.getProperty("GOOGLE_CLOUD_PRIVATE_KEY");
        String clientEmail = environment.getProperty("GOOGLE_CLOUD_CLIENT_EMAIL");
        String clientId = environment.getProperty("GOOGLE_CLOUD_CLIENT_ID");
        String projectIdFromEnv = environment.getProperty("GOOGLE_CLOUD_PROJECT_ID");
        
        // Use project ID from environment if available, otherwise use the one from properties
        String effectiveProjectId = StringUtils.hasText(projectIdFromEnv) ? projectIdFromEnv : projectId;
        
        // Validate required credentials
        if (!StringUtils.hasText(privateKeyId) || !StringUtils.hasText(privateKey) || 
            !StringUtils.hasText(clientEmail) || !StringUtils.hasText(effectiveProjectId)) {
            logger.warning("Missing required GCP credentials. Using mock Storage implementation.");
            return getMockStorage();
        }
        
        try {
            // Create the JSON structure required by Google Cloud
            String jsonCredentials = String.format("""
                {
                  "type": "service_account",
                  "project_id": "%s",
                  "private_key_id": "%s",
                  "private_key": "%s",
                  "client_email": "%s",
                  "client_id": "%s",
                  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                  "token_uri": "https://oauth2.googleapis.com/token",
                  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/%s"
                }""",
                effectiveProjectId,
                privateKeyId,
                privateKey.replace("\n", "\\n"),
                clientEmail,
                clientId,
                clientEmail.replace("@", "%40")
            );
            
            logger.info("Creating Google credentials for service account: " + clientEmail);
            
            // Create credentials from the JSON string
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                new ByteArrayInputStream(jsonCredentials.getBytes())
            ).createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));
            
            // Create and return the Storage service
            logger.info("Successfully initialized Google Cloud Storage");
            return StorageOptions.newBuilder()
                    .setProjectId(effectiveProjectId)
                    .setCredentials(credentials)
                    .build()
                    .getService();
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Exception while creating GCS credentials: " + e.getMessage(), e);
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