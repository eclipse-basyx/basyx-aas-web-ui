// This file is generated at build time with version information
export const VERSION_INFO = {
    version: import.meta.env.VITE_APP_VERSION || 'dev-local',
    commitSha: import.meta.env.VITE_APP_COMMIT_SHA || 'unknown',
    buildDate: import.meta.env.VITE_APP_BUILD_DATE || new Date().toISOString(),
    mode: import.meta.env.MODE || 'development',
};

export interface VersionDisplay {
    showVersion: boolean;
    versionText: string;
    showSnapshot: boolean;
    snapshotText: string;
}

export function getVersionDisplay(): VersionDisplay {
    const { version, commitSha } = VERSION_INFO;

    // For releases: show version like "v2-251001"
    if (/^v\d+-/.test(version)) {
        return {
            showVersion: true,
            versionText: version,
            showSnapshot: false,
            snapshotText: '',
        };
    }

    // For snapshots: show commit SHA
    if (version === 'snapshot' || version.includes('SNAPSHOT')) {
        return {
            showVersion: false,
            versionText: '',
            showSnapshot: true,
            snapshotText: commitSha.substring(0, 7),
        };
    }

    // For dev mode: show both
    return {
        showVersion: true,
        versionText: 'dev',
        showSnapshot: true,
        snapshotText: commitSha.substring(0, 7),
    };
}
