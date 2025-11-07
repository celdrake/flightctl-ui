package auth

import (
	"crypto/tls"
	b64 "encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
	"strings"

	"github.com/flightctl/flightctl-ui/common"
	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
	"github.com/openshift/osincli"
)

// Provider type constants
const (
	ProviderTypeK8s    = "k8s"
	ProviderTypeOIDC   = "oidc"
	ProviderTypeAAP    = "aap"
	ProviderTypeOAuth2 = "oauth2"
)

// Default claim constants
const (
	DefaultUsernameClaim = "preferred_username"
	DefaultRoleClaim     = "roles"
)

type TokenData struct {
	// IDToken (JWT token)
	//   - OIDC: Used for API authentication
	//   - K8s: Used for API authentication and GetUserInfo
	//   - OAuth2/AAP: Not used
	IDToken string `json:"idToken"`

	// AccessToken (opaque token)
	//   - OIDC: Used for GetUserInfo endpoint
	//   - OAuth2/AAP: Used for API authentication and GetUserInfo
	//   - K8s: Not used
	AccessToken string `json:"accessToken"`

	RefreshToken string `json:"refreshToken"`
	Provider     string `json:"provider,omitempty"`
}

// GetAuthToken returns the token to use for API authentication.
func (t TokenData) GetAuthToken() string {
	if t.IDToken != "" {
		return t.IDToken
	}
	return t.AccessToken
}

type LoginParameters struct {
	Code string `json:"code"`
}

type AuthProvider interface {
	GetToken(loginParams LoginParameters) (TokenData, *int64, error)
	GetUserInfo(tokenData TokenData) (string, *http.Response, error)
	RefreshToken(refreshToken string) (TokenData, *int64, error)
	Logout(token string) (string, error)
	GetLoginRedirectURL() string
}

func setCookie(w http.ResponseWriter, value TokenData) error {
	cookieVal, err := json.Marshal(value)
	if err != nil {
		return err
	}
	cookie := http.Cookie{
		Name:     common.CookieSessionName,
		Value:    b64.StdEncoding.EncodeToString(cookieVal),
		Secure:   config.TlsCertPath != "",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	}
	http.SetCookie(w, &cookie)
	return nil
}

func ParseSessionCookie(r *http.Request) (TokenData, error) {
	tokenData := TokenData{}
	cookie, err := r.Cookie(common.CookieSessionName)
	if err != nil && !errors.Is(err, http.ErrNoCookie) {
		log.GetLogger().Debugf("Error getting session cookie: %v", err)
		return tokenData, err
	}

	if cookie != nil {
		val, err := b64.StdEncoding.DecodeString(cookie.Value)
		if err != nil {
			log.GetLogger().Debugf("Error decoding session cookie: %v", err)
			return tokenData, err
		}

		err = json.Unmarshal(val, &tokenData)
		if err != nil {
			log.GetLogger().Debugf("Error unmarshaling session cookie: %v", err)
			return tokenData, err
		}
		log.GetLogger().Debugf("Parsed session cookie (provider: %s, id token length: %d, access token length: %d)", tokenData.Provider, len(tokenData.IDToken), len(tokenData.AccessToken))
		return tokenData, err
	}
	log.GetLogger().Debug("No session cookie found in request")
	return tokenData, nil
}

func getUserInfo(token string, tlsConfig *tls.Config, authURL string, userInfoEndpoint string) (*[]byte, *http.Response, error) {
	client := &http.Client{Transport: &http.Transport{
		TLSClientConfig: tlsConfig,
	}}

	req, err := http.NewRequest(http.MethodGet, userInfoEndpoint, nil)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to create http request")
		return nil, nil, err
	}

	req.Header.Add(common.AuthHeaderKey, "Bearer "+token)

	proxyUrl, err := url.Parse(authURL)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to parse proxy url")
		return nil, nil, err
	}
	req.Header.Add("X-Forwarded-Host", proxyUrl.Host)
	req.Header.Add("X-Forwarded-Proto", proxyUrl.Scheme)

	resp, err := client.Do(req)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get user info")
		return nil, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to read response body")
			return nil, resp, err
		}
		return &body, resp, nil
	}

	return nil, resp, nil
}

func getToken(r *http.Request) (string, error) {
	headerVal := r.Header.Get(common.AuthHeaderKey)
	token := strings.TrimPrefix(headerVal, "Bearer ")
	if token == headerVal {
		return "", errors.New("incorrect auth header value")
	}
	token = strings.TrimSpace(token)
	return token, nil
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func respondWithError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	errorResp := ErrorResponse{Error: message}
	response, err := json.Marshal(errorResp)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to marshal error response")
		return
	}
	if _, err := w.Write(response); err != nil {
		log.GetLogger().WithError(err).Warn("Failed to write error response")
	}
}

// exchangeToken exchanges an authorization code for an access token
func exchangeToken(loginParams LoginParameters, client *osincli.Client) (TokenData, *int64, error) {
	req := client.NewAccessRequest(osincli.AUTHORIZATION_CODE, &osincli.AuthorizeData{
		Code: loginParams.Code,
	})

	return executeOAuthFlow(req)
}

