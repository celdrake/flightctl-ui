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
		// TEMPORARY HACK: If Authorization header is already present (e.g., from client-side injection),
		// don't overwrite it - just pass it through
		existingAuth := r.Header.Get(common.AuthHeaderKey)
		if existingAuth != "" {
			log.GetLogger().Debug("Authorization header already present, passing through")
			next.ServeHTTP(w, r)
			return
		}

		tokenData, err := auth.ParseSessionCookie(r)
		if err != nil {
			log.GetLogger().Warn(err.Error())
		} else if tokenData.Token != "" {
			r.Header.Add(common.AuthHeaderKey, "Bearer "+tokenData.Token)
		}
		next.ServeHTTP(w, r)
	})
}
