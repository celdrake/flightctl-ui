package middleware

import (
	"net/http"

	"github.com/flightctl/flightctl-ui/auth"
	"github.com/flightctl/flightctl-ui/common"
	"github.com/flightctl/flightctl-ui/log"
)

// This function does not verify the auth token. It just makes sure that the token is injected into Auth header
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenData, err := auth.ParseSessionCookie(r)
		if err != nil {
			log.GetLogger().Warn(err.Error())
		} else if tokenData.Token != "" {
			r.Header.Add(common.AuthHeaderKey, "Bearer "+tokenData.Token)
			if tokenData.Provider != "" {
				log.GetLogger().Debugf("Forwarding token from provider '%s' to backend API", tokenData.Provider)
			} else {
				log.GetLogger().Debug("Forwarding token to backend API (no provider specified)")
			}
		}
		next.ServeHTTP(w, r)
	})
}
