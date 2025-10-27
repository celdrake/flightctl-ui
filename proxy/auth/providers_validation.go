package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/flightctl/flightctl-ui/bridge"
)

// CELIA-WIP determine if we want this functionality and make the code better if so
// TestProviderConfiguration tests the configuration of an OIDC/OAuth2 provider
func TestProviderConfiguration(spec AuthenticationProviderSpec) ProviderValidationResult {
	result := ProviderValidationResult{
		Valid:   true,
		Summary: ValidationSummary{NextSteps: []string{}},
	}

	// Validate common fields
	validateCommonFields(spec, &result)

	// Type-specific validations
	switch spec.Type {
	case ProviderTypeOIDC:
		testOIDCProviderConfiguration(spec, &result)
	case ProviderTypeOAuth2:
		testOAuth2ProviderConfiguration(spec, &result)
	default:
		result.Valid = false
	}

	// Organization assignment validation
	validateOrganizationAssignmentConfig(spec, &result)

	// Build summary
	result.Summary = buildValidationSummary(&result)

	return result
}

// validateCommonFields validates fields common to all provider types
func validateCommonFields(spec AuthenticationProviderSpec, result *ProviderValidationResult) {

	// Validate clientId
	result.ClientId = FieldValidation{Valid: true, Value: spec.ClientId}
	if spec.ClientId == "" {
		addFieldError(&result.ClientId, "Client ID is required")
		result.Valid = false
	}

	// Validate usernameClaim
	if spec.UsernameClaim != "" {
		result.UsernameClaim = FieldValidation{Valid: true, Value: spec.UsernameClaim}
	}
}

// testOIDCProviderConfiguration tests the configuration of an OIDC provider
func testOIDCProviderConfiguration(spec AuthenticationProviderSpec, result *ProviderValidationResult) {
	if spec.Type != ProviderTypeOIDC {
		addFieldError(&FieldValidation{Valid: false, Value: spec.Type, Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Provider type is not OIDC"}}}, "Provider type is not OIDC")
		return
	}
	issuer := FieldValidation{Valid: true, Value: spec.Issuer}

	if spec.Issuer == "" {
		addFieldError(&issuer, "OIDC provider requires an issuer URL")
		result.Valid = false
		result.Issuer = &issuer
		return
	}

	// Try to fetch discovery document
	discovery, err := fetchOIDCDiscovery(spec.Issuer)
	if err != nil {
		addFieldError(&issuer, fmt.Sprintf("Failed to fetch OIDC discovery document: %v", err))
		result.Valid = false
		result.Issuer = &issuer

		// Create failed discovery validation
		discoveryUrl := fmt.Sprintf("%s/.well-known/openid-configuration", spec.Issuer)
		result.OidcDiscovery = &OidcDiscoveryValidation{
			Reachable: false,
			DiscoveryUrl: FieldValidation{
				Valid: false,
				Value: discoveryUrl,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: err.Error()}},
			},
			AuthorizationEndpoint: FieldValidation{
				Valid: false,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Could not retrieve endpoint from discovery"}},
			},
			TokenEndpoint: FieldValidation{
				Valid: false,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Could not retrieve endpoint from discovery"}},
			},
			UserInfoEndpoint: FieldValidation{
				Valid: false,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Could not retrieve endpoint from discovery"}},
			},
		}
		return
	}

	result.Issuer = &issuer

	// Validate discovery document
	result.OidcDiscovery = validateDiscoveryDocument(spec.Issuer, discovery, result)
}

// fetchOIDCDiscovery fetches the OIDC discovery document
func fetchOIDCDiscovery(issuer string) (map[string]interface{}, error) {
	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return nil, fmt.Errorf("TLS configuration error: %w", err)
	}

	discoveryURL := fmt.Sprintf("%s/.well-known/openid-configuration", issuer)
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(discoveryURL)
	if err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: endpoint returned error", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var discovery map[string]interface{}
	if err := json.Unmarshal(body, &discovery); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %w", err)
	}

	return discovery, nil
}

