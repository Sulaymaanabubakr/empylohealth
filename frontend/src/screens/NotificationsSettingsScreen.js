import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../components/ConfirmationModal';

const NotificationsSettingsScreen = ({ navigation }) => {
    // State for toggles
    const [msgShow, setMsgShow] = useState(true);
    const [msgSound, setMsgSound] = useState(true);

    const [groupShow, setGroupShow] = useState(true);
    const [groupSound, setGroupSound] = useState(true);

    const [showPreview, setShowPreview] = useState(true);

    const [isResetVisible, setIsResetVisible] = useState(false);
    const [isResetSuccessVisible, setIsResetSuccessVisible] = useState(false);

    const handleReset = () => {
        setMsgShow(true);
        setMsgSound(true);
        setGroupShow(true);
        setGroupSound(true);
        setShowPreview(true);
        setIsResetVisible(false);
        setIsResetSuccessVisible(true);
    };

    const renderToggleRow = (label, value, onValueChange, iconName, color = '#009688') => (
        <View style={styles.toggleRow}>
            <View style={styles.labelContainer}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={iconName} size={20} color={color} />
                </View>
                <Text style={styles.toggleLabel}>{label}</Text>
            </View>
            <Switch
                trackColor={{ false: "#E0E0E0", true: "#4DB6AC" }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#E0E0E0"
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Simple Header (Requested) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Message Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>MESSAGE NOTIFICATIONS</Text>
                    <View style={styles.card}>
                        {renderToggleRow("Show notifications", msgShow, setMsgShow, "notifications-outline")}
                        <View style={styles.divider} />
                        {renderToggleRow("Sound", msgSound, setMsgSound, "musical-note-outline")}
                    </View>
                </View>

                {/* Group Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>GROUP NOTIFICATIONS</Text>
                    <View style={styles.card}>
                        {renderToggleRow("Show notifications", groupShow, setGroupShow, "people-outline")}
                        <View style={styles.divider} />
                        {renderToggleRow("Sound", groupSound, setGroupSound, "volume-high-outline")}
                    </View>
                </View>

                {/* Preview Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PREVIEW</Text>
                    <View style={styles.card}>
                        {renderToggleRow("Show Preview", showPreview, setShowPreview, "eye-outline")}
                    </View>
                    <Text style={styles.helperText}>
                        Preview message text inside new message notifications.
                    </Text>
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => setIsResetVisible(true)}
                >
                    <Text style={styles.resetText}>Reset All Notifications</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Reset Confirmation Modal */}
            <ConfirmationModal
                visible={isResetVisible}
                title="Reset notifications"
                message="Are you sure you want to reset all notification settings to default?"
                onConfirm={handleReset}
                onCancel={() => setIsResetVisible(false)}
                confirmText="Reset"
                cancelText="Cancel"
            />

            {/* Reset Success Modal */}
            <ConfirmationModal
                visible={isResetSuccessVisible}
                message="Your notifications setting has been reset."
                singleButton={true}
                confirmText="Continue"
                onConfirm={() => setIsResetSuccessVisible(false)}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD', // Subtle blue background for back button
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9E9E9E',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toggleLabel: {
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginLeft: 48, // Indent past icon
    },
    helperText: {
        fontSize: 13,
        color: '#757575',
        marginTop: 8,
        marginLeft: 8,
        lineHeight: 18,
    },
    resetButton: {
        backgroundColor: '#FFEBEE',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    resetText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NotificationsSettingsScreen;
