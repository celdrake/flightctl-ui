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

	if authConfig == nil || authConfig.Providers == nil {
		return nil, fmt.Errorf("no providers configured")
	}

	// Find the provider config
	var providerConfig *v1alpha1.AuthProvider
	for i, pc := range *authConfig.Providers {
		if pc.Metadata.Name != nil && *pc.Metadata.Name == providerName {
			providerConfig = &(*authConfig.Providers)[i]
			break
		}
	}

	if providerConfig == nil {
		return nil, fmt.Errorf("provider not found: %s", providerName)
	}

	// Get the provider type from the spec discriminator
	providerTypeStr, err := providerConfig.Spec.Discriminator()
	if err != nil {
		return nil, fmt.Errorf("failed to determine provider type for %s: %w", providerName, err)
	}

	// Create provider based on type
	var provider AuthProvider

	switch providerTypeStr {
	case ProviderTypeK8s:
		k8sSpec, err := providerConfig.Spec.AsK8sProviderSpec()
		if err != nil {
			return nil, fmt.Errorf("failed to parse K8s provider spec for %s: %w", providerName, err)
		}
		// For K8s providers, distinguish between OpenShift OAuth and vanilla K8s token auth:
		// - OpenShift: externalOpenShiftApiUrl is set and different from apiUrl
		// - Vanilla K8s: externalOpenShiftApiUrl is not set, empty, or same as apiUrl
		isOpenShift := k8sSpec.ExternalOpenShiftApiUrl != nil &&
			*k8sSpec.ExternalOpenShiftApiUrl != "" &&
			*k8sSpec.ExternalOpenShiftApiUrl != k8sSpec.ApiUrl
		if isOpenShift {
			// This is OpenShift OAuth flow
			openshiftHandler, err := getOpenShiftAuthHandler(providerConfig, &k8sSpec)
			if err != nil {
				return nil, fmt.Errorf("failed to create OpenShift provider %s: %w", providerName, err)
			}
			provider = openshiftHandler
		} else {
			// This is regular k8s token auth
			provider = NewTokenAuthProvider(a.apiTlsConfig, config.FctlApiUrl)
		}
	case ProviderTypeOIDC:
		oidcSpec, err := providerConfig.Spec.AsOIDCProviderSpec()
		if err != nil {
			return nil, fmt.Errorf("failed to parse OIDC provider spec for %s: %w", providerName, err)
		}
		oidcHandler, err := getOIDCAuthHandler(providerConfig, &oidcSpec)
		if err != nil {
			return nil, fmt.Errorf("failed to create OIDC provider %s: %w", providerName, err)
		}
		provider = oidcHandler
	case ProviderTypeAAP:
		aapSpec, err := providerConfig.Spec.AsAAPProviderSpec()
		if err != nil {
			return nil, fmt.Errorf("failed to parse AAP provider spec for %s: %w", providerName, err)
		}
		aapHandler, err := getAAPAuthHandler(providerConfig, &aapSpec)
		if err != nil {
			return nil, fmt.Errorf("failed to create AAP provider %s: %w", providerName, err)
		}
		provider = aapHandler
	case ProviderTypeOAuth2:
		oauth2Spec, err := providerConfig.Spec.AsOAuth2ProviderSpec()
		if err != nil {
			return nil, fmt.Errorf("failed to parse OAuth2 provider spec for %s: %w", providerName, err)
		}
		oauth2Handler, err := getOAuth2AuthHandler(providerConfig, &oauth2Spec)
		if err != nil {
			return nil, fmt.Errorf("failed to create OAuth2 provider %s: %w", providerName, err)
		}
		provider = oauth2Handler
	default:
		return nil, fmt.Errorf("unknown provider type: %s for provider: %s", providerTypeStr, providerName)
	}

	return provider, nil
}

