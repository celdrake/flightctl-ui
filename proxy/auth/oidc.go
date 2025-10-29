package auth

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/flightctl/flightctl-ui/bridge"
	"github.com/flightctl/flightctl-ui/common"
	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
	"github.com/openshift/osincli"
)

type OIDCAuthHandler struct {
	tlsConfig          *tls.Config
	client             *osincli.Client
	internalClient     *osincli.Client
	userInfoEndpoint   string
	endSessionEndpoint string
	usernameClaim      string
	authURL            string
	providerName       string // Store provider name for state parameter
	clientId           string // Client ID for this provider
}

type oidcServerResponse struct {
	TokenEndpoint      string `json:"token_endpoint"`
	AuthEndpoint       string `json:"authorization_endpoint"`
	UserInfoEndpoint   string `json:"userinfo_endpoint"`
	EndSessionEndpoint string `json:"end_session_endpoint"`
}

var defaultUsername = "Anonymous"
var defaultUsernameClaim = "preferred_username"

func getOIDCAuthHandler(authURL string, internalAuthURL *string) (*OIDCAuthHandler, error) {
	spec := AuthenticationProviderSpec{
		Issuer:        authURL,
		UsernameClaim: defaultUsernameClaim,
		ClientId:      config.AuthClientId,
		// CELIA-WIP default providers might have a client secret
		ClientSecret: "",
	}
	return getOIDCAuthHandlerWithSpec(spec, "default", internalAuthURL)
}

func getOIDCAuthHandlerWithSpec(spec AuthenticationProviderSpec, providerName string, internalAuthURL *string) (*OIDCAuthHandler, error) {
	log.GetLogger().Infof("getOIDCAuthHandlerWithSpec: %s", spec.Issuer)

	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return nil, err
	}

	authURL := spec.Issuer
	url := authURL
	if internalAuthURL != nil {
		url = *internalAuthURL
	}

	oauthConfigUrl := fmt.Sprintf("%s/.well-known/openid-configuration", url)
	req, err := http.NewRequest(http.MethodGet, oauthConfigUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	httpClient := http.Client{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch oidc config: %w", err)
	}

	defer res.Body.Close()
	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read oidc config: %w", err)
	}

	oidcResponse := oidcServerResponse{}
	if err := json.Unmarshal(bodyBytes, &oidcResponse); err != nil {
		return nil, fmt.Errorf("failed to parse oidc config: %w", err)
	}

	log.GetLogger().Infof("getOIDCAuthHandlerWithSpec: oidcResponse: %+v", oidcResponse)
	// TokenEndpoint:https://oauth2.googleapis.com/token
	// AuthEndpoint:https://accounts.google.com/o/oauth2/v2/auth
	// UserInfoEndpoint:https://openidconnect.googleapis.com/v1/userinfo
	// EndSessionEndpoint:

	internalClient, err := getOIDCClient(oidcResponse, tlsConfig, spec, providerName)
	if err != nil {
		return nil, err
	}

	usernameClaim := spec.UsernameClaim
	if usernameClaim == "" {
		usernameClaim = defaultUsernameClaim
	}

	handler := &OIDCAuthHandler{
		tlsConfig:          tlsConfig,
		internalClient:     internalClient,
		client:             internalClient,
		userInfoEndpoint:   oidcResponse.UserInfoEndpoint,
		endSessionEndpoint: oidcResponse.EndSessionEndpoint,
		usernameClaim:      usernameClaim,
		authURL:            authURL,
		providerName:       providerName,
		clientId:           spec.ClientId,
	}

	if internalAuthURL != nil {
		extConfig := oidcServerResponse{
			AuthEndpoint:       replaceBaseURL(oidcResponse.AuthEndpoint, *internalAuthURL, authURL),
			TokenEndpoint:      replaceBaseURL(oidcResponse.TokenEndpoint, *internalAuthURL, authURL),
			UserInfoEndpoint:   replaceBaseURL(oidcResponse.UserInfoEndpoint, *internalAuthURL, authURL),
			EndSessionEndpoint: replaceBaseURL(oidcResponse.EndSessionEndpoint, *internalAuthURL, authURL),
		}
		client, err := getOIDCClient(extConfig, tlsConfig, spec, providerName)
		if err != nil {
			return nil, err
		}
		handler.client = client
		// Update endpoints to use external URLs
		handler.endSessionEndpoint = extConfig.EndSessionEndpoint
	}

	return handler, nil
}

