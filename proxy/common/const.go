package common

const (
	CookieSessionName = "flightctl-session"
	AuthHeaderKey     = "Authorization"
)

// MaskSecret masks a secret string by showing only the first 4 characters followed by ***
// If the secret is empty or less than 4 characters, it returns "(empty)" or the original string
func MaskSecret(secret string) string {
	if secret == "" {
		return "(empty)"
	}
	if len(secret) <= 4 {
		return "***"
	}
	return secret[:4] + "***"
}
