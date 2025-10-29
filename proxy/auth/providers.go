package auth

import (
	"encoding/json"
	"net/http"

	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
)

// Provider type constants
const (
	ProviderTypeOIDC   = "OIDC"   // Fully compliant OIDC provider
	ProviderTypeOAuth2 = "OAuth2" // OAuth2 provider
)

// Validation note levels
const (
	ValidationLevelError   = "error"
	ValidationLevelWarning = "warning"
	ValidationLevelInfo    = "info"
)

// ValidationNote represents a single validation message
type ValidationNote struct {
	Level string `json:"level"` // "error", "warning", or "info"
	Text  string `json:"text"`
}

// FieldValidation represents validation status for a single field
type FieldValidation struct {
	Valid bool             `json:"valid"`
	Value string           `json:"value,omitempty"`
	Notes []ValidationNote `json:"notes,omitempty"`
}

// OidcDiscoveryValidation contains OIDC discovery validation results
type OidcDiscoveryValidation struct {
	Reachable             bool            `json:"reachable"`
	DiscoveryUrl          FieldValidation `json:"discoveryUrl"`
	AuthorizationEndpoint FieldValidation `json:"authorizationEndpoint"`
	TokenEndpoint         FieldValidation `json:"tokenEndpoint"`
	UserInfoEndpoint      FieldValidation `json:"userInfoEndpoint"`
	EndSessionEndpoint    FieldValidation `json:"endSessionEndpoint,omitempty"`
	SupportedScopes       []string        `json:"supportedScopes,omitempty"`
	SupportedGrantTypes   []string        `json:"supportedGrantTypes,omitempty"`
}

// OAuth2SettingsValidation contains OAuth2-specific field validation results
type OAuth2SettingsValidation struct {
	Valid                 bool            `json:"valid"`
	AuthorizationEndpoint FieldValidation `json:"authorizationEndpoint"`
	TokenEndpoint         FieldValidation `json:"tokenEndpoint"`
	UserInfoEndpoint      FieldValidation `json:"userInfoEndpoint"`
	EndSessionEndpoint    FieldValidation `json:"endSessionEndpoint,omitempty"`
	Scopes                FieldValidation `json:"scopes"`
}

// OrgAssignmentValidation contains organization assignment validation results
type OrgAssignmentValidation struct {
	Valid                  bool            `json:"valid"`
	Type                   FieldValidation `json:"type"`
	OrganizationName       FieldValidation `json:"organizationName,omitempty"`
	ClaimPath              FieldValidation `json:"claimPath,omitempty"`
	OrganizationNamePrefix FieldValidation `json:"organizationNamePrefix,omitempty"`
	OrganizationNameSuffix FieldValidation `json:"organizationNameSuffix,omitempty"`
}

// ValidationSummary provides an overview of validation results
type ValidationSummary struct {
	TotalFields   int      `json:"totalFields"`
	ValidFields   int      `json:"validFields"`
	ErrorFields   int      `json:"errorFields"`
	WarningFields int      `json:"warningFields"`
	ProviderName  string   `json:"providerName,omitempty"`
	NextSteps     []string `json:"nextSteps"`
}

// ProviderValidationResult contains comprehensive validation results
type ProviderValidationResult struct {
	Valid                  bool                      `json:"valid"`
	ClientId               FieldValidation           `json:"clientId"`
	Issuer                 *FieldValidation          `json:"issuer,omitempty"`
	OidcDiscovery          *OidcDiscoveryValidation  `json:"oidcDiscovery,omitempty"`
	OAuth2Settings         *OAuth2SettingsValidation `json:"oauth2Settings,omitempty"`
	UsernameClaim          FieldValidation           `json:"usernameClaim"`
	OrganizationAssignment *OrgAssignmentValidation  `json:"organizationAssignment,omitempty"`
	Summary                ValidationSummary         `json:"summary"`
}

// AuthenticationProviderSpec defines the configuration for an OIDC/OAuth2 provider
type AuthenticationProviderSpec struct {
	Type                   string                      `json:"type"` // "OIDC" or "OAuth2"
	ClientId               string                      `json:"clientId"`
	Enabled                bool                        `json:"enabled"`
	Issuer                 string                      `json:"issuer,omitempty"`
	ClientSecret           string                      `json:"clientSecret,omitempty"`     // Required for OAuth2
	AuthorizationUrl       string                      `json:"authorizationUrl,omitempty"` // Required for OAuth2
	TokenUrl               string                      `json:"tokenUrl,omitempty"`         // Required for OAuth2
	UserInfoUrl            string                      `json:"userInfoUrl,omitempty"`      // Required for OAuth2
	Scopes                 string                      `json:"scopes,omitempty"`           // OIDC/OAuth2 scopes (space-separated). For OIDC: request only scopes needed for your UsernameClaim. Common: "openid profile" for preferred_username, "openid email" for email claim
	OrganizationAssignment *OIDCOrganizationAssignment `json:"organizationAssignment,omitempty"`
	RoleClaim              string                      `json:"roleClaim,omitempty"`
	UsernameClaim          string                      `json:"usernameClaim,omitempty"`
}

