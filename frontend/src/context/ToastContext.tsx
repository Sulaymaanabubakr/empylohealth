import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import Toast from '../components/Toast';
import { ToastConfig } from '../types';

interface ToastState {
    visible: boolean;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
    showToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'info',
    });

    const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        setToast({ visible: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={hideToast}
            />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
