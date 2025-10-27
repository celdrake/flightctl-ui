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
	return getOIDCAuthHandlerWithClaim(authURL, internalAuthURL, "")
}

func getOIDCAuthHandlerWithClaim(authURL string, internalAuthURL *string, usernameClaim string) (*OIDCAuthHandler, error) {
	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return nil, err
	}

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

	internalClient, err := getOIDCClient(oidcResponse, tlsConfig)
	if err != nil {
		return nil, err
	}

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
	}

	if internalAuthURL != nil {
		extConfig := oidcServerResponse{
			AuthEndpoint:       replaceBaseURL(oidcResponse.AuthEndpoint, *internalAuthURL, authURL),
			TokenEndpoint:      replaceBaseURL(oidcResponse.TokenEndpoint, *internalAuthURL, authURL),
			UserInfoEndpoint:   replaceBaseURL(oidcResponse.UserInfoEndpoint, *internalAuthURL, authURL),
			EndSessionEndpoint: replaceBaseURL(oidcResponse.EndSessionEndpoint, *internalAuthURL, authURL),
		}
		client, err := getOIDCClient(extConfig, tlsConfig)
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

func getOIDCClient(oidcConfig oidcServerResponse, tlsConfig *tls.Config) (*osincli.Client, error) {
	scope := "openid"
	if config.IsOrganizationsEnabled() {
		scope = "openid organization:*"
	}

	oidcClientConfig := &osincli.ClientConfig{
		ClientId:                 config.AuthClientId,
		AuthorizeUrl:             oidcConfig.AuthEndpoint,
		TokenUrl:                 oidcConfig.TokenEndpoint,
		RedirectUrl:              config.BaseUiUrl + "/callback",
		ErrorsInStatusCode:       true,
		SendClientSecretInParams: false,
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

		// Extract username using claim path
		username, err := extractClaimValue(userInfo, o.usernameClaim)
		if err != nil {
			log.GetLogger().WithError(err).Errorf("Failed to extract username from claim '%s', user will appear as 'Anonymous'", o.usernameClaim)
			return defaultUsername, resp, nil
		}

		if username == "" {
			log.GetLogger().Errorf("Claim '%s' is empty, user will appear as 'Anonymous'", o.usernameClaim)
			return defaultUsername, resp, nil
		}

		return username, resp, nil
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
	uq.Add("client_id", config.AuthClientId)
	u.RawQuery = uq.Encode()
	return u.String(), nil
}

func (o *OIDCAuthHandler) RefreshToken(refreshToken string) (TokenData, *int64, error) {
	return refreshOAuthToken(refreshToken, o.internalClient)
}

func (a *OIDCAuthHandler) GetLoginRedirectURL() string {
	return loginRedirect(a.client)
}
