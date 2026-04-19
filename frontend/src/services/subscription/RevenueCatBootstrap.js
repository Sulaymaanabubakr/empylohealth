import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { callableClient } from '../api/callableClient';
import { revenueCatService } from './revenueCatService';
import { subscriptionGuardService } from './subscriptionGuardService';

const MIGRATION_KEY_PREFIX = 'revenuecat_migration_synced_v1:';

const RevenueCatBootstrap = () => {
    const { user } = useAuth();
    const listenerCleanupRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const cleanupListener = () => {
            listenerCleanupRef.current?.();
            listenerCleanupRef.current = null;
        };

        const syncBackendFromCustomerInfo = async (customerInfo, source, forceDowngrade = false) => {
            const payload = revenueCatService.serializeCustomerInfo(customerInfo);
            if (!payload) return null;
            const result = await subscriptionGuardService.syncRevenueCatCustomer({
                customerInfo: payload,
                source,
                forceDowngrade,
            });
            subscriptionGuardService.invalidateCache();
            return result;
        };

        const run = async () => {
            const configured = await revenueCatService.configure();
            if (!configured) return;

            if (!user?.uid) {
                cleanupListener();
                await revenueCatService.logOut();
                return;
            }

            cleanupListener();
            await revenueCatService.logIn(user.uid);

            listenerCleanupRef.current = revenueCatService.addCustomerInfoUpdateListener((customerInfo) => {
                syncBackendFromCustomerInfo(customerInfo, 'customer_info_listener').catch((error) => {
                    console.warn('[RevenueCatBootstrap] listener sync failed', error?.message || error);
                });
            });

            const oldStatus = await callableClient.invokeWithAuth('getSubscriptionStatus', {}).catch(() => null);
            let customerInfo = await revenueCatService.getCustomerInfo().catch(() => null);
            if (cancelled) return;

            const migrationKey = `${MIGRATION_KEY_PREFIX}${user.uid}`;
            const oldPlan = String(oldStatus?.entitlement?.plan || 'free').toLowerCase();
            const hadLegacySubscription = oldPlan === 'pro' || oldPlan === 'premium';
            const hasRevenueCatSubscription = revenueCatService.hasActiveSubscription(customerInfo);
            const alreadyMigrated = await AsyncStorage.getItem(migrationKey);

            if (hadLegacySubscription && !hasRevenueCatSubscription && !alreadyMigrated) {
                try {
                    const syncedInfo = await revenueCatService.syncPurchases();
                    if (syncedInfo) {
                        customerInfo = syncedInfo;
                    } else {
                        customerInfo = await revenueCatService.getCustomerInfo().catch(() => customerInfo);
                    }
                    await AsyncStorage.setItem(migrationKey, '1');
                } catch (error) {
                    console.warn('[RevenueCatBootstrap] syncPurchases failed', error?.message || error);
                }
            }

            if (cancelled) return;
            await syncBackendFromCustomerInfo(customerInfo, 'auth_boot').catch((error) => {
                console.warn('[RevenueCatBootstrap] auth boot sync failed', error?.message || error);
            });
        };

        run();

        return () => {
            cancelled = true;
            cleanupListener();
        };
    }, [user?.uid]);

    return null;
};

export default RevenueCatBootstrap;

