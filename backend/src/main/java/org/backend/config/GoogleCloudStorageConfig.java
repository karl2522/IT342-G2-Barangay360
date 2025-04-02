package org.backend.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.Scanner; // Import Scanner
import java.util.logging.Logger;

// import lombok.Data; // No longer needed
// import org.springframework.boot.context.properties.ConfigurationProperties; // No longer needed
// import org.springframework.boot.context.properties.EnableConfigurationProperties; // No longer needed
import org.springframework.beans.factory.annotation.Autowired;
// import lombok.Data; // No longer needed
// import org.springframework.boot.context.properties.ConfigurationProperties; // No longer needed
// import org.springframework.boot.context.properties.EnableConfigurationProperties; // No longer needed
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment; // Import Environment
import org.springframework.core.io.Resource; // Import Resource
import org.springframework.core.io.ResourceLoader; // Import ResourceLoader
import org.springframework.util.StringUtils;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;

@Configuration
// @EnableConfigurationProperties removed
public class GoogleCloudStorageConfig {
    private static final Logger logger = Logger.getLogger(GoogleCloudStorageConfig.class.getName());

    private Environment environment; // Inject Environment

    @Autowired
    private ResourceLoader resourceLoader; // Inject ResourceLoader

    // Inject the Environment object using a setter
    @Autowired
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Bean
    public Storage storage() throws IOException {
        // Retrieve properties directly from Environment
        String projectId = environment.getProperty("gcp.storage.project-id");
        String privateKeyId = environment.getProperty("gcp.storage.credentials.private-key-id");
        String clientEmail = environment.getProperty("gcp.storage.credentials.client-email");
        String clientId = environment.getProperty("gcp.storage.credentials.client-id", ""); // Default to empty string if missing
        String credentialsType = environment.getProperty("gcp.storage.credentials.type", "service_account");
        String credentialsProjectId = environment.getProperty("gcp.storage.credentials.project-id", projectId); // Default to main project ID
        String authUri = environment.getProperty("gcp.storage.credentials.auth-uri", "https://accounts.google.com/o/oauth2/auth");
        String tokenUri = environment.getProperty("gcp.storage.credentials.token-uri", "https://oauth2.googleapis.com/token");
        String authProviderX509CertUrl = environment.getProperty("gcp.storage.credentials.auth-provider-x509_cert_url", "https://www.googleapis.com/oauth2/v1/certs");
        String clientX509CertUrl = environment.getProperty("gcp.storage.credentials.client-x509_cert_url", ""); // Default to empty string
        String privateKeyLocation = environment.getProperty("gcp.storage.credentials.private-key"); // Location of the private key file

        logger.info("Initializing Google Cloud Storage with project ID: " + projectId);

        try {
            // Validate required credentials retrieved from Environment
            if (!StringUtils.hasText(projectId) || // Also check projectId
                !StringUtils.hasText(privateKeyId) ||
                !StringUtils.hasText(privateKeyLocation) || // Check for privateKeyLocation instead of privateKey
                !StringUtils.hasText(clientEmail)) {
                logger.warning("Missing required GCP credentials retrieved from Environment. Using mock Storage implementation.");
                // Log which properties are missing
                if (!StringUtils.hasText(projectId)) logger.warning("Missing: gcp.storage.project-id");
                if (!StringUtils.hasText(privateKeyId)) logger.warning("Missing: gcp.storage.credentials.private-key-id");
                if (!StringUtils.hasText(privateKeyLocation)) logger.warning("Missing: gcp.storage.credentials.private-key (location)");
                if (!StringUtils.hasText(clientEmail)) logger.warning("Missing: gcp.storage.credentials.client-email");
                return getMockStorage();
            }

            // Load the private key from the specified resource
            Resource privateKeyResource = resourceLoader.getResource(privateKeyLocation);
            String formattedPrivateKey = null;
            try (Scanner scanner = new Scanner(privateKeyResource.getInputStream(), "UTF-8")) {
                formattedPrivateKey = scanner.useDelimiter("\\A").next(); // Read entire file
            } catch (IOException e) {
                logger.severe("Failed to read private key from resource: " + privateKeyLocation + " - " + e.getMessage());
                return getMockStorage();
            }

            // Create the JSON structure using retrieved properties
            String jsonCredentials = String.format("{\n" +
                "  \"type\": \"%s\",\n" +
                "  \"project_id\": \"%s\",\n" +
                "  \"private_key_id\": \"%s\",\n" +
                // The private key is read from a file, so it should already be properly formatted
                "  \"private_key\": \"%s\",\n" +
                "  \"client_email\": \"%s\",\n" +
                "  \"client_id\": \"%s\",\n" +
                "  \"auth_uri\": \"%s\",\n" +
                "  \"token_uri\": \"%s\",\n" +
                "  \"auth_provider_x509_cert_url\": \"%s\",\n" +
                "  \"client_x509_cert_url\": \"%s\"\n" +
                "}",
                credentialsType.replace("\"", "\\\""),
                credentialsProjectId.replace("\"", "\\\""),
                privateKeyId.replace("\"", "\\\""),
                // The private key is read from a file, so it should already be properly formatted
                formattedPrivateKey.replace("\\", "\\\\").replace("\"", "\\\""),
                clientEmail.replace("\"", "\\\""),
                clientId.replace("\"", "\\\""),
                authUri.replace("\"", "\\\""),
                tokenUri.replace("\"", "\\\""),
                authProviderX509CertUrl.replace("\"", "\\\""),
                clientX509CertUrl.replace("\"", "\\\"")
            );


            logger.info("Creating Google credentials for service account: " + clientEmail);

            // Rest of the method remains similar...
             try {
                // Create credentials from the JSON string
                GoogleCredentials credentials = GoogleCredentials.fromStream(
                    new ByteArrayInputStream(jsonCredentials.getBytes())
                ).createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));

                // Create and return the Storage service
                logger.info("Successfully initialized Google Cloud Storage");
                return StorageOptions.newBuilder()
                        .setProjectId(projectId) // Use projectId retrieved from environment
                        .setCredentials(credentials)
                        .build()
                        .getService();
            } catch (IOException e) {
                logger.severe("Failed to initialize Google Cloud Storage from JSON: " + e.getMessage());
                logger.severe("JSON used: " + jsonCredentials); // Log the JSON for debugging
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
        logger.warning("USING MOCK STORAGE - Images and file uploads will not work correctly. This is likely due to missing or incorrect Google Cloud Storage credentials.");
        return StorageOptions.newBuilder()
                .setProjectId("mock-project-id") // Use a distinct mock project ID
                .build()
                .getService();
    }

    // GcpProperties nested class removed
}
