package auth

import (
	"errors"
	"fmt"
	"net/url"
	"reflect"
	"strconv"

	"github.com/flightctl/flightctl-ui/log"
	"github.com/openshift/osincli"
)

// sanitizeURL removes query parameters from a URL for safe logging
func sanitizeURL(u *url.URL) string {
	if u == nil {
		return ""
	}
	sanitized := *u
	sanitized.RawQuery = ""
	return sanitized.String()
}

func exchangeToken(loginParams LoginParameters, client *osincli.Client) (TokenData, *int64, error) {
	req := client.NewAccessRequest(osincli.AUTHORIZATION_CODE, &osincli.AuthorizeData{
		Code: loginParams.Code,
	})

	return executeOAuthFlow(req)
}

func refreshOAuthToken(refreshToken string, client *osincli.Client) (TokenData, *int64, error) {
	req := client.NewAccessRequest(osincli.REFRESH_TOKEN, &osincli.AuthorizeData{Code: refreshToken})
	return executeOAuthFlow(req)
}

func loginRedirect(client *osincli.Client) string {
	authorizeRequest := client.NewAuthorizeRequest(osincli.CODE)
	return authorizeRequest.GetAuthorizeUrl().String()
}

func loginRedirectWithState(client *osincli.Client, providerName string) string {
	authorizeRequest := client.NewAuthorizeRequest(osincli.CODE)

	// Use the OAuth2 state parameter to pass the provider name
	// This is preserved by the OAuth provider and returned in the callback
	return authorizeRequest.GetAuthorizeUrlWithParams(providerName).String()
}

func executeOAuthFlow(req *osincli.AccessRequest) (TokenData, *int64, error) {
	ret := TokenData{}

	// Log the token URL that will be used (without query params for security)
	tokenUrl := req.GetTokenUrl()
	sanitizedUrl := sanitizeURL(tokenUrl)
	log.GetLogger().Infof("Token exchange URL (sensitive params in POST body): %s", sanitizedUrl)

	// Exchange refresh token for a new access token
	accessData, err := req.GetToken()
	if err != nil {
		log.GetLogger().WithError(err).Errorf("Token exchange failed. Error details: %v", err)

		// Try to extract more error information if it's an osincli Error
		if oauthErr, ok := err.(*osincli.Error); ok {
			log.GetLogger().Errorf("OAuth Error Details - Error: %s, Description: %s, URI: %s",
				oauthErr.Id, oauthErr.Description, oauthErr.URI)
		}

		return ret, nil, fmt.Errorf("failed to refresh token: %w", err)
	}
	log.GetLogger().Infof("Token exchange successful. Response data keys: %v", getResponseDataKeys(accessData.ResponseData))

	expiresIn, err := getExpiresIn(accessData.ResponseData)
	if err != nil {
		return ret, nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	ret.Token = accessData.AccessToken
	ret.RefreshToken = accessData.RefreshToken // May be empty if not returned

	return ret, expiresIn, nil
}

// getResponseDataKeys returns the keys from response data for logging (without exposing sensitive values)
func getResponseDataKeys(data osincli.ResponseData) []string {
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	return keys
}

// based on GetToken() from osincli which parses the expires_in to int32 that may overflow
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
