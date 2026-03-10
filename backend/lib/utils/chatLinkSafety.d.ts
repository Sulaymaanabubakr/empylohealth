export type ChatUrlSafetyResult = {
    safe: boolean;
    reason: string | null;
    normalizedUrl: string | null;
};
export declare const sanitizeChatMessageText: (value: unknown) => string;
export declare const isSafeChatUrl: (candidate: string) => ChatUrlSafetyResult;
export declare const extractUrlsFromMessage: (messageText: unknown) => string[];
export declare const findUnsafeUrlsInMessage: (messageText: unknown) => Array<{
    url: string;
    reason: string | null;
}>;
//# sourceMappingURL=chatLinkSafety.d.ts.map