// refreshOAuthToken refreshes an access token using a refresh token
func refreshOAuthToken(refreshToken string, client *osincli.Client) (TokenData, *int64, error) {
	req := client.NewAccessRequest(osincli.REFRESH_TOKEN, &osincli.AuthorizeData{Code: refreshToken})
	return executeOAuthFlow(req)
}

// loginRedirect generates the OAuth login redirect URL with provider state
func loginRedirect(client *osincli.Client, providerName string) string {
	authorizeRequest := client.NewAuthorizeRequest(osincli.CODE)
	authURL := authorizeRequest.GetAuthorizeUrl()

	// Include provider name in state parameter so callback can identify which provider to use
	// Format: "provider:<providerName>" to match frontend expectations
	state := fmt.Sprintf("provider:%s", providerName)

	// Parse the URL and add state parameter
	parsedURL, err := url.Parse(authURL.String())
	if err != nil {
		// If parsing fails, return original URL
		return authURL.String()
	}

	// Add state to query parameters
	query := parsedURL.Query()
	query.Set("state", state)
	parsedURL.RawQuery = query.Encode()

	return parsedURL.String()
}

// executeOAuthFlow executes the OAuth token exchange flow
func executeOAuthFlow(req *osincli.AccessRequest) (TokenData, *int64, error) {
	ret := TokenData{}
	// Exchange refresh token for a new access token
	accessData, err := req.GetToken()
	if err != nil {
		return ret, nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	expiresIn, err := getExpiresIn(accessData.ResponseData)
	if err != nil {
		return ret, nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	// Always store the access_token
	ret.AccessToken = accessData.AccessToken

	// For OIDC flows, check if id_token is present in the response
	// OIDC providers return both access_token and id_token:
	// - id_token (JWT) is used for API authentication
	// - access_token (opaque) is used for userinfo endpoint
	if idTokenRaw, exists := accessData.ResponseData["id_token"]; exists {
		if idToken, ok := idTokenRaw.(string); ok && idToken != "" {
			ret.IDToken = idToken
		}
	}

	ret.RefreshToken = accessData.RefreshToken

	return ret, expiresIn, nil
}

// getExpiresIn extracts the expires_in value from OAuth response data
// Based on GetToken() from osincli which parses the expires_in to int32 that may overflow
func getExpiresIn(ret osincli.ResponseData) (*int64, error) {
	expires_in_raw, ok := ret["expires_in"]
	if ok {
		rv := reflect.ValueOf(expires_in_raw)
		switch rv.Kind() {
		case reflect.Float64:
			expiration := int64(rv.Float())
			return &expiration, nil
		case reflect.String:
			// if string convert to integer
			ei, err := strconv.ParseInt(rv.String(), 10, 64)
			if err != nil {
				return nil, err
			}
			return &ei, nil
		default:
			return nil, errors.New("invalid parameter value")
		}
	}
	return nil, nil
}

// buildScopeParam builds a space-separated scope string from provider scopes or default scopes
// If providerScopes is provided and non-empty, it uses those scopes.
// Otherwise, if defaultScopes is provided (as a space-separated string), it uses defaultScopes.
// Returns the space-separated scope string.
func buildScopeParam(providerScopes *[]string, defaultScopes string) string {
	// Use provider scopes if available and non-empty
	if providerScopes != nil && len(*providerScopes) > 0 {
		return strings.Join(*providerScopes, " ")
	}
	return defaultScopes
}

// getValueByPath extracts a value from a map using an array path (e.g., ["user", "name"])
// Path segments are used directly as map keys, so dots and other special characters
// are treated as literal characters (e.g., ["kubernetes.io", "some-field"] works correctly)
// Returns the value and whether it was found
func getValueByPath(data map[string]interface{}, path []string) (interface{}, bool) {
	if len(path) == 0 {
		return nil, false
	}

	current := data

	for i, part := range path {
		if i == len(path)-1 {
			// Last part - extract the value
			if value, exists := current[part]; exists {
				return value, true
			}
			return nil, false
		}

		// Navigate deeper into the object
		if next, exists := current[part]; exists {
			if nextMap, ok := next.(map[string]interface{}); ok {
				current = nextMap
			} else {
				return nil, false
			}
		} else {
			return nil, false
		}
	}

	return nil, false
}

// extractUsernameFromUserInfo extracts username from userinfo map using the specified claim path
// Supports both simple field names (e.g., ["preferred_username"]) and nested paths (e.g., ["user", "name"])
func extractUsernameFromUserInfo(userInfo map[string]interface{}, usernameClaimPath []string) string {
	// Try the specified claim path first
	if len(usernameClaimPath) > 0 {
		if val, exists := getValueByPath(userInfo, usernameClaimPath); exists {
			if str, ok := val.(string); ok && str != "" {
				return str
			}
		}
	}

	// Fallback to common OAuth2/OIDC username fields
	commonClaims := [][]string{
		{DefaultUsernameClaim},
		{"email"},
		{"sub"},
		{"name"},
		{"username"},
	}
	for _, claimPath := range commonClaims {
		if val, exists := getValueByPath(userInfo, claimPath); exists {
			if str, ok := val.(string); ok && str != "" {
				return str
			}
		}
	}

	return ""
}

// getMapKeys returns the keys of a map as a slice of strings
func getMapKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
