import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/theme';

const normalizeText = (rawText = '') => {
    return String(rawText)
        .replace(/[—–]/g, '-')
        .replace(/^#+\s+/gm, '')
        .replace(/\r\n/g, '\n');
};

const getStandaloneHeading = (line) => {
    const trimmed = String(line || '').trim();
    const boldMatch = trimmed.match(/^(?:\*\*|__)(.+?)(?:\*\*|__):?$/);
    if (boldMatch?.[1]) {
        return boldMatch[1].trim();
    }
    return null;
};

const isCalloutLine = (line) => {
    const trimmed = String(line || '').trim().toLowerCase();
    return [
        'one grounded takeaway:',
        'what stands out today:',
        'a gentle next step:',
        'what looks strongest right now:',
        'what may need a little more support:',
    ].some((prefix) => trimmed.startsWith(prefix));
};

const FormattedInlineText = ({ text, style, boldStyle }) => {
    if (!text) return null;

    const normalized = normalizeText(text);
    const parts = normalized.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_)/g);

    return parts.map((part, i) => {
        if (!part) return null;

        if (part.startsWith('**') && part.endsWith('**')) {
            return <Text key={i} style={[style, styles.bold, boldStyle]}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
            return <Text key={i} style={[style, styles.bold, boldStyle]}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('***')) {
            return <Text key={i} style={[style, styles.italic]}>{part.slice(1, -1)}</Text>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2 && !part.startsWith('___')) {
            return <Text key={i} style={[style, styles.italic]}>{part.slice(1, -1)}</Text>;
        }
        return <Text key={i} style={style}>{part}</Text>;
    });
};

const renderParagraphLine = (line, key, textStyle) => {
    const trimmed = String(line || '').trim();
    if (!trimmed) return null;

    const heading = getStandaloneHeading(trimmed);
    if (heading) {
        return (
            <Text key={key} style={[textStyle, styles.heading]}>
                {heading}
            </Text>
        );
    }

    if (isCalloutLine(trimmed)) {
        return (
            <View key={key} style={styles.callout}>
                <Text style={[textStyle, styles.calloutText]}>
                    <FormattedInlineText
                        text={trimmed}
                        style={[textStyle, styles.calloutText]}
                        boldStyle={styles.boldAccent}
                    />
                </Text>
            </View>
        );
    }

    return (
        <Text key={key} style={[textStyle, styles.paragraphLine]}>
            <FormattedInlineText
                text={trimmed}
                style={textStyle}
                boldStyle={styles.boldAccent}
            />
        </Text>
    );
};

export const AiMessageFormatter = ({ text, textStyle }) => {
    if (!text) return null;

    const blocks = normalizeText(text).split(/\n\s*\n/);

    return (
        <View style={styles.container}>
            {blocks.map((block, bi) => {
                const hasList = /^[\s]*[-*]|^[\s]*\d+\./m.test(block);

                if (hasList) {
                    const lines = block.split('\n');
                    return (
                        <View key={bi} style={styles.blockSpacing}>
                            {lines.map((line, li) => {
                                const match = line.match(/^[\s]*([-*]|\d+\.)\s/);
                                if (match) {
                                    const prefix = match[1];
                                    const content = line.replace(/^[\s]*([-*]|\d+\.)\s/, '').trim();
                                    if (!content) return null;

                                    const marker = (prefix === '-' || prefix === '*') ? '\u2022' : prefix;

                                    return (
                                        <View key={li} style={styles.listItem}>
                                            <Text style={[textStyle, styles.bullet]}>{marker}</Text>
                                            <View style={styles.listContent}>
                                                <Text style={textStyle}>
                                                    <FormattedInlineText
                                                        text={content}
                                                        style={textStyle}
                                                        boldStyle={styles.boldAccent}
                                                    />
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                }

                                return renderParagraphLine(line, li, textStyle);
                            })}
                        </View>
                    );
                }

                const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
                if (!lines.length) return null;

                return (
                    <View key={bi} style={styles.blockSpacing}>
                        {lines.map((line, li) => renderParagraphLine(line, li, textStyle))}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexShrink: 1,
    },
    blockSpacing: {
        marginBottom: 10,
    },
    paragraphLine: {
        marginBottom: 6,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bullet: {
        marginRight: 8,
        fontWeight: '800',
        color: COLORS.primary,
        marginTop: 0,
    },
    listContent: {
        flexShrink: 1,
    },
    heading: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 8,
    },
    callout: {
        backgroundColor: '#E8F8F6',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 2,
    },
    calloutText: {
        color: '#184C47',
    },
    bold: {
        fontWeight: '800',
    },
    boldAccent: {
        color: COLORS.primary,
    },
    italic: {
        fontStyle: 'italic',
    },
});
