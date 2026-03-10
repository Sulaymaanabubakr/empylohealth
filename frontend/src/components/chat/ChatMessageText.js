import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { parseChatMessageText, sanitizeChatMessageText } from '../../utils/chatMessageSafety';

const ChatMessageText = ({
  text,
  style,
  linkStyle,
  blockedLinkStyle,
  onPressLink
}) => {
  const messageText = sanitizeChatMessageText(text);
  const segments = useMemo(() => parseChatMessageText(messageText), [messageText]);

  return (
    <Text style={[styles.base, style]}>
      {segments.map((segment, index) => {
        if (segment.type !== 'link') {
          return (
            <Text key={`t_${index}`} style={style}>
              {segment.text}
            </Text>
          );
        }

        if (!segment.safe || !segment.url) {
          return (
            <Text key={`u_${index}`} style={[style, blockedLinkStyle]}>
              {segment.text}
            </Text>
          );
        }

        return (
          <Text
            key={`l_${index}`}
            style={[style, styles.link, linkStyle]}
            onPress={() => onPressLink?.(segment)}
            suppressHighlighting
          >
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    flexShrink: 1
  },
  link: {
    textDecorationLine: 'underline'
  }
});

export default ChatMessageText;
