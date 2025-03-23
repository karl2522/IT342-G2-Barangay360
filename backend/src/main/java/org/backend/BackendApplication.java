package org.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;
import java.util.logging.Logger;
import java.net.URL;

@SpringBootApplication
public class BackendApplication {
    private static final Logger logger = Logger.getLogger(BackendApplication.class.getName());

    public static void main(String[] args) {
        // Try to load environment variables from .env file if it exists
        try {
            loadEnvVariables();
        } catch (Exception e) {
            logger.warning("Could not load environment variables from .env file: " + e.getMessage());
            logger.info("Continuing with system environment variables or application.properties defaults");
        }
        
        SpringApplication.run(BackendApplication.class, args);
    }
    
    private static void loadEnvVariables() throws IOException {
        // Check for .env file
        File envFile = new File(".env");
        if (!envFile.exists()) {
            // Also check in the parent directory
            envFile = new File("../backend/.env");
            if (!envFile.exists()) {
                logger.info(".env file not found, checking in resources");
                // Check in the resources directory (for classpath loaded files)
                String resourcePath = null;
                URL resourceUrl = BackendApplication.class.getClassLoader().getResource(".env");
                if (resourceUrl != null) {
                    resourcePath = resourceUrl.getFile();
                }
                if (resourcePath != null) {
                    envFile = new File(resourcePath);
                }
            }
        }
        
        if (envFile.exists()) {
            logger.info("Loading environment variables from " + envFile.getAbsolutePath());
            
            Properties props = new Properties();
            try (FileInputStream fis = new FileInputStream(envFile)) {
                props.load(fis);
            }
            
            for (String key : props.stringPropertyNames()) {
                if (System.getenv(key) == null) {
                    String value = props.getProperty(key);
                    System.setProperty(key, value);
                    logger.info("Set system property: " + key);
                }
            }
        } else {
            logger.warning(".env file not found in any location");
        }
    }
}
