type Recipient = {
    email: string;
    name?: string;
};
type SendMailInput = {
    to: Recipient[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    tags?: string[];
};
export declare const mailTemplates: {
    otp: (params: {
        purposeLabel: string;
        code: string;
        expiresInMinutes: number;
    }) => {
        subject: string;
        htmlContent: string;
        textContent: string;
    };
    newLogin: (params: {
        deviceLabel: string;
        signedInAtIso: string;
        locationText: string;
        secureUrl: string;
    }) => {
        subject: string;
        htmlContent: string;
    };
    passwordChanged: () => {
        subject: string;
        htmlContent: string;
    };
    passwordResetRequested: () => {
        subject: string;
        htmlContent: string;
    };
    accountDeleted: () => {
        subject: string;
        htmlContent: string;
    };
    circleDeleted: (params: {
        circleName: string;
    }) => {
        subject: string;
        htmlContent: string;
    };
};
export declare const sendBrevoEmail: (input: SendMailInput) => Promise<void>;
export declare const sendTemplateEmail: (params: {
    to: Recipient[];
    template: {
        subject: string;
        htmlContent: string;
        textContent?: string;
    };
    tags?: string[];
}) => Promise<void>;
export {};
//# sourceMappingURL=brevoEmail.d.ts.map