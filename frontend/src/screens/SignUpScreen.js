import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
// import { Checkbox } from 'expo-checkbox'; // Removed unused import to avoid dependency error

const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation, route }) => {
    const { type = 'personal' } = route.params || {};
    const { register, loginWithGoogle, loginWithApple } = useAuth();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showToast("Please fill in all fields", 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match", 'error');
            return;
        }

        if (!agree) {
            showToast("Please agree to the Terms and Privacy", 'error');
            return;
        }

        setLoading(true);
        // Call register from AuthContext
        const result = await register(email, password, name, type);
        setLoading(false);

        if (result.success) {
            // Navigate to Verification (if we want to simulate that flow) 
            // or directly to ProfileSetup or Dashboard.
            // Given the existing flow likely expects verification, let's go to Verification 
            // but pass the user info if needed. 
            // HOWEVER, with standard Firebase Email/Pass, we are now logged in.
            // Let's go to ProfileSetup to complete the profile (avatar, etc).
            navigation.replace('ProfileSetup');
        } else {
            showToast(result.error || "Registration failed", 'error');
        }
    };

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
                        label="Full Name"
                        placeholder="Enter your full name"
                        icon={<MaterialCommunityIcons name="account-outline" size={20} color={COLORS.secondary} />}
                        value={name}
                        onChangeText={setName}
                    />

                    <Input
                        label="Email Address"
                        placeholder="Enter your email..."
                        keyboardType="email-address"
                        icon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} />}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password..."
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Input
                        label="Confirm password"
                        placeholder="Re-enter your password..."
                        secureTextEntry
                        icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={[styles.checkbox, agree && styles.checked]}
                            onPress={() => setAgree(!agree)}
                        >
                            {agree && <MaterialCommunityIcons name="check" size={14} color="white" />}
                        </TouchableOpacity>
                        <Text style={styles.checkboxLabel}>I agree to the <Text style={styles.boldLink}>Terms</Text> and <Text style={styles.boldLink}>Privacy</Text></Text>
                    </View>

                    <Button
                        title={loading ? "Creating account..." : "Sign up"}
                        onPress={handleSignUp}
                        disabled={!agree || loading}
                        style={styles.signUpButton}
                    />

                    <Text style={styles.orText}>Or continue with</Text>

                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialIcon} onPress={async () => {
                            const res = await loginWithGoogle();
                            if (res.success) navigation.replace('ProfileSetup');
                        }}>
                            <AntDesign name="google" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon} onPress={async () => {
                            const res = await loginWithApple();
                            if (res.success) navigation.replace('ProfileSetup');
                        }}>
                            <FontAwesome name="apple" size={24} color="black" />
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
    orText: {
        textAlign: 'center',
        color: '#666',
        marginTop: SPACING.lg,
        fontSize: 14,
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
