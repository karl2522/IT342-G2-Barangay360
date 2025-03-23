package org.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import me.paulschwarz.springdotenv.DotenvPropertySource;

@Configuration
public class DotenvConfig {
    // No explicit PropertySource annotation needed as spring-dotenv
    // automatically loads .env files from the classpath
} 