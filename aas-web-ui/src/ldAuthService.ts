import { UserManager } from 'oidc-client-ts';
import { OIDC_CONFIG } from '@/constants/oidc-config';
import { useAuthStore } from '@/store/AuthStore';

export async function handleLogin(): Promise<void> {
    const userManager = new UserManager(OIDC_CONFIG);

    if (location.search) {
        const args = new URLSearchParams(location.search);
        const state = args.get('state');

        if (state) {
            const storedState = await userManager.settings.stateStore?.get(state);
            if (storedState) {
                try {
                    await userManager.signinCallback();
                } finally {
                    history.replaceState({}, document.title, '/');
                }
            }
        }
    }

    const user = await userManager.getUser();
    if (!user) {
        await userManager.signinRedirect();
    } else {
        updateStoreWithUser(user);
    }
}

function updateStoreWithUser(user: User): void {
    const authStore = useAuthStore();
    authStore.setToken(user.access_token);
    authStore.setRefreshToken(user.refresh_token);
    authStore.setAuthStatus(true);
    authStore.setAuthEnabled(true);
}
