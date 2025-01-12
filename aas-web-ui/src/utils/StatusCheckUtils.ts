export function statusCloudIcon(status: string = ''): string {
    if (!status || status.trim() === '') return '';

    switch (status.trim()) {
        case 'online':
            return 'text-success';
        case 'offline':
            return 'text-error';
        case 'status loading':
            return '';
    }

    return '';
}

export function statusTextClass(status: string = ''): string {
    const failResponse = 'mdi-cloud-off-outline';
    if (!status || status.trim() === '') return failResponse;

    switch (status.trim()) {
        case 'online':
            return 'mdi-cloud-check-outline';
        case 'offline':
            return 'mdi-cloud-remove-outline';
        case 'status loading':
            return 'mdi-cloud-refresh-outline';
    }

    return failResponse;
}
