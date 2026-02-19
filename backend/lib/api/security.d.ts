import * as functions from 'firebase-functions/v1';
export declare const requestOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const verifyOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const registerWithOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const resetPasswordWithOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const changePasswordWithOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const completeEmailVerificationWithOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const changeEmailWithOtp: functions.HttpsFunction & functions.Runnable<any>;
export declare const recordLoginDevice: functions.HttpsFunction & functions.Runnable<any>;
export declare const sendAccountDeletedEmail: (params: {
    email: string;
}) => Promise<void>;
export declare const sendCircleDeletedEmails: (params: {
    circleName: string;
    memberEmails: string[];
}) => Promise<void>;
//# sourceMappingURL=security.d.ts.map