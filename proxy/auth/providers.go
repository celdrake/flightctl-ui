package auth

import (
	"encoding/json"
	"net/http"

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

// IssuerDiscoveryValidation contains OIDC discovery validation results
type IssuerDiscoveryValidation struct {
	Reachable             bool            `json:"reachable"`
	DiscoveryUrl          FieldValidation `json:"discoveryUrl"`
	AuthorizationEndpoint FieldValidation `json:"authorizationEndpoint"`
	TokenEndpoint         FieldValidation `json:"tokenEndpoint"`
	UserInfoEndpoint      FieldValidation `json:"userInfoEndpoint"`
	EndSessionEndpoint    FieldValidation `json:"endSessionEndpoint,omitempty"`
	SupportedScopes       []string        `json:"supportedScopes,omitempty"`
	SupportedGrantTypes   []string        `json:"supportedGrantTypes,omitempty"`
}

// CustomSettingsValidation contains OAuth2 custom settings validation results
type CustomSettingsValidation struct {
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
	Valid                  bool                       `json:"valid"`
	ClientId               FieldValidation            `json:"clientId"`
	Issuer                 *FieldValidation           `json:"issuer,omitempty"`
	IssuerDiscovery        *IssuerDiscoveryValidation `json:"issuerDiscovery,omitempty"`
	CustomSettings         *CustomSettingsValidation  `json:"customSettings,omitempty"`
	UsernameClaim          FieldValidation            `json:"usernameClaim"`
	OrganizationAssignment *OrgAssignmentValidation   `json:"organizationAssignment,omitempty"`
	Summary                ValidationSummary          `json:"summary"`
}

// OAuth2CustomSettings defines custom settings for OAuth2 providers
type OAuth2CustomSettings struct {
	AuthorizationEndpoint string `json:"authorizationEndpoint"`
	TokenEndpoint         string `json:"tokenEndpoint"`
	UserInfoEndpoint      string `json:"userInfoEndpoint"`
	EndSessionEndpoint    string `json:"endSessionEndpoint,omitempty"`
	Scopes                string `json:"scopes,omitempty"` // OAuth2 scopes (space-separated)
}

// OIDCProviderSpec defines the configuration for an OIDC/OAuth2 provider
type OIDCProviderSpec struct {
	Type                   string                      `json:"type"` // "OIDC" or "OAuth2"
	ClientId               string                      `json:"clientId"`
	Enabled                bool                        `json:"enabled"`
	Issuer                 string                      `json:"issuer,omitempty"`
	CustomSettings         *OAuth2CustomSettings       `json:"customSettings,omitempty"`
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

// OIDCProvider represents an OIDC/OAuth2 provider resource
type OIDCProvider struct {
	APIVersion string           `json:"apiVersion"`
	Kind       string           `json:"kind"`
	Metadata   ObjectMeta       `json:"metadata"`
	Spec       OIDCProviderSpec `json:"spec"`
}

// ListMeta represents metadata for a list of resources
type ListMeta struct {
	Continue        string `json:"continue,omitempty"`
	RemainingItems  *int64 `json:"remainingItems,omitempty"`
	ResourceVersion string `json:"resourceVersion,omitempty"`
}

// OIDCProviderList represents a list of OIDC providers
type OIDCProviderList struct {
	APIVersion string         `json:"apiVersion"`
	Kind       string         `json:"kind"`
	Metadata   ListMeta       `json:"metadata"`
	Items      []OIDCProvider `json:"items"`
}

// getMockOIDCProviders returns hardcoded OIDC provider configurations for testing
func getMockOIDCProviders() []OIDCProvider {
	return []OIDCProvider{
		{
			APIVersion: "v1alpha1",
			Kind:       "OIDCProvider",
			Metadata: ObjectMeta{
				Name: "github",
				Labels: map[string]string{
					"provider": "github",
				},
			},
			Spec: OIDCProviderSpec{
				Type:     ProviderTypeOAuth2,
				ClientId: "mock-github-client-id",
				Enabled:  true,
				CustomSettings: &OAuth2CustomSettings{
					AuthorizationEndpoint: "https://xgithub.com/login/oauth/authorize",
					TokenEndpoint:         "https://xgithub.com/login/oauth/access_token",
					UserInfoEndpoint:      "https://xapi.github.com/user",
					Scopes:                "read:user user:email",
				},
				UsernameClaim: "login",
			},
		},
		{
			APIVersion: "v1alpha1",
			Kind:       "OIDCProvider",
			Metadata: ObjectMeta{
				Name: "google",
				Labels: map[string]string{
					"provider": "google",
				},
			},
			Spec: OIDCProviderSpec{
				Type:          ProviderTypeOIDC,
				ClientId:      "mock-google-client-id",
				Enabled:       true,
				Issuer:        "https://xaccounts.google.com",
				UsernameClaim: "email",
			},
		},
	}
}

// GetOIDCProvidersHandler handles GET requests for OIDC providers list
// It needs access to the embedded provider configuration
func GetOIDCProvidersHandler(embeddedAuthURL string, embeddedAuthType string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		providers := getMockOIDCProviders()

		// Add the embedded provider if it exists and is OIDC
		if embeddedAuthURL != "" && embeddedAuthType == ProviderTypeOIDC {
			embeddedProvider := OIDCProvider{
				APIVersion: "v1alpha1",
				Kind:       "OIDCProvider",
				Metadata: ObjectMeta{
					Name: "embedded",
					Labels: map[string]string{
						"provider": "embedded",
						"embedded": "true",
					},
				},
				Spec: OIDCProviderSpec{
					Type:          ProviderTypeOIDC,
					ClientId:      "flightctl",
					Enabled:       true,
					Issuer:        embeddedAuthURL,
					UsernameClaim: "preferred_username",
				},
			}
			// Prepend embedded provider so it appears first
			providers = append([]OIDCProvider{embeddedProvider}, providers...)
		}

		providerList := OIDCProviderList{
			APIVersion: "v1alpha1",
			Kind:       "OIDCProviderList",
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
