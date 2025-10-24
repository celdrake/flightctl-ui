package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/flightctl/flightctl-ui/bridge"
)

// ValidateProviderConfiguration validates an OIDC/OAuth2 provider configuration
func ValidateProviderConfiguration(spec OIDCProviderSpec) ProviderValidationResult {
	result := ProviderValidationResult{
		Valid:   true,
		Summary: ValidationSummary{NextSteps: []string{}},
	}

	// Validate common fields
	validateCommonFields(spec, &result)

	// Type-specific validations
	switch spec.Type {
	case ProviderTypeOIDC:
		validateOIDCProvider(spec, &result)
	case ProviderTypeOAuth2:
		validateOAuth2Provider(spec, &result)
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
func validateCommonFields(spec OIDCProviderSpec, result *ProviderValidationResult) {

	// Validate clientId
	result.ClientId = FieldValidation{Valid: true, Value: spec.ClientId}
	if spec.ClientId == "" {
		addFieldError(&result.ClientId, "Client ID is required")
		result.Valid = false
	}

	// Validate usernameClaim
	usernameClaim := spec.UsernameClaim
	if usernameClaim == "" {
		usernameClaim = "email"
		result.UsernameClaim = FieldValidation{
			Valid: true,
			Value: usernameClaim,
			Notes: []ValidationNote{{Level: ValidationLevelInfo, Text: "Using default value"}},
		}
	} else {
		result.UsernameClaim = FieldValidation{Valid: true, Value: usernameClaim}
	}
}

// validateOIDCProvider validates an OIDC provider
func validateOIDCProvider(spec OIDCProviderSpec, result *ProviderValidationResult) {
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
		result.IssuerDiscovery = &IssuerDiscoveryValidation{
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

	// Discovery successful
	addFieldNote(&issuer, ValidationLevelInfo, "OIDC discovery successful")
	result.Issuer = &issuer

	// Validate discovery document
	result.IssuerDiscovery = validateDiscoveryDocument(spec.Issuer, discovery, result)
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
func validateDiscoveryDocument(issuer string, discovery map[string]interface{}, result *ProviderValidationResult) *IssuerDiscoveryValidation {
	discoveryURL := fmt.Sprintf("%s/.well-known/openid-configuration", issuer)
	validation := &IssuerDiscoveryValidation{
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

// validateOAuth2Provider validates an OAuth2 provider
func validateOAuth2Provider(spec OIDCProviderSpec, result *ProviderValidationResult) {
	customSettings := &CustomSettingsValidation{Valid: true}

	if spec.CustomSettings == nil {
		result.Valid = false
		result.CustomSettings = &CustomSettingsValidation{
			Valid: false,
			AuthorizationEndpoint: FieldValidation{
				Valid: false,
				Notes: []ValidationNote{{Level: ValidationLevelError, Text: "OAuth2 provider requires customSettings"}},
			},
			TokenEndpoint:    FieldValidation{Valid: false},
			UserInfoEndpoint: FieldValidation{Valid: false},
			Scopes:           FieldValidation{Valid: false},
		}
		return
	}

	// Validate authorization endpoint
	if spec.CustomSettings.AuthorizationEndpoint != "" {
		customSettings.AuthorizationEndpoint = FieldValidation{Valid: true, Value: spec.CustomSettings.AuthorizationEndpoint}
	} else {
		customSettings.AuthorizationEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Authorization endpoint is required"}},
		}
		customSettings.Valid = false
		result.Valid = false
	}

	// Validate token endpoint
	if spec.CustomSettings.TokenEndpoint != "" {
		customSettings.TokenEndpoint = FieldValidation{Valid: true, Value: spec.CustomSettings.TokenEndpoint}
	} else {
		customSettings.TokenEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "Token endpoint is required for OAuth2 providers"}},
		}
		customSettings.Valid = false
		result.Valid = false
	}

	// Validate userinfo endpoint
	if spec.CustomSettings.UserInfoEndpoint != "" {
		customSettings.UserInfoEndpoint = FieldValidation{Valid: true, Value: spec.CustomSettings.UserInfoEndpoint}
	} else {
		customSettings.UserInfoEndpoint = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "UserInfo endpoint is required for OAuth2 providers"}},
		}
		customSettings.Valid = false
		result.Valid = false
	}

	// Validate end session endpoint (optional)
	if spec.CustomSettings.EndSessionEndpoint != "" {
		customSettings.EndSessionEndpoint = FieldValidation{Valid: true, Value: spec.CustomSettings.EndSessionEndpoint}
	}

	// Validate scopes
	if spec.CustomSettings.Scopes != "" {
		customSettings.Scopes = FieldValidation{Valid: true, Value: spec.CustomSettings.Scopes}
	} else {
		customSettings.Scopes = FieldValidation{
			Valid: false,
			Notes: []ValidationNote{{Level: ValidationLevelError, Text: "OAuth2 provider requires scopes to be configured"}},
		}
		customSettings.Valid = false
		result.Valid = false
	}

	result.CustomSettings = customSettings
}

// validateOrganizationAssignmentConfig validates organization assignment configuration
func validateOrganizationAssignmentConfig(spec OIDCProviderSpec, result *ProviderValidationResult) {
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
				if spec.CustomSettings != nil {
					addFieldNote(&orgValidation.ClaimPath, ValidationLevelWarning,
						fmt.Sprintf("Ensure scopes '%s' include permissions to access organization data from the provider", spec.CustomSettings.Scopes))
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
		result.UsernameClaim,
	}

	if result.Issuer != nil {
		fields = append(fields, *result.Issuer)
	}

	if result.IssuerDiscovery != nil {
		fields = append(fields,
			result.IssuerDiscovery.DiscoveryUrl,
			result.IssuerDiscovery.AuthorizationEndpoint,
			result.IssuerDiscovery.TokenEndpoint,
			result.IssuerDiscovery.UserInfoEndpoint,
		)
	}

	if result.CustomSettings != nil {
		fields = append(fields,
			result.CustomSettings.AuthorizationEndpoint,
			result.CustomSettings.TokenEndpoint,
			result.CustomSettings.UserInfoEndpoint,
			result.CustomSettings.Scopes,
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
