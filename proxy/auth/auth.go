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
	provider       AuthProvider
	apiTlsConfig   *tls.Config
	authConfigData *v1alpha1.AuthConfig
}

func NewAuth(apiTlsConfig *tls.Config) (*AuthHandler, error) {
	auth := AuthHandler{
		apiTlsConfig: apiTlsConfig,
	}
	// CELIA-WIP: initialize the provider with default= true??
	authConfig, err := getAuthInfo(apiTlsConfig)
	if err != nil {
		return nil, err
	}

	if authConfig == nil {
		log.GetLogger().Info("Auth disabled")
		return &auth, nil
	}

	// Store the full auth config for later use
	auth.authConfigData = authConfig

	return &auth, nil
}

// getProviderForLogin creates a provider instance by fetching the latest auth config
func (a *AuthHandler) getProviderForLogin(providerName string) (AuthProvider, error) {
	// Fetch the latest auth config to support dynamic provider changes
	authConfig, err := getAuthInfo(a.apiTlsConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to get auth config: %w", err)
	}

	if authConfig.Providers == nil {
		return nil, fmt.Errorf("no providers configured")
	}

	// Find the provider config
	var providerInfo *v1alpha1.AuthProviderInfo
	for i, pc := range *authConfig.Providers {
		if pc.Name != nil && *pc.Name == providerName {
			providerInfo = &(*authConfig.Providers)[i]
			break
		}
	}

	if providerInfo == nil {
		return nil, fmt.Errorf("provider not found: %s", providerName)
	}

	// Create provider based on type
	var provider AuthProvider
	providerType := ""
	if providerInfo.Type != nil {
		providerType = string(*providerInfo.Type)
	}

	switch providerType {
	case "k8s":
		// For K8s providers, check if they have OAuth fields (ClientId, TokenUrl)
		// If not, it's a token-only provider
		if providerInfo.ClientId == nil && providerInfo.TokenUrl == nil {
			// Always validate against the flightctl backend API
			// The backend will validate the token against the appropriate K8s cluster
			provider = NewTokenAuthProvider(a.apiTlsConfig, config.FctlApiUrl)
			log.GetLogger().Debugf("Created K8s token provider: %s", providerName)
		} else {
			// TODO: Handle K8s with OpenShift OAuth flow
			return nil, fmt.Errorf("K8s OAuth provider not yet implemented: %s", providerName)
		}
	case "oidc":
		// TODO: Initialize OIDC provider
		return nil, fmt.Errorf("OIDC provider not yet implemented: %s", providerName)
	case "aap":
		// TODO: Initialize AAP provider
		return nil, fmt.Errorf("AAP provider not yet implemented: %s", providerName)
	default:
		return nil, fmt.Errorf("unknown provider type: %s for provider: %s", providerType, providerName)
	}

	return provider, nil
}

func (a AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if a.provider == nil {
		w.WriteHeader(http.StatusTeapot)
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
		tokenData, expires, err := a.provider.GetToken(loginParams)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		respondWithToken(w, tokenData, expires)
	} else {
		loginUrl := a.provider.GetLoginRedirectURL()
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
	if a.provider == nil {
		w.WriteHeader(http.StatusTeapot)
		return
	}
	tokenData, err := ParseSessionCookie(r)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	tokenData, expires, err := a.provider.RefreshToken(tokenData.RefreshToken)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	respondWithToken(w, tokenData, expires)
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
	// Check if auth is completely disabled (no config at all)
	if a.authConfigData == nil {
		w.WriteHeader(http.StatusTeapot)
		return
	}

	// Get token and provider from session cookie
	tokenData, err := ParseSessionCookie(r)
	if err != nil || tokenData.Token == "" {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// If no provider specified, clear the cookie and force a new login
	if tokenData.Provider == "" {
		log.GetLogger().Debug("No provider in session, clearing cookie to force new login")
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Get the provider instance
	provider, err := a.getProviderForLogin(tokenData.Provider)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to get provider: %s", tokenData.Provider)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Call the provider's GetUserInfo method
	username, resp, err := provider.GetUserInfo(tokenData.Token)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to get user info from provider %s", tokenData.Provider)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
		return
	}

	a.respondWithUserInfo(w, username)
}

// respondWithUserInfo is a helper to send the UserInfoResponse
func (a AuthHandler) respondWithUserInfo(w http.ResponseWriter, username string) {
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
	// Check if auth is completely disabled (no config at all)
	if a.authConfigData == nil {
		w.WriteHeader(http.StatusTeapot)
		return
	}

	// Get token and provider from session cookie
	tokenData, err := ParseSessionCookie(r)
	if err != nil || tokenData.Token == "" {
		// No valid session, but still clear cookies and return success
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		response, _ := json.Marshal(RedirectResponse{})
		w.Write(response)
		return
	}

	var redirectUrl string

	// If we have a provider, call its Logout method
	if tokenData.Provider != "" {
		provider, err := a.getProviderForLogin(tokenData.Provider)
		if err == nil {
			redirectUrl, err = provider.Logout(tokenData.Token)
			if err != nil {
				log.GetLogger().WithError(err).Warn("Failed to logout from provider")
			}
		}
	}

	// In any case, we proceed to clear the cookies
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

func getAuthInfo(apiTlsConfig *tls.Config) (*v1alpha1.AuthConfig, error) {
	client := &http.Client{Transport: &http.Transport{
		TLSClientConfig: apiTlsConfig,
	}}
	authConfigUrl := config.FctlApiUrl + "/api/v1/auth/config"

	req, err := http.NewRequest(http.MethodGet, authConfigUrl, nil)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Could not create request")
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get auth config")
		return nil, err
	}

	if resp.StatusCode == http.StatusTeapot {
		return nil, nil
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to read terminal session response")
		return nil, err
	}

	authConfig := &v1alpha1.AuthConfig{}
	err = json.Unmarshal(body, authConfig)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to unmarshal auth config")
		return nil, err
	}

	return authConfig, nil
}
