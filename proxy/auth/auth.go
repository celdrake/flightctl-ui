package auth

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
	"github.com/flightctl/flightctl/api/v1alpha1"
)

type ExpiresInResp struct {
	ExpiresIn *int64 `json:"expiresIn"`
}

type UserInfoResponse struct {
	Username string `json:"username,omitempty"`
}

type RedirectResponse struct {
	Url string `json:"url"`
}

type AuthHandler struct {
	provider        AuthProvider // Default provider configured as part of the deployment
	defaultAuthURL  string       // URL of default provider
	defaultAuthType string       // Type of default provider (OIDC, AAPGateway, etc.)
	apiTlsConfig    *tls.Config  // For fetching provider specs from backend
}

func NewAuth(apiTlsConfig *tls.Config) (*AuthHandler, error) {
	auth := AuthHandler{
		apiTlsConfig: apiTlsConfig,
	}
	authConfig, internalAuthUrl, err := getAuthInfo(apiTlsConfig)
	if err != nil {
		return nil, err
	}

	if authConfig == nil {
		log.GetLogger().Info("Auth disabled")
		return &auth, nil
	}

	// Store default provider info
	auth.defaultAuthURL = authConfig.AuthURL
	auth.defaultAuthType = authConfig.AuthType

	log.GetLogger().Info("Auth config: ", authConfig.AuthType)

	// Initialize the default provider
	switch authConfig.AuthType {
	case "AAPGateway":
		auth.provider, err = getAAPAuthHandler(authConfig.AuthURL, internalAuthUrl)
	case "OIDC":
		auth.provider, err = getOIDCAuthHandler(authConfig.AuthURL, internalAuthUrl)
	case "k8s":
	case "":
		// K8s auth is CLI-only, no UI login flow needed
		// The UI will use tokens passed directly in Authorization headers
		log.GetLogger().Info("K8s authentication detected - CLI-only mode, no UI login flow")
		return &auth, nil
	default:
		err = fmt.Errorf("unknown auth type: %s", authConfig.AuthType)
	}
	if err != nil {
		return nil, err
	}

	return &auth, nil
}

// getProviderSpec fetches the OIDC provider specification by name
// CELIA-WIP: Replace with real backend API call when available:
//
//	HTTP GET to: /api/v1/authproviders/{providerName}
func (a *AuthHandler) getProviderSpec(providerName string) (*AuthenticationProvider, error) {
	// CELIA-WIP: with the real API, verify what happens if we have the same provider name in different organizations
	mockProviders := getMockAuthenticationProviders()
	for _, provider := range mockProviders {
		if provider.Metadata.Name == providerName {
			if !provider.Spec.Enabled {
				return nil, fmt.Errorf("provider %s is disabled", providerName)
			}
			return &provider, nil
		}
	}
	return nil, fmt.Errorf("provider %s not found", providerName)
}

// getProviderByName initializes a dynamic OIDC provider on-demand
func (a *AuthHandler) getProviderByName(name string) AuthProvider {
	// Return default provider for empty or default provider name
	if name == DefaultProviderName {
		return a.provider
	}

	// Fetch provider spec
	spec, err := a.getProviderSpec(name)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to fetch provider spec for %s", name)
		return nil
	}

	// Initialize provider based on type
	var provider AuthProvider
	var initErr error

	switch spec.Spec.Type {
	case ProviderTypeOIDC:
		if spec.Spec.Issuer == "" {
			log.GetLogger().Errorf("OIDC provider %s is missing required issuer URL", name)
			return nil
		}

		// Full OIDC provider with discovery - pass usernameClaim and provider name for state parameter
		provider, initErr = getOIDCAuthHandlerWithSpec(spec.Spec, name, nil)
	case ProviderTypeOAuth2:
		// OAuth2 provider with explicit endpoints - pass provider name for redirect URI
		provider, initErr = getOAuth2AuthHandlerWithSpec(spec.Spec, name)
	default:
		log.GetLogger().Errorf("Unknown provider type %s for provider %s", spec.Spec.Type, name)
		return nil
	}

	if initErr != nil {
		log.GetLogger().WithError(initErr).Warnf("Failed to initialize provider %s", name)
		return nil
	}

	log.GetLogger().Infof("Authentication provider %s (%s) initialized", name, spec.Spec.Type)
	return provider
}

