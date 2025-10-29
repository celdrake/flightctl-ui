package auth

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/flightctl/flightctl-ui/bridge"
	"github.com/flightctl/flightctl-ui/common"
	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
	"github.com/openshift/osincli"
)

// ClaimPathSeparator is the separator used for nested claim paths
// Using pipe (|) instead of dot (.) because some claim values may contain dots (e.g., "kubernetes.io")
const ClaimPathSeparator = "|"

// Note: osincli already handles Accept: application/json header correctly
// and properly encodes OAuth2 requests, so no custom RoundTripper is needed
// for standard OAuth2 providers like GitHub, GitLab, etc.

// OAuth2AuthHandler handles OAuth2 authentication (non-fully compliant OIDC)
type OAuth2AuthHandler struct {
	tlsConfig        *tls.Config
	client           *osincli.Client
	userInfoEndpoint string
	usernameClaim    string
	authURL          string
	providerName     string // Store provider name for state parameter
}

// getOAuth2AuthHandler creates an OAuth2 auth handler from provider spec
func getOAuth2AuthHandler(spec AuthenticationProviderSpec) (*OAuth2AuthHandler, error) {
	return getOAuth2AuthHandlerWithSpec(spec, "")
}

// getOAuth2AuthHandlerWithSpec creates an OAuth2 auth handler with a provider name for the redirect URI
func getOAuth2AuthHandlerWithSpec(spec AuthenticationProviderSpec, providerName string) (*OAuth2AuthHandler, error) {
	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return nil, err
	}

	// Validate required OAuth2 fields
	if spec.AuthorizationUrl == "" || spec.TokenUrl == "" {
		return nil, fmt.Errorf("OAuth2 provider requires authorizationUrl and tokenUrl")
	}

	if spec.UserInfoUrl == "" {
		return nil, fmt.Errorf("OAuth2 provider requires userInfoUrl")
	}

	// OAuth2 providers require explicit scopes configuration
	if spec.Scopes == "" {
		return nil, fmt.Errorf("OAuth2 provider requires scopes to be configured")
	}

	log.GetLogger().Infof("Getting OAuth2 auth handler with name %s", providerName)

	// Only send client secret if provided (confidential clients vs public clients)
	sendClientSecret := spec.ClientSecret != ""

	clientConfig := &osincli.ClientConfig{
		ClientId:                 spec.ClientId,
		ClientSecret:             spec.ClientSecret,
		AuthorizeUrl:             spec.AuthorizationUrl,
		TokenUrl:                 spec.TokenUrl,
		RedirectUrl:              config.BaseUiUrl + "/callback",
		ErrorsInStatusCode:       true,
		SendClientSecretInParams: sendClientSecret,
		Scope:                    spec.Scopes,
	}

	log.GetLogger().Infof("OAuth2 client config - ClientId: %s, ClientSecret: %s, TokenUrl: %s, RedirectUrl: %s, Scopes: %s",
		common.MaskSecret(clientConfig.ClientId), common.MaskSecret(clientConfig.ClientSecret),
		clientConfig.TokenUrl, clientConfig.RedirectUrl, clientConfig.Scope)

	client, err := osincli.NewClient(clientConfig)
	if err != nil {
		return nil, err
	}

	// Set the HTTP transport for TLS configuration
	// osincli already handles JSON responses correctly
	client.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	usernameClaim := spec.UsernameClaim
	if usernameClaim == "" {
		usernameClaim = "email"
	}

	handler := &OAuth2AuthHandler{
		tlsConfig:        tlsConfig,
		client:           client,
		userInfoEndpoint: spec.UserInfoUrl,
		usernameClaim:    usernameClaim,
		authURL:          spec.AuthorizationUrl,
		providerName:     providerName,
	}

	return handler, nil
}

func (a *OAuth2AuthHandler) GetToken(loginParams LoginParameters) (TokenData, *int64, error) {
	return exchangeToken(loginParams, a.client)
}

func (o *OAuth2AuthHandler) GetUserInfo(token string) (string, *http.Response, error) {
	body, resp, err := getUserInfo(token, o.tlsConfig, o.authURL, o.userInfoEndpoint)

	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get user info")
		return "", resp, err
	}

	if body != nil {
		// Parse response as generic map to support dynamic claims
		var userInfo map[string]interface{}
		if err := json.Unmarshal(*body, &userInfo); err != nil {
			return "", resp, fmt.Errorf("failed to unmarshal OAuth2 user response: %w", err)
		}

		// Extract username using claim path
		username, err := extractClaimValue(userInfo, o.usernameClaim)
		if err != nil {
			log.GetLogger().WithError(err).Errorf("Failed to extract username from claim '%s', user will appear as 'Anonymous'", o.usernameClaim)
			return "Anonymous", resp, nil
		}

		if username == "" {
			log.GetLogger().Errorf("Claim '%s' is empty, user will appear as 'Anonymous'", o.usernameClaim)
			return "Anonymous", resp, nil
		}

		return username, resp, nil
	}

	return "", resp, nil
}

// extractClaimValue extracts a value from a claim path using "ClaimPathSeparator" for nested claims
// Examples with "ClaimPathSeparator" as "|":
//   - "email" -> userInfo["email"]
//   - "profile|email" -> userInfo["profile"]["email"]
//   - "attributes|user|login" -> userInfo["attributes"]["user"]["login"]
func extractClaimValue(data map[string]interface{}, claimPath string) (string, error) {
	if claimPath == "" {
		return "", fmt.Errorf("claim path is empty")
	}

	// Split claim path by separator
	parts := strings.Split(claimPath, ClaimPathSeparator)

	var current interface{} = data

	// Traverse nested structure
	for i, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			return "", fmt.Errorf("invalid claim path: empty segment at position %d", i)
		}

		// Current must be a map
		currentMap, ok := current.(map[string]interface{})
		if !ok {
			return "", fmt.Errorf("claim path segment '%s' is not an object", strings.Join(parts[:i], ClaimPathSeparator))
		}

		// Get next value
		value, exists := currentMap[part]
		if !exists {
			return "", fmt.Errorf("claim '%s' not found in response", strings.Join(parts[:i+1], ClaimPathSeparator))
		}

		// If this is the last part, convert to string
		if i == len(parts)-1 {
			return claimValueToString(value)
		}

		// Otherwise, continue traversing
		current = value
	}

	return "", fmt.Errorf("unexpected error extracting claim")
}

// claimValueToString converts a claim value to string
func claimValueToString(value interface{}) (string, error) {
	switch v := value.(type) {
	case string:
		return v, nil
	case float64:
		return fmt.Sprintf("%.0f", v), nil
	case int, int64:
		return fmt.Sprintf("%d", v), nil
	case bool:
		return fmt.Sprintf("%t", v), nil
	default:
		// For complex types, try JSON marshaling
		if jsonBytes, err := json.Marshal(v); err == nil {
			return string(jsonBytes), nil
		}
		return "", fmt.Errorf("unsupported claim value type: %T", v)
	}
}

func (o *OAuth2AuthHandler) Logout(token string) (string, error) {
	// OAuth2 doesn't typically have a logout endpoint
	// Just return empty string to clear local session
	return "", nil
}

func (o *OAuth2AuthHandler) RefreshToken(refreshToken string) (TokenData, *int64, error) {
	return refreshOAuthToken(refreshToken, o.client)
}

func (a *OAuth2AuthHandler) GetLoginRedirectURL() string {
	return loginRedirectWithState(a.client, a.providerName)
}