// validateDiscoveryDocument validates the OIDC discovery document
func validateDiscoveryDocument(issuer string, discovery map[string]interface{}, result *ProviderValidationResult) *OidcDiscoveryValidation {
	discoveryURL := fmt.Sprintf("%s/.well-known/openid-configuration", issuer)
	validation := &OidcDiscoveryValidation{
		Reachable:    true,
		DiscoveryUrl: FieldValidation{Valid: true, Value: discoveryURL},
	}

	// Check for required endpoints
	authEndpoint, authOk := discovery["authorization_endpoint"].(string)
	tokenEndpoint, tokenOk := discovery["token_endpoint"].(string)
	userInfoEndpoint, userInfoOk := discovery["userinfo_endpoint"].(string)
	endSessionEndpoint, _ := discovery["end_session_endpoint"].(string)

	hasErrors := false

	// Validate authorization endpoint
	if authOk && authEndpoint != "" {
		validation.AuthorizationEndpoint = FieldValidation{Valid: true, Value: authEndpoint}
	} else {
		validation.AuthorizationEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "authorization_endpoint missing from discovery document"}},
		}
		hasErrors = true
	}

	// Validate token endpoint
	if tokenOk && tokenEndpoint != "" {
		validation.TokenEndpoint = FieldValidation{Valid: true, Value: tokenEndpoint}
	} else {
		validation.TokenEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "token_endpoint missing from discovery document"}},
		}
		hasErrors = true
	}

	// Validate userinfo endpoint
	if userInfoOk && userInfoEndpoint != "" {
		validation.UserInfoEndpoint = FieldValidation{Valid: true, Value: userInfoEndpoint}
	} else {
		validation.UserInfoEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "userinfo_endpoint missing from discovery document"}},
		}
		hasErrors = true
	}

	// End session endpoint is optional
	if endSessionEndpoint != "" {
		validation.EndSessionEndpoint = FieldValidation{Valid: true, Value: endSessionEndpoint}
	}

	if hasErrors {
		result.Valid = false
		addFieldNote(&validation.DiscoveryUrl, ValidationLevelWarning, "Discovery document is missing required fields")
	}

	// Extract supported scopes and grant types
	if scopes, ok := discovery["scopes_supported"].([]interface{}); ok {
		for _, scope := range scopes {
			if s, ok := scope.(string); ok {
				validation.SupportedScopes = append(validation.SupportedScopes, s)
			}
		}
	}

	if grantTypes, ok := discovery["grant_types_supported"].([]interface{}); ok {
		for _, gt := range grantTypes {
			if g, ok := gt.(string); ok {
				validation.SupportedGrantTypes = append(validation.SupportedGrantTypes, g)
			}
		}
	}

	return validation
}

// testOAuth2ProviderConfiguration tests the configuration of an OAuth2 provider
func testOAuth2ProviderConfiguration(spec AuthenticationProviderSpec, result *ProviderValidationResult) {
	oauth2Settings := &OAuth2SettingsValidation{Valid: true}
	if spec.Type != ProviderTypeOAuth2 {
		addFieldError(&FieldValidation{Valid: false, Value: spec.Type, Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Provider type is not OAuth2"}}}, "Provider type is not OAuth2")
		return
	}

	// Validate authorization endpoint
	if spec.AuthorizationUrl != "" {
		isValid := false
		// Test reachability of authorization endpoint
		if err := testEndpointReachability(spec.AuthorizationUrl, "GET"); err != nil {
			addFieldWarning(&oauth2Settings.AuthorizationEndpoint, fmt.Sprintf("Authorization endpoint not reachable: %v", err))
		} else {
			addFieldNote(&oauth2Settings.AuthorizationEndpoint, ValidationLevelInfo, "Authorization endpoint is reachable")
			isValid = true
		}
		oauth2Settings.AuthorizationEndpoint = FieldValidation{Valid: isValid, Value: spec.AuthorizationUrl}
	} else {
		oauth2Settings.AuthorizationEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Authorization endpoint is required for OAuth2 providers"}},
		}
		oauth2Settings.Valid = false
		result.Valid = false
	}

	// Validate token endpoint
	if spec.TokenUrl != "" {
		isValid := false
		// Test reachability and that it accepts POST
		if err := testEndpointReachability(spec.TokenUrl, "POST"); err != nil {
			addFieldWarning(&oauth2Settings.TokenEndpoint, fmt.Sprintf("Token endpoint not reachable or does not accept POST method: %v", err))
		} else {
			isValid = true
			addFieldNote(&oauth2Settings.TokenEndpoint, ValidationLevelInfo, "Token endpoint is reachable and accepts POST method")
		}
		oauth2Settings.TokenEndpoint = FieldValidation{Valid: isValid, Value: spec.TokenUrl}
	} else {
		oauth2Settings.TokenEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Token endpoint is required for OAuth2 providers"}},
		}
		oauth2Settings.Valid = false
		result.Valid = false
	}

	// Validate userinfo endpoint
	if spec.UserInfoUrl != "" {
		isValid := false
		// Test reachability and check response structure
		if err := testUserInfoEndpoint(spec.UserInfoUrl); err != nil {
			addFieldWarning(&oauth2Settings.UserInfoEndpoint, fmt.Sprintf("User info endpoint not reachable or returns invalid JSON: %v", err))
		} else {
			isValid = true
			addFieldNote(&oauth2Settings.UserInfoEndpoint, ValidationLevelInfo, "User info endpoint is reachable and returns valid JSON")
		}
		oauth2Settings.UserInfoEndpoint = FieldValidation{Valid: isValid, Value: spec.UserInfoUrl}
	} else {
		oauth2Settings.UserInfoEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "UserInfo endpoint is required for OAuth2 providers"}},
		}
		oauth2Settings.Valid = false
		result.Valid = false
	}

	// End session endpoint is optional (not yet supported in spec)
	// if spec.EndSessionUrl != "" {
	// 	oauth2Settings.EndSessionEndpoint = FieldValidation{Valid: true, Value: spec.EndSessionUrl}
	// }

	// Validate scopes
	if spec.Scopes != "" {
		oauth2Settings.Scopes = FieldValidation{Valid: true, Value: spec.Scopes}
	} else {
		oauth2Settings.Scopes = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "OAuth2 provider requires scopes to be configured"}},
		}
		oauth2Settings.Valid = false
		result.Valid = false
	}

	result.OAuth2Settings = oauth2Settings
}