// OIDCOrganizationAssignment represents organization assignment configuration
type OIDCOrganizationAssignment struct {
	Type                   string `json:"type"` // "Static", "Dynamic", or "PerUser"
	OrganizationName       string `json:"organizationName,omitempty"`
	ClaimPath              string `json:"claimPath,omitempty"`
	OrganizationNamePrefix string `json:"organizationNamePrefix,omitempty"`
	OrganizationNameSuffix string `json:"organizationNameSuffix,omitempty"`
}

// ObjectMeta represents metadata for a resource
type ObjectMeta struct {
	Name              string            `json:"name,omitempty"`
	CreationTimestamp string            `json:"creationTimestamp,omitempty"`
	Labels            map[string]string `json:"labels,omitempty"`
	Annotations       map[string]string `json:"annotations,omitempty"`
}

// AuthenticationProvider represents an OIDC/OAuth2 provider resource
type AuthenticationProvider struct {
	APIVersion string                     `json:"apiVersion"`
	Kind       string                     `json:"kind"`
	Metadata   ObjectMeta                 `json:"metadata"`
	Spec       AuthenticationProviderSpec `json:"spec"`
}

// ListMeta represents metadata for a list of resources
type ListMeta struct {
	Continue        string `json:"continue,omitempty"`
	RemainingItems  *int64 `json:"remainingItems,omitempty"`
	ResourceVersion string `json:"resourceVersion,omitempty"`
}

// AuthenticationProviderList represents a list of authentication providers
type AuthenticationProviderList struct {
	APIVersion string                   `json:"apiVersion"`
	Kind       string                   `json:"kind"`
	Metadata   ListMeta                 `json:"metadata"`
	Items      []AuthenticationProvider `json:"items"`
}

// getMockAuthenticationProviders returns hardcoded OIDC provider configurations for testing
func getMockAuthenticationProviders() []AuthenticationProvider {
	return []AuthenticationProvider{
		{
			APIVersion: "v1alpha1",
			Kind:       "AuthenticationProvider",
			Metadata: ObjectMeta{
				Name: "github",
				Labels: map[string]string{
					"provider": "github",
				},
			},
			Spec: AuthenticationProviderSpec{
				Type:             ProviderTypeOAuth2,
				ClientId:         config.TestOauth2ProviderClientId,
				ClientSecret:     config.TestOauth2ProviderClientSecret,
				Enabled:          true,
				AuthorizationUrl: "https://github.com/login/oauth/authorize",
				TokenUrl:         "https://github.com/login/oauth/access_token",
				UserInfoUrl:      "https://api.github.com/user",
				Scopes:           "read:user user:email",
				UsernameClaim:    "login",
			},
		},
		{
			APIVersion: "v1alpha1",
			Kind:       "AuthenticationProvider",
			Metadata: ObjectMeta{
				Name: "google",
				Labels: map[string]string{
					"provider": "google",
				},
			},
			Spec: AuthenticationProviderSpec{
				Type:          ProviderTypeOIDC,
				ClientId:      config.TestOidcProviderClientId,
				ClientSecret:  config.TestOidcProviderClientSecret, // Google requires client secret!
				Enabled:       true,
				Issuer:        "https://accounts.google.com",
				UsernameClaim: "email",                // Google provides 'email', not 'preferred_username'
				Scopes:        "openid email profile", // Request scopes needed for email claim
			},
		},
	}
}

// GetAuthenticationProvidersHandler handles GET requests for authentication providers list
// It needs access to the default provider configuration
func GetAuthenticationProvidersHandler(defaultAuthURL string, defaultAuthType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		providers := getMockAuthenticationProviders()

		// Add the default provider if it exists and is OIDC
		if defaultAuthURL != "" && defaultAuthType == ProviderTypeOIDC {
			defaultProvider := AuthenticationProvider{
				APIVersion: "v1alpha1",
				Kind:       "AuthenticationProvider",
				Metadata: ObjectMeta{
					Name: DefaultProviderName,
					Labels: map[string]string{
						"provider": DefaultProviderName,
					},
				},
				Spec: AuthenticationProviderSpec{
					Type:          ProviderTypeOIDC,
					ClientId:      "flightctl",
					Enabled:       true,
					Issuer:        defaultAuthURL,
					UsernameClaim: "name",
				},
			}
			// Prepend default provider so it appears first
			providers = append([]AuthenticationProvider{defaultProvider}, providers...)
		}

		providerList := AuthenticationProviderList{
			APIVersion: "v1alpha1",
			Kind:       "AuthenticationProviderList",
			Metadata:   ListMeta{},
			Items:      providers,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(providerList); err != nil {
			log.GetLogger().WithError(err).Warn("Failed to encode OIDC providers response")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}
