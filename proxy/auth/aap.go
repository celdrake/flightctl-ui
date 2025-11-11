package auth

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/flightctl/flightctl-ui/bridge"
	"github.com/flightctl/flightctl-ui/config"
	"github.com/flightctl/flightctl-ui/log"
	"github.com/flightctl/flightctl/api/v1alpha1"
	"github.com/openshift/osincli"
)

type AAPAuthHandler struct {
	client          *osincli.Client
	internalClient  *osincli.Client
	tlsConfig       *tls.Config
	authURL         string
	tokenURL        string
	internalAuthURL string
	clientId        string
	providerName    string
}

type AAPUser struct {
	Username string `json:"username,omitempty"`
}

type AAPUserInfo struct {
	Results []AAPUser `json:"results,omitempty"`
}

type AAPRoundTripper struct {
	Transport http.RoundTripper
}

func (c *AAPRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := c.Transport.RoundTrip(req)
	if err != nil {
		return nil, err
	}

	// AAPGateway returns 201 on success, but osincli expects 200
	if resp.StatusCode == http.StatusCreated {
		resp.StatusCode = http.StatusOK
	}
	return resp, nil
}

func getAAPAuthHandler(providerInfo *v1alpha1.AuthProviderInfo) (*AAPAuthHandler, error) {
	// Validate required fields
	if providerInfo.AuthUrl == nil {
		return nil, fmt.Errorf("AAP provider %s missing AuthUrl", providerInfo.Name)
	}

	if providerInfo.ClientId == nil || *providerInfo.ClientId == "" {
		return nil, fmt.Errorf("AAP provider %s missing ClientId", providerInfo.Name)
	}

	authURL := *providerInfo.AuthUrl
	clientId := *providerInfo.ClientId
	internalAuthURL := (*string)(nil) // AAP doesn't use internalAuthURL for now

	tlsConfig, err := bridge.GetAuthTlsConfig()
	if err != nil {
		return nil, err
	}

	client, err := getClient(authURL, tlsConfig, clientId)
	if err != nil {
		return nil, err
	}

	handler := &AAPAuthHandler{
		client:          client,
		internalClient:  client,
		tlsConfig:       tlsConfig,
		authURL:         authURL,
		tokenURL:        fmt.Sprintf("%s/o/token/", authURL),
		internalAuthURL: authURL,
		clientId:        clientId,
		providerName:    *providerInfo.Name,
	}

	if internalAuthURL != nil {
		internalClient, err := getClient(*internalAuthURL, tlsConfig, clientId)
		if err != nil {
			return nil, err
		}
		handler.internalClient = internalClient
		handler.internalAuthURL = *internalAuthURL
		handler.tokenURL = fmt.Sprintf("%s/o/token/", *internalAuthURL)
	}

	return handler, nil
}

func getClient(url string, tlsConfig *tls.Config, clientId string) (*osincli.Client, error) {
	// Use provided clientId, require it to be non-empty
	if clientId == "" {
		return nil, fmt.Errorf("clientId is required for AAP provider")
	}

	oidcClientConfig := &osincli.ClientConfig{
		ClientId:                 clientId,
		AuthorizeUrl:             fmt.Sprintf("%s/o/authorize/", url),
		TokenUrl:                 fmt.Sprintf("%s/o/token/", url),
		RedirectUrl:              config.BaseUiUrl + "/callback",
		ErrorsInStatusCode:       true,
		SendClientSecretInParams: true,
		Scope:                    "read",
	}

	client, err := osincli.NewClient(oidcClientConfig)
	if err != nil {
		return nil, err
	}

	client.Transport = &AAPRoundTripper{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	return client, nil
}

func (a *AAPAuthHandler) GetToken(loginParams LoginParameters) (TokenData, *int64, error) {
	// If PKCE is used (code_verifier provided), use PKCE-specific token exchange
	if loginParams.CodeVerifier != "" {
		// Pass empty string for client_secret - we don't have access to it in the UI proxy
		return exchangeTokenWithPKCE(loginParams, a.tokenURL, a.clientId, config.BaseUiUrl+"/callback", "", a.tlsConfig)
	}
	return exchangeToken(loginParams, a.internalClient)
}

func (a *AAPAuthHandler) GetUserInfo(tokenData TokenData) (string, *http.Response, error) {
	// For AAP, use AccessToken for userinfo endpoint
	token := tokenData.AccessToken
	if token == "" {
		return "", nil, fmt.Errorf("access token is required for AAP userinfo")
	}

	userInfoEndpoint := fmt.Sprintf("%s/api/gateway/v1/me/", a.internalAuthURL)
	body, resp, err := getUserInfo(token, a.tlsConfig, a.authURL, userInfoEndpoint)

	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to get user info")
		return "", resp, err
	}

	if body != nil {
		userInfo := AAPUserInfo{}
		if err := json.Unmarshal(*body, &userInfo); err != nil {
			log.GetLogger().WithError(err).Warn("Failed to unmarshal user info")
			return "", resp, err
		}

		if len(userInfo.Results) == 0 {
			log.GetLogger().Warn("No user results available")
			return "", resp, fmt.Errorf("no user available")
		}
		return userInfo.Results[0].Username, resp, nil
	}
	return "", resp, nil
}

func (a *AAPAuthHandler) Logout(token string) (string, error) {
	data := url.Values{}
	data.Set("client_id", a.clientId)
	data.Set("token", token)

	httpClient := http.Client{
		Transport: &http.Transport{
			TLSClientConfig: a.tlsConfig,
		},
	}
	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/o/revoke_token/", a.internalAuthURL), bytes.NewBufferString(data.Encode()))
	if err != nil {
		log.GetLogger().WithError(err).Warn("failed to create http request")
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := httpClient.Do(req)
	if err != nil {
		log.GetLogger().WithError(err).Warn("Failed to logout")
		return "", err
	}
	defer res.Body.Close()
	return "", nil
}

func (a *AAPAuthHandler) RefreshToken(refreshToken string) (TokenData, *int64, error) {
	return refreshOAuthToken(refreshToken, a.internalClient)
}

func (a *AAPAuthHandler) GetLoginRedirectURL(codeChallenge string, codeVerifier string) string {
	return loginRedirect(a.client, a.providerName, codeChallenge, codeVerifier)
}
