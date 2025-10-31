package auth

import (
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
)

type TokenAuthProvider struct {
	apiTlsConfig *tls.Config
	authURL      string
}

type TokenLoginParameters struct {
	Token    string `json:"token"`
	Provider string `json:"provider,omitempty"`
}

func NewTokenAuthProvider(apiTlsConfig *tls.Config, authURL string) *TokenAuthProvider {
	return &TokenAuthProvider{
		apiTlsConfig: apiTlsConfig,
		authURL:      authURL,
	}
}

// GetToken validates the provided token by calling the backend with it
func (t *TokenAuthProvider) GetToken(loginParams LoginParameters) (TokenData, *int64, error) {
	// For token auth, we don't use OAuth code flow
	return TokenData{}, nil, fmt.Errorf("token auth does not use OAuth code flow")
}

// ValidateToken validates a K8s token by calling the backend API
func (t *TokenAuthProvider) ValidateToken(token string) (TokenData, *int64, error) {
	client := &http.Client{Transport: &http.Transport{
		TLSClientConfig: t.apiTlsConfig,
	}}

	// Call a basicbackend API endpoint to validate the token
	validateUrl := config.FctlApiUrl + "/api/v1/fleets?limit=1"

	req, err := http.NewRequest(http.MethodGet, validateUrl, nil)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to create token validation request")
		return TokenData{}, nil, err
	}

	req.Header.Add("Authorization", "Bearer "+token)

	resp, err := client.Do(req)
	if err != nil {
		return TokenData{}, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return TokenData{}, nil, fmt.Errorf("invalid token")
	}

	// Accept any successful response (2xx) or even some 4xx errors that aren't auth-related
	// as proof the token is valid
	if resp.StatusCode < 200 || resp.StatusCode >= 500 {
		return TokenData{}, nil, fmt.Errorf("token validation failed")
	}

	tokenData := TokenData{
		Token:        token,
		RefreshToken: "",
	}

	expiresIn := extractTokenExpiration(token)
	return tokenData, expiresIn, nil
}

// extractTokenExpiration extracts the expiration time from a JWT token
// Returns the number of seconds until expiration, or nil if no expiration is set
func extractTokenExpiration(token string) *int64 {
	claims, err := extractJwtTokenClaims(token)
	if err != nil {
		return nil
	}

	// Look for the "exp" claim (standard JWT expiration claim)
	exp, ok := claims["exp"]
	if !ok {
		return nil
	}

	// The exp claim is typically a float64 (Unix timestamp)
	var expTimestamp int64
	switch v := exp.(type) {
	case float64:
		expTimestamp = int64(v)
	case int64:
		expTimestamp = v
	case int:
		expTimestamp = int64(v)
	default:
		return nil
	}

	// Calculate seconds until expiration
	now := time.Now().Unix()
	expiresIn := expTimestamp - now

	// If already expired or negative, return 0
	if expiresIn < 0 {
		expiresIn = 0
	}

	return &expiresIn
}

// extractJwtTokenClaims extracts the claims from a JWT token
func extractJwtTokenClaims(token string) (map[string]interface{}, error) {
	// K8s tokens have the format: <header>.<payload>.<signature>
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// Decode the payload (second part)
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode token payload: %w", err)
	}

	// Parse the JSON payload
	var claims map[string]interface{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("failed to unmarshal token claims: %w", err)
	}

	return claims, nil
}

// extractUsernameFromClaims extracts the username from JWT claims
func extractUsernameFromClaims(claims map[string]interface{}) (string, bool) {
	// Prefer the short service account name over the full sub claim
	if k8sInfo, ok := claims["kubernetes.io"].(map[string]interface{}); ok {
		if sa, ok := k8sInfo["serviceaccount"].(map[string]interface{}); ok {
			if saName, ok := sa["name"].(string); ok && saName != "" {
				return saName, true
			}
		}
	}

	// Try to extract the service account name from the old flat claim structure
	if saName, ok := claims["kubernetes.io/serviceaccount/service-account.name"].(string); ok && saName != "" {
		return saName, true
	}

	// Fallback to sub claim (which contains the full system:serviceaccount:namespace:name format)
	if username, ok := claims["sub"].(string); ok && username != "" {
		// Try to extract just the service account name from sub if it's in the right format
		parts := strings.Split(username, ":")
		if len(parts) == 4 && parts[0] == "system" && parts[1] == "serviceaccount" {
			return parts[3], true // Return just the service account name
		}
		return username, true
	}

	return "", false
}

// ExtractUsernameFromToken extracts the username from a K8s JWT token
func ExtractUsernameFromToken(token string) (string, error) {
	claims, err := extractJwtTokenClaims(token)
	if err != nil {
		return "", err
	}

	username, ok := extractUsernameFromClaims(claims)
	if !ok {
		return "", fmt.Errorf("could not extract username from token claims")
	}

	return username, nil
}

// GetUserInfo retrieves user information from the provided JTW token
func (t *TokenAuthProvider) GetUserInfo(token string) (string, *http.Response, error) {
	username, err := ExtractUsernameFromToken(token)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to extract username from token")
		return "", nil, err
	}

	resp := &http.Response{
		StatusCode: http.StatusOK,
	}

	return username, resp, nil
}

// RefreshToken is not applicable for K8s token auth
func (t *TokenAuthProvider) RefreshToken(refreshToken string) (TokenData, *int64, error) {
	return TokenData{}, nil, fmt.Errorf("token refresh not supported for K8s token auth")
}

// Logout for token auth just clears the session
func (t *TokenAuthProvider) Logout(token string) (string, error) {
	// No special logout URL for token auth
	return "", nil
}

// GetLoginRedirectURL is not applicable for token auth
func (t *TokenAuthProvider) GetLoginRedirectURL() string {
	return ""
}

// TokenLogin handles token-based login
func (a AuthHandler) TokenLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to read request body")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var loginParams TokenLoginParameters
	err = json.Unmarshal(body, &loginParams)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to unmarshal request body")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if loginParams.Token == "" {
		log.GetLogger().Warn("Empty token provided")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if loginParams.Provider == "" {
		log.GetLogger().Warn("Empty provider name")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Get the provider for login (fetches latest auth config)
	provider, err := a.getProviderForLogin(loginParams.Provider)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to get provider: %s", loginParams.Provider)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Cast to TokenAuthProvider (we know it's token auth from the UI)
	tokenProvider, ok := provider.(*TokenAuthProvider)
	if !ok {
		log.GetLogger().Warnf("Provider %s is not a token auth provider", loginParams.Provider)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Validate the token
	tokenData, expires, err := tokenProvider.ValidateToken(loginParams.Token)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Token validation failed")
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Store the provider name in the token data so we can route to it later
	tokenData.Provider = loginParams.Provider

	respondWithToken(w, tokenData, expires)
}