// validateOrganizationAssignmentConfig validates organization assignment configuration
func validateOrganizationAssignmentConfig(spec AuthenticationProviderSpec, result *ProviderValidationResult) {
	if spec.OrganizationAssignment == nil {
		return
	}

	orgValidation := &OrgAssignmentValidation{Valid: true}
	orgAssignment := spec.OrganizationAssignment

	// Validate type
	orgValidation.Type = FieldValidation{Valid: true, Value: orgAssignment.Type}

	requiresOrgClaim := orgAssignment.Type == "Dynamic" || orgAssignment.Type == "PerUser"

	if requiresOrgClaim {
		// Validate claim path
		if orgAssignment.ClaimPath != "" {
			orgValidation.ClaimPath = FieldValidation{Valid: true, Value: orgAssignment.ClaimPath}

			// Add warnings based on provider type
			if spec.Type == ProviderTypeOAuth2 {
				if spec.Scopes != "" {
					addFieldNote(&orgValidation.ClaimPath, ValidationLevelWarning,
						fmt.Sprintf("Ensure scopes '%s' include permissions to access organization data from the provider", spec.Scopes))
				}
			} else if spec.Type == ProviderTypeOIDC {
				addFieldNote(&orgValidation.ClaimPath, ValidationLevelWarning,
					fmt.Sprintf("Ensure the OIDC provider includes organization/group information at claim path '%s'", orgAssignment.ClaimPath))
			}
		} else {
			orgValidation.ClaimPath = FieldValidation{
				Valid: false,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: fmt.Sprintf("Organization assignment type '%s' requires claimPath to be configured", orgAssignment.Type)}},
			}
			orgValidation.Valid = false
			result.Valid = false
		}
	} else if orgAssignment.Type == "Static" {
		// Validate organization name for static assignment
		if orgAssignment.OrganizationName != "" {
			orgValidation.OrganizationName = FieldValidation{Valid: true, Value: orgAssignment.OrganizationName}
		} else {
			orgValidation.OrganizationName = FieldValidation{
				Valid: false,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Static organization assignment requires organizationName"}},
			}
			orgValidation.Valid = false
			result.Valid = false
		}
	}

	// Validate optional fields
	if orgAssignment.OrganizationNamePrefix != "" {
		orgValidation.OrganizationNamePrefix = FieldValidation{Valid: true, Value: orgAssignment.OrganizationNamePrefix}
	}
	if orgAssignment.OrganizationNameSuffix != "" {
		orgValidation.OrganizationNameSuffix = FieldValidation{Valid: true, Value: orgAssignment.OrganizationNameSuffix}
	}

	result.OrganizationAssignment = orgValidation
}

