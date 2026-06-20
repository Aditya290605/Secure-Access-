package com.secureaccess.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureaccess.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full integration test: boots the entire Spring context with H2,
 * exercises the complete flow: register → login → create resource →
 * create policy → check access → verify audit log.
 *
 * This validates that all layers (controller → service → repository → DB)
 * work together correctly with real HTTP semantics.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FullFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Shared state across ordered tests
    private String adminToken;
    private String viewerToken;
    private String resourceId;
    private String viewerUserId;

    @Test
    @Order(1)
    @DisplayName("Register an ADMIN user")
    void registerAdmin() throws Exception {
        RegisterRequest req = new RegisterRequest("admin@integration.com", "password123", Set.of("ADMIN"));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("admin@integration.com"))
                .andExpect(jsonPath("$.roles", hasItem("ADMIN")))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        adminToken = body.get("token").asText();
    }

    @Test
    @Order(2)
    @DisplayName("Register a VIEWER user")
    void registerViewer() throws Exception {
        RegisterRequest req = new RegisterRequest("viewer@integration.com", "password123", Set.of("VIEWER"));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roles", hasItem("VIEWER")))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        viewerToken = body.get("token").asText();
        viewerUserId = body.get("userId").asText();
    }

    @Test
    @Order(3)
    @DisplayName("Duplicate registration returns 400")
    void duplicateRegistration() throws Exception {
        RegisterRequest req = new RegisterRequest("admin@integration.com", "password123", Set.of("ADMIN"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @Order(4)
    @DisplayName("Login with valid credentials")
    void loginSuccess() throws Exception {
        LoginRequest req = new LoginRequest("admin@integration.com", "password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @Order(5)
    @DisplayName("Login with wrong password returns 401")
    void loginWrongPassword() throws Exception {
        LoginRequest req = new LoginRequest("admin@integration.com", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(6)
    @DisplayName("Unauthenticated request to protected endpoint returns 401")
    void unauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/admin/resources"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(7)
    @DisplayName("VIEWER cannot access admin endpoints")
    void viewerCannotAccessAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/resources")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(8)
    @DisplayName("ADMIN creates a resource")
    void adminCreatesResource() throws Exception {
        ResourceRequest req = new ResourceRequest("test_integration_resource", "Integration test data",
                "test@integration.com", "CONFIDENTIAL");

        MvcResult result = mockMvc.perform(post("/api/admin/resources")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("test_integration_resource"))
                .andExpect(jsonPath("$.sensitivityLevel").value("CONFIDENTIAL"))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        resourceId = body.get("id").asText();
    }

    @Test
    @Order(9)
    @DisplayName("ADMIN lists resources")
    void adminListsResources() throws Exception {
        mockMvc.perform(get("/api/admin/resources")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(10)
    @DisplayName("Access check with no policy → DENIED (default-deny)")
    void accessCheckDefaultDeny() throws Exception {
        String body = objectMapper.writeValueAsString(
                new AccessRequest(java.util.UUID.fromString(resourceId), "READ"));

        mockMvc.perform(post("/api/access/check")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(false))
                .andExpect(jsonPath("$.decision").value("DENIED"))
                .andExpect(jsonPath("$.reason", containsString("default-deny")));
    }

    @Test
    @Order(11)
    @DisplayName("ADMIN creates READ policy for VIEWER")
    void adminCreatesPolicy() throws Exception {
        PolicyRequest req = new PolicyRequest("VIEWER",
                java.util.UUID.fromString(resourceId), "READ", null);

        mockMvc.perform(post("/api/admin/policies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("VIEWER"))
                .andExpect(jsonPath("$.permission").value("READ"))
                .andExpect(jsonPath("$.resourceName").value("test_integration_resource"));
    }

    @Test
    @Order(12)
    @DisplayName("VIEWER can now READ (policy grants it)")
    void viewerCanRead() throws Exception {
        String body = objectMapper.writeValueAsString(
                new AccessRequest(java.util.UUID.fromString(resourceId), "READ"));

        mockMvc.perform(post("/api/access/check")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true))
                .andExpect(jsonPath("$.decision").value("ALLOWED"));
    }

    @Test
    @Order(13)
    @DisplayName("VIEWER cannot WRITE (READ policy doesn't grant WRITE)")
    void viewerCannotWrite() throws Exception {
        String body = objectMapper.writeValueAsString(
                new AccessRequest(java.util.UUID.fromString(resourceId), "WRITE"));

        mockMvc.perform(post("/api/access/check")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(false))
                .andExpect(jsonPath("$.reason", containsString("insufficient permissions")));
    }

    @Test
    @Order(14)
    @DisplayName("Admin access check for another user works")
    void adminCheckForUser() throws Exception {
        String body = objectMapper.writeValueAsString(
                new AccessRequest(java.util.UUID.fromString(resourceId), "READ"));

        mockMvc.perform(post("/api/access/admin/check")
                        .param("userId", viewerUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowed").value(true))
                .andExpect(jsonPath("$.userEmail").value("viewer@integration.com"));
    }

    @Test
    @Order(15)
    @DisplayName("Audit log contains entries from previous access checks")
    void auditLogHasEntries() throws Exception {
        // Small delay to let @Async audit writes complete
        Thread.sleep(500);

        mockMvc.perform(get("/api/admin/audit/logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(3)));
    }

    @Test
    @Order(16)
    @DisplayName("Audit stats reflect the checks made")
    void auditStatsCorrect() throws Exception {
        Thread.sleep(200);

        mockMvc.perform(get("/api/admin/audit/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalChecks", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.allowedCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.deniedCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(17)
    @DisplayName("Audit log filters by decision=DENIED")
    void auditLogFilterByDecision() throws Exception {
        mockMvc.perform(get("/api/admin/audit/logs")
                        .param("decision", "DENIED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].decision", everyItem(is("DENIED"))));
    }

    @Test
    @Order(18)
    @DisplayName("Actuator health endpoint is accessible without auth")
    void actuatorHealth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @Order(19)
    @DisplayName("Validation: blank email returns 400 with field errors")
    void validationBlankEmail() throws Exception {
        RegisterRequest req = new RegisterRequest("", "password123", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.email").exists());
    }

    @Test
    @Order(20)
    @DisplayName("Validation: short password returns 400")
    void validationShortPassword() throws Exception {
        RegisterRequest req = new RegisterRequest("test@test.com", "short", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.password").exists());
    }
}
