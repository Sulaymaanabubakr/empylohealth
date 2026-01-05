import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
// import { Checkbox } from 'expo-checkbox'; // Removed unused import to avoid dependency error

const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
    const [agree, setAgree] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Image
                        source={require('../assets/images/header_shape.png')}
                        style={styles.headerShape}
                        resizeMode="stretch"
                    />
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Sign Up</Text>

                    <Input
                        label="Email Address"
                        placeholder="Enter your email..."
                        keyboardType="email-address"
                        icon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} />}
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password..."
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                    />

                    <Input
                        label="Confirm password"
                        placeholder="Enter your password..."
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                    />

                    <View style={styles.checkboxContainer}>
                        {/* Simple checkbox mockup if expo-checkbox is not installed or available */}
                        <TouchableOpacity
                            style={[styles.checkbox, agree && styles.checked]}
                            onPress={() => setAgree(!agree)}
                        >
                            {agree && <MaterialCommunityIcons name="check" size={14} color="white" />}
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel}>I agree to the <Text style={styles.boldLink}>Terms</Text> and <Text style={styles.boldLink}>Privacy</Text></Text>
                    </View>

                    <Button
                        title="Sign up"
                        onPress={() => navigation.navigate('Verification')}
                        disabled={!agree}
                        style={styles.signUpButton}
                    />

                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialIcon}>
                            <FontAwesome name="facebook" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <AntDesign name="google" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <AntDesign name="instagram" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                            <Text style={styles.linkText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerShape: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '100%',
    },
    logo: {
        width: 60,
        height: 60,
        tintColor: COLORS.white,
        marginTop: 30,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        backgroundColor: '#F8F9FA',
    },
    title: {
        ...TYPOGRAPHY.h1,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 4,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checked: {
        backgroundColor: COLORS.primary,
    },
    checkboxLabel: {
        ...TYPOGRAPHY.caption,
        color: '#666',
    },
    boldLink: {
        fontWeight: 'bold',
        color: '#333',
    },
    signUpButton: {
        marginTop: SPACING.md,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        gap: SPACING.lg,
    },
    socialIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    footerText: {
        ...TYPOGRAPHY.caption,
        color: '#666',
    },
    linkText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
});

export default SignUpScreen;