// GetDefaultProviderConfig returns the default provider configuration
func (a *AuthHandler) GetDefaultProviderConfig() (string, string) {
	return a.defaultAuthURL, a.defaultAuthType
}

// getProviderFromCookie extracts the provider from the session cookie
// Returns the provider and token data, or an error if the cookie is invalid or provider unavailable
func (a *AuthHandler) getProviderFromCookie(r *http.Request) (AuthProvider, TokenData, error) {
	tokenData, err := ParseSessionCookie(r)
	if err != nil {
		return nil, TokenData{}, fmt.Errorf("failed to parse session cookie: %w", err)
	}

	provider := a.getProviderByName(tokenData.Provider)
	if provider == nil {
		return nil, TokenData{}, fmt.Errorf("provider '%s' not available", tokenData.Provider)
	}

	return provider, tokenData, nil
}

func (a AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Get provider name from query parameter
	providerName := r.URL.Query().Get("provider")
	log.GetLogger().Infof("Login request: method=%s, provider=%s", r.Method, providerName)
	provider := a.getProviderByName(providerName)

	if provider == nil {
		// Provider either not found or disabled
		log.GetLogger().Warnf("Provider not available: %s", providerName)
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to read request body")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		loginParams := LoginParameters{}
		err = json.Unmarshal(body, &loginParams)
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to unmarshal request body")
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		tokenData, expires, err := provider.GetToken(loginParams)
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to get token")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		// Store provider name in token data so we know which provider to use for refresh/userinfo
		tokenData.Provider = providerName
		respondWithToken(w, tokenData, expires)
	} else {
		loginUrl := provider.GetLoginRedirectURL()
		log.GetLogger().Infof("Returning login redirect URL for provider '%s': %s", providerName, loginUrl)
		response, err := json.Marshal(RedirectResponse{Url: loginUrl})
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to marshal response")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if _, err := w.Write(response); err != nil {
			log.GetLogger().WithError(err).Warn("Failed to write response")
		}
	}
}

func (a AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	provider, tokenData, err := a.getProviderFromCookie(r)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Refresh: Failed to get provider from cookie")
		// Clear stale cookie to prevent repeated errors
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	newTokenData, expires, err := provider.RefreshToken(tokenData.RefreshToken)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Refresh: Failed to refresh token")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	// Preserve provider name
	newTokenData.Provider = tokenData.Provider
	respondWithToken(w, newTokenData, expires)
}

func respondWithToken(w http.ResponseWriter, tokenData TokenData, expires *int64) {
	err := setCookie(w, tokenData)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	exp, err := json.Marshal(ExpiresInResp{ExpiresIn: expires})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if _, err := w.Write(exp); err != nil {
		log.GetLogger().WithError(err).Warn("Failed to write response")
	}
}

func (a AuthHandler) GetUserInfo(w http.ResponseWriter, r *http.Request) {
	log.GetLogger().Info("GetUserInfo called")

	provider, tokenData, err := a.getProviderFromCookie(r)
	if err != nil || tokenData.Token == "" {
		// For k8s auth, check if there's a token in Authorization header (direct token usage)
		if a.defaultAuthType == "k8s" {
			log.GetLogger().Info("GetUserInfo: No cookie found, checking for k8s token in Authorization header")
			token, err := getToken(r)
			if err == nil && token != "" {
				// For k8s auth, we'll return a generic user since we can't validate without calling backend
				// The actual authorization happens at the backend via the token in the request
				log.GetLogger().Info("GetUserInfo: K8s token found in Authorization header")
				userInfo := UserInfoResponse{Username: "k8s-user"}
				res, err := json.Marshal(userInfo)
				if err != nil {
					log.GetLogger().WithError(err).Warn("Failed to marshal user info")
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
				if _, err := w.Write(res); err != nil {
					log.GetLogger().WithError(err).Warn("Failed to write response")
				}
				return
			}
		}

		log.GetLogger().WithError(err).Warn("GetUserInfo: Failed to get provider from cookie")
		// Clear stale cookie to prevent repeated errors
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	log.GetLogger().Infof("GetUserInfo: Retrieved token for provider '%s'", tokenData.Provider)

	username, resp, err := provider.GetUserInfo(tokenData.Token)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get user info from provider")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if resp.StatusCode != http.StatusOK {
		log.GetLogger().Warnf("GetUserInfo: Provider returned status %d", resp.StatusCode)
		w.WriteHeader(resp.StatusCode)
		return
	}
	log.GetLogger().Infof("GetUserInfo: Successfully retrieved username: %s", username)
	userInfo := UserInfoResponse{Username: username}
	res, err := json.Marshal(userInfo)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to marshal user info")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if _, err := w.Write(res); err != nil {
		log.GetLogger().WithError(err).Warn("Failed to write response")
	}
}