// buildValidationSummary builds a summary of the validation results
func buildValidationSummary(result *ProviderValidationResult) ValidationSummary {
	summary := ValidationSummary{
		TotalFields:   0,
		ValidFields:   0,
		ErrorFields:   0,
		WarningFields: 0,
		NextSteps:     []string{},
	}

	// Count fields
	fields := []FieldValidation{
		result.ClientId,
	}

	if result.Issuer != nil {
		fields = append(fields, *result.Issuer)
	}

	if result.OidcDiscovery != nil {
		fields = append(fields,
			result.OidcDiscovery.DiscoveryUrl,
			result.OidcDiscovery.AuthorizationEndpoint,
			result.OidcDiscovery.TokenEndpoint,
			result.OidcDiscovery.UserInfoEndpoint,
		)
	}

	if result.OAuth2Settings != nil {
		fields = append(fields,
			result.OAuth2Settings.AuthorizationEndpoint,
			result.OAuth2Settings.TokenEndpoint,
			result.OAuth2Settings.UserInfoEndpoint,
			result.OAuth2Settings.Scopes,
		)
	}

	if result.OrganizationAssignment != nil {
		fields = append(fields, result.OrganizationAssignment.Type)
		if result.OrganizationAssignment.ClaimPath.Value != "" || len(result.OrganizationAssignment.ClaimPath.Notes) > 0 {
			fields = append(fields, result.OrganizationAssignment.ClaimPath)
		}
		if result.OrganizationAssignment.OrganizationName.Value != "" || len(result.OrganizationAssignment.OrganizationName.Notes) > 0 {
			fields = append(fields, result.OrganizationAssignment.OrganizationName)
		}
	}

	for _, field := range fields {
		summary.TotalFields++
		if field.Valid {
			summary.ValidFields++
		} else {
			summary.ErrorFields++
		}

		for _, note := range field.Notes {
			if note.Level == ValidationLevelWarning {
				summary.WarningFields++
			}
		}
	}

	// Generate next steps
	if result.Valid {
		if summary.WarningFields > 0 {
			summary.NextSteps = append(summary.NextSteps, "Configuration is valid but has warnings")
		} else {
			summary.NextSteps = append(summary.NextSteps, "✓ All validations passed")
			summary.NextSteps = append(summary.NextSteps, "✓ Configuration is ready to use")
		}
	} else {
		summary.NextSteps = append(summary.NextSteps, fmt.Sprintf("Fix %d required field(s) marked with errors", summary.ErrorFields))
	}

	return summary
}

// Helper functions to add notes to fields
func addFieldError(field *FieldValidation, message string) {
	field.Valid = false
	field.Notes = append(field.Notes, ValidationNote{Level: ValidationLevelError, Text: message})
}

func addFieldWarning(field *FieldValidation, message string) {
	field.Notes = append(field.Notes, ValidationNote{Level: ValidationLevelWarning, Text: message})
}

func addFieldNote(field *FieldValidation, level string, message string) {
	field.Notes = append(field.Notes, ValidationNote{Level: level, Text: message})
}

// testEndpointReachability tests if an endpoint is reachable with the specified HTTP method
func testEndpointReachability(endpoint string, method string) error {
	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return fmt.Errorf("failed to get TLS config: %w", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	var req *http.Request
	if method == "POST" {
		// For POST endpoints, send an empty form body
		req, err = http.NewRequest(method, endpoint, strings.NewReader(""))
		if err != nil {
			return fmt.Errorf("failed to create request: %w", err)
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	} else {
		req, err = http.NewRequest(method, endpoint, nil)
		if err != nil {
			return fmt.Errorf("failed to create request: %w", err)
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("endpoint not reachable: %w", err)
	}
	defer resp.Body.Close()

	// For POST to token endpoint, we expect 400 or 401 (missing/invalid credentials), not 405
	if method == "POST" && resp.StatusCode == http.StatusMethodNotAllowed {
		return fmt.Errorf("endpoint does not accept POST method")
	}

	// Any response indicates the endpoint is reachable
	return nil
}

// testUserInfoEndpoint tests if a userInfo endpoint is reachable and returns JSON
func testUserInfoEndpoint(endpoint string) error {
	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return fmt.Errorf("failed to get TLS config: %w", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Add a fake bearer token to simulate an authenticated request
	req.Header.Set("Authorization", "Bearer test-token-for-validation")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("endpoint not reachable: %w", err)
	}
	defer resp.Body.Close()

	// We expect 401 (unauthorized) which confirms the endpoint is working
	// Or 200 if the test token somehow works
	// Anything other than 404/405 is acceptable
	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("endpoint not found (404)")
	}
	if resp.StatusCode == http.StatusMethodNotAllowed {
		return fmt.Errorf("endpoint does not accept GET method")
	}

	// Check if response is JSON
	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") && resp.StatusCode == http.StatusOK {
		// Only warn if we got a 200 OK but it's not JSON
		return fmt.Errorf("endpoint does not return JSON (got %s)", contentType)
	}

	return nil
}
