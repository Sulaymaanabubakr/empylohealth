import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, View, Linking } from 'react-native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { ListRow } from '../components/ListRow';
import { SecondaryButton } from '../components/Buttons';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api/userService';
import { authService } from '../services/auth/authService';
import { LEGAL_LINKS } from '../constants/legalLinks';

export function SettingsScreen({ navigation }) {
  const { user, userData } = useAuth();
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyReviewEmail, setWeeklyReviewEmail] = useState(false);
  const [communityInvites, setCommunityInvites] = useState(true);

  useEffect(() => {
    const settings = userData?.settings || {};
    setDailyReminders(settings.dailyReminders ?? true);
    setWeeklyReviewEmail(settings.weeklyReviewEmail ?? false);
    setCommunityInvites(settings.communityInvites ?? true);
  }, [userData]);

  const persistSetting = async (field, value) => {
    if (!user?.uid) return;
    try {
      await userService.updateUserDocument(user.uid, {
        settings: {
          ...(userData?.settings || {}),
          [field]: value
        }
      });
    } catch (error) {
      console.error('Failed to update settings', error);
    }
  };

  return (
    <Screen hero={<AppBar title="Settings" subtitle="Tune your experience" />}>
      <Card>
        <View>
          <ListRow
            title="Daily reminders"
            right={<Switch value={dailyReminders} onValueChange={(value) => {
              setDailyReminders(value);
              persistSetting('dailyReminders', value);
            }} />}
          />
          <View style={styles.divider} />
          <ListRow
            title="Weekly review email"
            right={<Switch value={weeklyReviewEmail} onValueChange={(value) => {
              setWeeklyReviewEmail(value);
              persistSetting('weeklyReviewEmail', value);
            }} />}
          />
          <View style={styles.divider} />
          <ListRow
            title="Community invites"
            right={<Switch value={communityInvites} onValueChange={(value) => {
              setCommunityInvites(value);
              persistSetting('communityInvites', value);
            }} />}
          />
        </View>
      </Card>
      <Card>
        <View>
          <ListRow
            title="Terms of Service"
            onPress={() => Linking.openURL(LEGAL_LINKS.terms)}
          />
          <View style={styles.divider} />
          <ListRow
            title="Privacy Policy"
            onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}
          />
          <View style={styles.divider} />
          <ListRow
            title="About Circles Health App"
            onPress={() => navigation.navigate('AboutCircles')}
          />
          <View style={styles.divider} />
          <ListRow
            title="Community Education"
            onPress={() => navigation.navigate('CommunityEducation')}
          />
          <View style={styles.divider} />
          <ListRow
            title="Community Guidelines"
            onPress={() => navigation.navigate('CommunityGuidelines')}
          />
        </View>
      </Card>
      <SecondaryButton
        label="Sign out"
        onPress={async () => {
          await authService.logout();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});

export default SettingsScreen;
