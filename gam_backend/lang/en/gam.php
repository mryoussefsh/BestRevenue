<?php

return [
    'sync_failed' => 'GAM Sync failed: :error',
    'sync_completed_errors' => 'GAM Sync completed with errors: :reason',
    'sync_completed_success' => 'GAM Sync completed successfully.',
    'unknown_error' => 'Unknown error. Check sync logs for details.',
    'accounts_failed_sync' => 'One or more accounts failed to sync.',
    
    'error_missing_credentials' => 'Google OAuth credentials (Client ID / Secret) are missing or invalid. Please configure them in Settings.',
    'error_invalid_credentials' => 'Google OAuth client credentials are invalid. Please check your Client ID and Secret in Settings.',
    'error_token_expired' => 'GAM account refresh token has expired. Please reconnect the account via Google OAuth.',
    'error_auth_failed' => 'GAM account authentication failed. Please check credentials and reconnect the account.',
    'error_network' => 'Network error: could not reach Google servers. Please check your internet connection.',
    'error_rate_limit' => 'Google API rate limit reached. Please wait a few minutes and try again.',
];