func (a AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	provider, tokenData, err := a.getProviderFromCookie(r)
	if err != nil || tokenData.Token == "" {
		log.GetLogger().WithError(err).Warn("Logout: Failed to get provider from cookie")
		// Still clear the cookie even if there's an error
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusOK)
		return
	}

	redirectUrl, err := provider.Logout(tokenData.Token)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to logout")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Clear-Site-Data", `"cookies"`)
	redirectResp := RedirectResponse{}
	if redirectUrl != "" {
		redirectResp.Url = redirectUrl
	}
	response, err := json.Marshal(redirectResp)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to marshal response")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if _, err := w.Write(response); err != nil {
		log.GetLogger().WithError(err).Warn("Failed to write response")
	}
}

// TestProviderConnection validates a provider configuration by name
func (a AuthHandler) TestProviderConnection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Get provider name from URL path parameter
	// Note: In a standard setup with gorilla/mux, you'd use mux.Vars(r)["provider"]
	// but we're using a simple string extraction here for compatibility
	// CELIA-WIP fix
	providerName := r.URL.Path[len("/api/authproviders/"):]
	if idx := len(providerName) - len("/test"); idx > 0 {
		providerName = providerName[:idx]
	}

	if providerName == "" || providerName == "/test" || providerName == "test" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Provider name is required in URL path: /api/authproviders/{provider}/test",
		})
		return
	}

	// Handle default provider
	var result ProviderValidationResult
	if providerName == DefaultProviderName {
		// CELIA-WIP In real live scenarios the default provider would not be testable??
		if a.defaultAuthType == "" || a.defaultAuthURL == "" {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "No default provider configured",
			})
			return
		}

		// Create a spec for the default provider for validation
		defaultProviderSpec := AuthenticationProviderSpec{
			Type:    a.defaultAuthType,
			Enabled: true,
			// CELIA-WIP: Should is be displayed in the UI?
			ClientId: config.AuthClientId,
		}

		// For OIDC providers, set the issuer URL
		if a.defaultAuthType == ProviderTypeOIDC {
			defaultProviderSpec.Issuer = a.defaultAuthURL
		}

		// CELIA-WIP can be done for AAP?
		// Note: AAPGateway type won't have detailed validation available

		result = TestProviderConfiguration(defaultProviderSpec)
	} else {
		// Fetch provider spec for the dynamic providers
		providerSpec, err := a.getProviderSpec(providerName)
		if err != nil {
			log.GetLogger().WithError(err).Warnf("Failed to fetch provider spec for %s", providerName)
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{
				"error": fmt.Sprintf("Provider '%s' not found: %v", providerName, err),
			})
			return
		}

		// Run validation
		result = TestProviderConfiguration(providerSpec.Spec)
	}

	// Return validation result
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.GetLogger().WithError(err).Warn("Failed to encode validation result")
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func getAuthInfo(apiTlsConfig *tls.Config) (*v1alpha1.AuthConfig, *string, error) {
	client := &http.Client{Transport: &http.Transport{
		TLSClientConfig: apiTlsConfig,
	}}
	authConfigUrl := config.FctlApiUrl + "/api/v1/auth/config"

	req, err := http.NewRequest(http.MethodGet, authConfigUrl, nil)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Could not create request")
		return nil, nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get auth config")
		return nil, nil, err
	}

	if resp.StatusCode == http.StatusTeapot {
		return nil, nil, nil
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to read terminal session response")
		return nil, nil, err
	}

	authConfig := &v1alpha1.AuthConfig{}
	err = json.Unmarshal(body, authConfig)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to unmarshal auth config")
		return nil, nil, err
	}

	if config.InternalAuthUrl == "" {
		return authConfig, nil, nil
	}
	return authConfig, &config.InternalAuthUrl, nil
}
