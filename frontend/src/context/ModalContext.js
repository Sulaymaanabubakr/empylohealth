import React, { createContext, useContext, useState, useCallback } from 'react';
import StatusModal from '../components/StatusModal';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        visible: false,
        type: 'info', // success, error, confirmation
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });

    const showModal = useCallback(({ type, title, message, onConfirm, confirmText, cancelText }) => {
        setModalState({
            visible: true,
            type: type || 'info',
            title: title || '',
            message: message || '',
            onConfirm: onConfirm || null,
            confirmText: confirmText || 'Confirm',
            cancelText: cancelText || 'Cancel'
        });
    }, []);

    const hideModal = useCallback(() => {
        setModalState((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            <StatusModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onConfirm={modalState.onConfirm}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onClose={hideModal}
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);
