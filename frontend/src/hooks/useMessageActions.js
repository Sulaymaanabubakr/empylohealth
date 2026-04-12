import { useCallback, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../context/ToastContext';
import { sanitizeChatMessageText } from '../utils/chatMessageSafety';

export const useMessageActions = ({ onReportMessage } = {}) => {
  const { showToast } = useToast();
  const [messageActionSheet, setMessageActionSheet] = useState({
    visible: false,
    title: '',
    options: []
  });

  const copyMessageText = useCallback(async (message) => {
    const visibleText = sanitizeChatMessageText(message?.text || '');
    if (!visibleText.trim()) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    await Clipboard.setStringAsync(visibleText);
    showToast('Message copied', 'success');
  }, [showToast]);

  const openMessageActions = useCallback((message, options = {}) => {
    const canReport = Boolean(options?.canReport && typeof onReportMessage === 'function');
    const actionOptions = [
      {
        text: 'Copy message',
        onPress: () => copyMessageText(message).catch(() => showToast('Unable to copy message', 'error'))
      }
    ];
    if (canReport) {
      actionOptions.push({
        text: 'Report message',
        style: 'destructive',
        onPress: () => onReportMessage(message)
      });
    }
    setMessageActionSheet({
      visible: true,
      title: sanitizeChatMessageText(message?.text || '').trim() || 'Choose an action for this message.',
      options: actionOptions
    });
  }, [copyMessageText, onReportMessage, showToast]);

  const closeMessageActions = useCallback(() => {
    setMessageActionSheet({ visible: false, title: '', options: [] });
  }, []);

  const runMessageAction = useCallback((option) => {
    closeMessageActions();
    setTimeout(() => {
      option?.onPress?.();
    }, 0);
  }, [closeMessageActions]);

  return {
    openMessageActions,
    copyMessageText,
    messageActionSheet,
    closeMessageActions,
    runMessageAction,
  };
};
