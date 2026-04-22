import React from 'react';
import { Dimensions, Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import RenderHTML, { HTMLContentModel, HTMLElementModel, defaultSystemFonts } from 'react-native-render-html';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FONT_FAMILIES } from '../theme/fonts';

const videoModel = HTMLElementModel.fromCustomModel({
    tagName: 'video',
    contentModel: HTMLContentModel.block
});

const sourceModel = HTMLElementModel.fromCustomModel({
    tagName: 'source',
    contentModel: HTMLContentModel.none
});

const customHTMLElementModels = {
    video: videoModel,
    source: sourceModel
};

const systemFonts = [
    ...defaultSystemFonts,
    FONT_FAMILIES.bodyRegular,
    FONT_FAMILIES.bodyMedium,
    FONT_FAMILIES.bodyBold,
    FONT_FAMILIES.displaySemiBold,
    FONT_FAMILIES.displayBold,
    'System',
    'serif',
    'monospace'
].filter(Boolean);

const extractVideoSource = (tnode) => {
    if (tnode?.attributes?.src) return tnode.attributes.src;
    const sourceChild = Array.isArray(tnode?.children)
        ? tnode.children.find((child) => child?.tagName === 'source' && child?.attributes?.src)
        : null;
    return sourceChild?.attributes?.src || '';
};

const renderers = {
    video: ({ tnode }) => {
        const src = extractVideoSource(tnode);
        if (!src) return null;
        const player = useVideoPlayer(src, (instance) => {
            instance.loop = false;
        });
        return (
            <View style={styles.videoWrap}>
                <VideoView
                    style={styles.video}
                    player={player}
                    nativeControls
                    contentFit="contain"
                    allowsFullscreen
                />
            </View>
        );
    }
};

const tagsStyles = {
    body: {
        color: '#424242',
        fontFamily: FONT_FAMILIES.bodyRegular,
        fontSize: 16,
        lineHeight: 28
    },
    p: {
        marginTop: 0,
        marginBottom: 18
    },
    h1: {
        fontFamily: FONT_FAMILIES.displayBold,
        fontSize: 32,
        lineHeight: 38,
        color: '#102027',
        marginTop: 12,
        marginBottom: 16
    },
    h2: {
        fontFamily: FONT_FAMILIES.displayBold,
        fontSize: 26,
        lineHeight: 32,
        color: '#102027',
        marginTop: 10,
        marginBottom: 14
    },
    h3: {
        fontFamily: FONT_FAMILIES.displaySemiBold,
        fontSize: 22,
        lineHeight: 28,
        color: '#102027',
        marginTop: 8,
        marginBottom: 12
    },
    ul: {
        marginBottom: 18,
        paddingLeft: 14
    },
    ol: {
        marginBottom: 18,
        paddingLeft: 14
    },
    li: {
        marginBottom: 8
    },
    a: {
        color: '#0B7A75',
        textDecorationLine: 'underline'
    },
    img: {
        borderRadius: 22,
        marginVertical: 10
    }
};

export const RichContentRenderer = ({ html }) => {
    const { width } = useWindowDimensions();
    const contentWidth = Math.max(0, width - 48);

    if (!html) return null;

    return (
        <RenderHTML
            contentWidth={contentWidth}
            source={{ html }}
            systemFonts={systemFonts}
            customHTMLElementModels={customHTMLElementModels}
            renderers={renderers}
            tagsStyles={tagsStyles}
            renderersProps={{
                a: {
                    onPress: (_, href) => {
                        if (href) Linking.openURL(href).catch(() => {});
                    }
                },
                img: {
                    enableExperimentalPercentWidth: true
                }
            }}
        />
    );
};

const styles = StyleSheet.create({
    videoWrap: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        marginVertical: 10
    },
    video: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#0F172A'
    }
});
