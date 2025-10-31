package auth

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/flightctl/flightctl-ui/bridge"
	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
	"github.com/flightctl/flightctl/api/v1alpha1"
	"github.com/openshift/osincli"
)

type OpenShiftAuthHandler struct {
	tlsConfig      *tls.Config
	client         *osincli.Client
	internalClient *osincli.Client
	authURL        string
	apiServerURL   string
	clientId       string
	providerName   string
}

type openshiftOAuthDiscovery struct {
	Issuer                string `json:"issuer"`
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
}

func getOpenShiftAuthHandler(providerInfo *v1alpha1.AuthProviderInfo) (*OpenShiftAuthHandler, error) {
	if providerInfo.AuthUrl == nil {
		return nil, fmt.Errorf("OpenShift provider %s missing AuthUrl", providerInfo.Name)
	}

	if providerInfo.ClientId == nil || *providerInfo.ClientId == "" {
		return nil, fmt.Errorf("OpenShift provider %s missing ClientId", providerInfo.Name)
	}

	if providerInfo.TokenUrl == nil {
		return nil, fmt.Errorf("OpenShift provider %s missing TokenUrl", providerInfo.Name)
	}

	authURL := *providerInfo.AuthUrl
	apiServerURL := authURL // OpenShift API server URL (used for discovery)
	clientId := *providerInfo.ClientId
	tokenURL := *providerInfo.TokenUrl

	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return nil, err
	}

	// OpenShift OAuth uses "user:full" scope by default
	scope := "user:full"
	if providerInfo.Scopes != nil && len(*providerInfo.Scopes) > 0 {
		// Use provided scopes if available
		scope = buildScopeParam(providerInfo.Scopes, scope)
	}

	// Create OAuth2 client config for OpenShift
	oauthClientConfig := &osincli.ClientConfig{
		ClientId:                 clientId,
		AuthorizeUrl:             authURL,
		TokenUrl:                 tokenURL,
		RedirectUrl:              config.BaseUiUrl + "/callback",
		ErrorsInStatusCode:       true,
		SendClientSecretInParams: false,
		Scope:                    scope,
	}

	client, err := osincli.NewClient(oauthClientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create OpenShift OAuth client: %w", err)
	}

	client.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	handler := &OpenShiftAuthHandler{
		tlsConfig:      tlsConfig,
		internalClient: client,
		client:         client,
		authURL:        authURL,
		apiServerURL:   apiServerURL,
		clientId:       clientId,
		providerName:   *providerInfo.Name,
	}

	return handler, nil
}

func (o *OpenShiftAuthHandler) GetToken(loginParams LoginParameters) (TokenData, *int64, error) {
	return exchangeToken(loginParams, o.internalClient)
}

func (o *OpenShiftAuthHandler) GetUserInfo(tokenData TokenData) (string, *http.Response, error) {
	// For OpenShift, tokens are JWTs, so we can extract username from the token itself
	// Use IDToken if available (from OAuth response), otherwise use AccessToken
	token := tokenData.IDToken
	if token == "" {
		token = tokenData.AccessToken
	}

	if token == "" {
		return "", nil, fmt.Errorf("token is required for OpenShift userinfo")
	}

	// Extract username from JWT token claims (OpenShift tokens are JWTs)
	username, err := ExtractUsernameFromToken(token)
	if err != nil {
		log.GetLogger().WithError(err).Warnf("Failed to extract username from OpenShift token for provider %s", o.providerName)
		return "", nil, err
	}

	resp := &http.Response{
		StatusCode: http.StatusOK,
	}

	return username, resp, nil
}

func (o *OpenShiftAuthHandler) RefreshToken(refreshToken string) (TokenData, *int64, error) {
	return refreshOAuthToken(refreshToken, o.internalClient)
}

func (o *OpenShiftAuthHandler) Logout(token string) (string, error) {
	// OpenShift OAuth logout endpoint is typically at {issuer}/logout
	// Try to discover it from the OAuth discovery endpoint
	discoveryURL := fmt.Sprintf("%s/.well-known/oauth-authorization-server", o.apiServerURL)
	req, err := http.NewRequest(http.MethodGet, discoveryURL, nil)
	if err != nil {
		log.GetLogger().WithError(err).Debug("Failed to create discovery request for logout URL")
		return "", nil
	}

	httpClient := http.Client{
		Transport: &http.Transport{
			TLSClientConfig: o.tlsConfig,
		},
	}

	res, err := httpClient.Do(req)
	if err != nil {
		log.GetLogger().WithError(err).Debug("Failed to fetch OAuth discovery for logout URL")
		return "", nil
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		log.GetLogger().Debugf("OAuth discovery returned status %d", res.StatusCode)
		return "", nil
	}

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		log.GetLogger().WithError(err).Debug("Failed to read OAuth discovery response")
		return "", nil
	}

	var discovery openshiftOAuthDiscovery
	if err := json.Unmarshal(bodyBytes, &discovery); err != nil {
		log.GetLogger().WithError(err).Debug("Failed to parse OAuth discovery response")
		return "", nil
	}

	if discovery.Issuer != "" {
		logoutURL, err := url.Parse(discovery.Issuer)
		if err == nil {
			logoutURL.Path = "/logout"
			return logoutURL.String(), nil
		}
	}

	return "", nil
}

func (o *OpenShiftAuthHandler) GetLoginRedirectURL() string {
	return loginRedirect(o.client, o.providerName)
}