func replaceBaseURL(endpoint, oldBase, newBase string) string {
	oldURL, err := url.Parse(oldBase)
	if err != nil {
		return endpoint
	}
	newURL, err := url.Parse(newBase)
	if err != nil {
		return endpoint
	}
	endpointURL, err := url.Parse(endpoint)
	if err != nil {
		return endpoint
	}
	if endpointURL.Host == oldURL.Host {
		endpointURL.Scheme = newURL.Scheme
		endpointURL.Host = newURL.Host
	}
	return endpointURL.String()
}

func getOIDCClient(oidcConfig oidcServerResponse, tlsConfig *tls.Config, spec AuthenticationProviderSpec, providerName string) (*osincli.Client, error) {
	// Get scopes from spec, with fallback to defaults
	scope := spec.Scopes
	if scope == "" {
		// Default scopes for embedded provider or if not specified
		if providerName == DefaultProviderName && config.IsOrganizationsEnabled() {
			scope = "openid profile organization:*"
		} else {
			scope = "openid profile"
		}
	}

	log.GetLogger().Infof("getOIDCClient: scope=%s", scope)

	// Validate that we have required configuration
	clientId := spec.ClientId
	if clientId == "" {
		log.GetLogger().Errorf("Missing clientId for provider %s", providerName)
		return nil, fmt.Errorf("Missing configuration")
	}

	clientSecret := spec.ClientSecret
	sendSecret := clientSecret != ""

	log.GetLogger().Infof("Creating OIDC client for %s: clientId=%s, clientSecret=%s, scope=%s",
		providerName, common.MaskSecret(clientId), common.MaskSecret(clientSecret), scope)

	oidcClientConfig := &osincli.ClientConfig{
		ClientId:                 clientId,
		ClientSecret:             clientSecret,
		AuthorizeUrl:             oidcConfig.AuthEndpoint,
		TokenUrl:                 oidcConfig.TokenEndpoint,
		RedirectUrl:              config.BaseUiUrl + "/callback",
		ErrorsInStatusCode:       true,
		SendClientSecretInParams: sendSecret,
		Scope:                    scope,
	}

	client, err := osincli.NewClient(oidcClientConfig)
	if err != nil {
		return nil, err
	}

	client.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	return client, nil
}

func (a *OIDCAuthHandler) GetToken(loginParams LoginParameters) (TokenData, *int64, error) {
	return exchangeToken(loginParams, a.internalClient)
}

func (o *OIDCAuthHandler) GetUserInfo(token string) (string, *http.Response, error) {
	body, resp, err := getUserInfo(token, o.tlsConfig, o.authURL, o.userInfoEndpoint)

	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get user info")
		return "", resp, err
	}

	if body != nil {
		// Parse response as generic map to support dynamic claims
		var userInfo map[string]interface{}
		if err := json.Unmarshal(*body, &userInfo); err != nil {
			return "", resp, fmt.Errorf("failed to unmarshal OIDC user response: %w", err)
		}

		// Try to extract username using configured claim first
		username, err := extractClaimValue(userInfo, o.usernameClaim)
		if err == nil && username != "" {
			return username, resp, nil
		}

		// Fallback: try standard OIDC claims in order of preference
		standardClaims := []string{"preferred_username", "email", "name", "sub"}
		for _, claim := range standardClaims {
			if claim == o.usernameClaim {
				continue // Already tried this one
			}
			username, err = extractClaimValue(userInfo, claim)
			if err == nil && username != "" {
				log.GetLogger().Infof("Using '%s' claim as username fallback (configured claim '%s' not available)", claim, o.usernameClaim)
				return username, resp, nil
			}
		}

		// If all else fails, return Anonymous
		log.GetLogger().Errorf("No standard username claims found in userinfo response, user will appear as 'Anonymous'")
		return defaultUsername, resp, nil
	}

	return "", resp, nil
}

func (o *OIDCAuthHandler) Logout(token string) (string, error) {
	// If no end_session_endpoint is available, just return empty string
	// The frontend will handle local logout only
	if o.endSessionEndpoint == "" {
		log.GetLogger().Debug("No end_session_endpoint available, performing local logout only")
		return "", nil
	}

	u, err := url.Parse(o.endSessionEndpoint)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to parse end_session_endpoint")
		return "", err
	}

	uq := u.Query()
	uq.Add("post_logout_redirect_uri", config.BaseUiUrl)
	uq.Add("client_id", o.clientId)
	u.RawQuery = uq.Encode()
	return u.String(), nil
}

func (o *OIDCAuthHandler) RefreshToken(refreshToken string) (TokenData, *int64, error) {
	return refreshOAuthToken(refreshToken, o.internalClient)
}

func (a *OIDCAuthHandler) GetLoginRedirectURL() string {
	return loginRedirectWithState(a.client, a.providerName)
}
