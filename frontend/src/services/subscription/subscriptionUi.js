export const showUpgradePrompt = ({ navigation, showModal, title = 'Upgrade required', guard, onBlocked } = {}) => {
    if (typeof onBlocked === 'function') onBlocked(guard);
    if (!showModal) return;
    showModal({
        type: 'confirmation',
        title,
        message: guard?.message || 'Upgrade to Premium to continue.',
        confirmText: 'View plans',
        cancelText: 'Not now',
        onConfirm: () => {
            navigation?.navigate?.('Subscription', {
                reasonCode: guard?.reasonCode || '',
                source: title
            });
        }
    });
};
