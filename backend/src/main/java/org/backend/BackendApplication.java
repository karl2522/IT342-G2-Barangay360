package org.backend;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;
import java.util.Properties;
import java.util.logging.Logger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@EntityScan("org.backend.model")
@EnableJpaRepositories("org.backend.repository")
@EnableScheduling
@ComponentScan(basePackages = {
    "org.backend.controller",
    "org.backend.service",
    "org.backend.security",
    "org.backend.config"
})
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

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:5173", "http://localhost:5174")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
