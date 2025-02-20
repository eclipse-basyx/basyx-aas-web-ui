import { WebStorageStateStore } from 'oidc-client-ts';

export const OIDC_CONFIG = {
    client_id: import.meta.env.VITE_OIDC_CONFIG_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_OIDC_CONFIG_REDIRECT_URI,
    authority: import.meta.env.VITE_OIDC_CONFIG_AUTHORITY,
    client_secret: import.meta.env.VITE_OIDC_CONFIG_CLIENT_SECRET,
    scope: import.meta.env.VITE_OIDC_CONFIG_SCOPE,
    response_type: import.meta.env.VITE_OIDC_CONFIG_RESPONSE_TYPE,
    client_authentication: import.meta.env.VITE_OIDC_CONFIG_CLIENT_AUTHENTICATION,
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
};