func (a AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Check if auth is completely disabled (no config at all)
	if a.authConfigData == nil {
		w.WriteHeader(http.StatusTeapot)
		return
	}

	// For GET requests, extract provider from query parameter
	var provider AuthProvider
	var err error
	if r.Method == http.MethodGet {
		providerName := r.URL.Query().Get("provider")
		if providerName == "" {
			respondWithError(w, http.StatusBadRequest, "provider query parameter is required")
			return
		}

		provider, err = a.getProviderForLogin(providerName)
		if err != nil {
			log.GetLogger().WithError(err).Warnf("Could not find provider: %s", providerName)
			respondWithError(w, http.StatusBadRequest, fmt.Sprintf("Invalid authentication provider: %s", providerName))
			return
		}

		// Generate PKCE parameters (code verifier and challenge)
		codeVerifier, err := generateCodeVerifier()
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to generate PKCE code verifier, proceeding without PKCE")
			// Continue without PKCE if generation fails
			loginUrl := provider.GetLoginRedirectURL("", "")
			response, err := json.Marshal(RedirectResponse{Url: loginUrl})
			if err != nil {
				log.GetLogger().WithError(err).Warn("Failed to marshal response")
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			if _, err := w.Write(response); err != nil {
				log.GetLogger().WithError(err).Warn("Failed to write response")
			}
			return
		}

		codeChallenge := generateCodeChallenge(codeVerifier)

		// Store code verifier in cookie for later use during token exchange
		setPKCEVerifierCookie(w, providerName, codeVerifier)

		// Also encode code_verifier in state parameter as fallback if cookie fails
		loginUrl := provider.GetLoginRedirectURL(codeChallenge, codeVerifier)
		response, err := json.Marshal(RedirectResponse{Url: loginUrl})
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to marshal response")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if _, err := w.Write(response); err != nil {
			log.GetLogger().WithError(err).Warn("Failed to write response")
		}
	} else if r.Method == http.MethodPost {
		// For POST requests (OAuth callback), extract provider from query parameter
		providerName := r.URL.Query().Get("provider")
		if providerName == "" {
			respondWithError(w, http.StatusBadRequest, "provider query parameter is required")
			return
		}

		provider, err := a.getProviderForLogin(providerName)
		if err != nil {
			log.GetLogger().WithError(err).Warnf("Could not find provider: %s", providerName)
			respondWithError(w, http.StatusBadRequest, fmt.Sprintf("Invalid authentication provider: %s", providerName))
			return
		}

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

		// If code_verifier is not provided in request body, try to retrieve it from cookie or state
		if loginParams.CodeVerifier == "" {
			// First try cookie
			codeVerifier, err := getPKCEVerifierCookie(r, providerName)
			if err != nil {
				log.GetLogger().WithError(err).Warnf("Failed to get PKCE verifier from cookie for provider %s", providerName)
			} else if codeVerifier != "" {
				loginParams.CodeVerifier = codeVerifier
				log.GetLogger().Infof("Retrieved PKCE verifier from cookie for provider %s", providerName)
			} else {
				// Fallback: try to extract from state parameter
				state := r.URL.Query().Get("state")
				if state != "" {
					codeVerifier = extractCodeVerifierFromState(state, providerName)
					if codeVerifier != "" {
						loginParams.CodeVerifier = codeVerifier
						log.GetLogger().Infof("Retrieved PKCE verifier from state parameter for provider %s (cookie fallback worked)", providerName)
					} else {
						log.GetLogger().Warnf("PKCE verifier not found in cookie or state for provider %s. State was: %s", providerName, state)
					}
				} else {
					log.GetLogger().Warnf("PKCE verifier cookie not found and no state parameter for provider %s", providerName)
				}
			}
		}

		// If we still don't have a code_verifier, this will fail, but let's try anyway
		if loginParams.CodeVerifier == "" {
			log.GetLogger().Errorf("No code_verifier available for provider %s - PKCE flow will fail", providerName)
		}

		// Clear PKCE verifier cookie after use (success or failure)
		clearPKCEVerifierCookie(w, providerName)

		tokenData, expires, err := provider.GetToken(loginParams)
		if err != nil {
			log.GetLogger().WithError(err).Warn("Failed to exchange token")
			respondWithError(w, http.StatusInternalServerError, "Failed to exchange authorization code for token")
			return
		}

		// Store the provider name in the token data so we can route to it later
		tokenData.Provider = providerName

		respondWithToken(w, tokenData, expires)
	} else {
		respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
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
	if err != nil {
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// If no provider specified, clear the cookie and force a new login
	if tokenData.Provider == "" {
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	provider, err := a.getProviderForLogin(tokenData.Provider)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to get provider: %s", tokenData.Provider)
		// If provider lookup fails, treat as authentication failure
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	username, resp, err := provider.GetUserInfo(tokenData)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to get user info from provider %s", tokenData.Provider)
		// If user info retrieval fails, treat as authentication failure
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if resp.StatusCode != http.StatusOK {
		log.GetLogger().Warnf("GetUserInfo returned status %d for provider %s", resp.StatusCode, tokenData.Provider)
		// If the provider returns a non-OK status, treat as authentication failure
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			w.Header().Set("Clear-Site-Data", `"cookies"`)
		}
		w.WriteHeader(resp.StatusCode)
		return
	}

	if username == "" {
		log.GetLogger().Warnf("GetUserInfo returned empty username for provider %s", tokenData.Provider)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.GetLogger().Debugf("Successfully retrieved username '%s' from provider %s", username, tokenData.Provider)
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
	if err != nil {
		// No valid session, but still clear cookies and return success
		w.Header().Set("Clear-Site-Data", `"cookies"`)
		response, _ := json.Marshal(RedirectResponse{})
		w.Write(response)
		return
	}

	var redirectUrl string

	// If we have a provider, call its Logout method
	if tokenData.Provider != "" {
		authToken := tokenData.GetAuthToken()
		if authToken == "" {
			// No valid session, but still clear cookies and return success
			w.Header().Set("Clear-Site-Data", `"cookies"`)
			response, _ := json.Marshal(RedirectResponse{})
			w.Write(response)
			return
		}

		provider, err := a.getProviderForLogin(tokenData.Provider)
		if err == nil {
			redirectUrl, err = provider.Logout(authToken)
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
