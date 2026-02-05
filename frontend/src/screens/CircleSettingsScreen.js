import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { circleService } from '../services/api/circleService';
import { doc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import Avatar from '../components/Avatar';
import ImageCropper from '../components/ImageCropper';
import { userService } from '../services/api/userService';
import { mediaService } from '../services/api/mediaService';
import * as ImagePicker from 'expo-image-picker';

// Components for different tabs
const GeneralSettings = ({ circle, onEdit, canEdit, onEditPhoto }) => (
    <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>General Information</Text>
        <View style={styles.infoCard}>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{circle.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={[styles.infoValue, { fontSize: 13, color: '#666' }]}>{circle.description}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Accessibility</Text>
                <Text style={styles.infoValue}>{circle.type === 'private' ? 'Private' : 'Public'}</Text>
            </View>
        </View>
        {canEdit && (
            <View style={{ gap: 10 }}>
                <TouchableOpacity style={[styles.updateButton, { backgroundColor: '#E0F2F1' }]} onPress={onEditPhoto}>
                    <Text style={[styles.updateButtonText, { color: COLORS.primary }]}>Change Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.updateButton} onPress={onEdit}>
                    <Text style={styles.updateButtonText}>Edit Details</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

const RequestItem = ({ request, onAccept, onReject, processingId }) => {
    const isProcessing = processingId === request.uid;
    return (
        <View style={styles.listItem}>
            <Avatar uri={request.photoURL} name={request.displayName} size={48} />
            <View style={styles.listItemContent}>
                <Text style={styles.itemTitle}>{request.displayName}</Text>
                <Text style={styles.itemSubtitle}>Requested {new Date(request.createdAt?.toDate()).toLocaleDateString()}</Text>
                {/* Show answers if any */}
            </View>
            {isProcessing ? (
                <ActivityIndicator color={COLORS.primary} />
            ) : (
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => onReject(request)} style={[styles.smBtn, styles.rejectBtn]}>
                        <Ionicons name="close" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onAccept(request)} style={[styles.smBtn, styles.acceptBtn]}>
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const MemberItem = ({ member, currentUserUid, onManage, currentMemberRole }) => {
    // Helper to get badge color
    const getRoleBadge = (role) => {
        switch (role) {
            case 'creator': return { bg: '#FFD700', text: '#000', label: '👑 Creator' }; // Gold
            case 'admin': return { bg: '#E0E0E0', text: '#333', label: '🛡️ Admin' }; // Grey/Shield
            case 'moderator': return { bg: '#E3F2FD', text: '#1976D2', label: '👮 Mod' }; // Blue
            default: return null;
        }
    };
    const badge = getRoleBadge(member.role);

    // Permission check for showing the "Manage" button
    // Show ellipsis for everyone except self (Admin gets manage, Member gets report)
    const showOptions = member.uid !== currentUserUid;

    return (
        <View style={styles.listItem}>
            <Avatar uri={member.image} name={member.name} size={48} />
            <View style={styles.listItemContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.itemTitle}>{member.name} {member.uid === currentUserUid && '(You)'}</Text>
                    {badge && (
                        <View style={{ marginLeft: 8, backgroundColor: badge.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: badge.text }}>{badge.label}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.itemSubtitle}>{member.email || 'Member'}</Text>
            </View>
            {showOptions && (
                <TouchableOpacity onPress={() => onManage(member)} style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#757575" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const TabButton = ({ title, active, onPress, badge, alert }) => (
    <TouchableOpacity
        style={[styles.tabItem, active && styles.activeTab]}
        onPress={onPress}
    >
        <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{title}</Text>
        {badge > 0 && (
            <View style={[styles.badge, alert && styles.alertBadge]}>
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
        )}
    </TouchableOpacity>
);

const CircleSettingsScreen = ({ navigation, route }) => {
    const circleId = route?.params?.circleId;
    const { user } = useAuth();
    const { showModal } = useModal();
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState('General'); // 'General', 'Members', 'Requests', 'Reports', 'Events'
    const [circle, setCircle] = useState(null);
    const [members, setMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [reports, setReports] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [processingId, setProcessingId] = useState(null);

    // Image Cropper State
    const [cropperVisible, setCropperVisible] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    // Note: uploading state might conflict with 'loading' if not careful, but useful for specific overlay
    const [uploading, setUploading] = useState(false);

    if (!circleId || !user?.uid) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonSimple}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Circle settings are unavailable.</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Derived Role State
    const myMemberRec = members.find(m => m.uid === user.uid);
    const myRole = myMemberRec?.role || 'member'; // 'creator', 'admin', 'moderator', 'member'
    const isAdminOrCreator = ['creator', 'admin'].includes(myRole);
    const isModOrAbove = ['creator', 'admin', 'moderator'].includes(myRole);

    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportTarget, setReportTarget] = useState(null); // { uid, name, type (member) }
    const [reportReason, setReportReason] = useState('');
    const [reportDesc, setReportDesc] = useState('');

    // Schedule Event State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState(new Date());

    // Edit Circle State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const openEditModal = () => {
        setEditName(circle.name);
        setEditDesc(circle.description || '');
        setShowEditModal(true);
    };

    const handleUpdateCircle = async () => {
        if (!editName.trim()) {
            showModal({ type: 'error', title: 'Error', message: 'Name cannot be empty' });
            return;
        }
        setLoading(true);
        try {
            await circleService.updateCircle(circleId, {
                name: editName.trim(),
                description: editDesc.trim()
            });
            setCircle({ ...circle, name: editName.trim(), description: editDesc.trim() });
            setShowEditModal(false);
            showModal({ type: 'success', title: 'Success', message: 'Circle updated successfully.' });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Failed to update circle.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showModal({ type: 'error', title: 'Permission Required', message: 'Please grant photo library access to upload a circle photo.' });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Use custom cropper
                quality: 1,
            });

            if (!result.canceled && result.assets[0]?.uri) {
                setTempImage(result.assets[0].uri);
                setTimeout(() => setCropperVisible(true), 500);
            }
        } catch (error) {
            console.error('Photo selection error:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to select photo.' });
        }
    };

    // Initial Fetch
    useEffect(() => {
        if (!circleId) return;
        const fetchCircle = async () => {
            const c = await circleService.getCircleById(circleId);
            setCircle(c);
            setLoading(false);
        };
        fetchCircle();

        // Listen for requests (if private)
        const qReq = query(collection(db, 'circles', circleId, 'requests'), orderBy('createdAt', 'desc'));
        const unsubReq = onSnapshot(qReq, (snap) => {
            setRequests(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
        });

        // Listen for reports
        const qRep = query(collection(db, 'circles', circleId, 'reports'), orderBy('createdAt', 'desc'));
        const unsubRep = onSnapshot(qRep, (snap) => {
            setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listen for members (basic subcollection list for management)
        // Optimization: In real app, might paginate. Here we fetch all (up to reasonable limit)
        const qMem = query(collection(db, 'circles', circleId, 'members'), orderBy('joinedAt', 'desc'));
        const unsubMem = onSnapshot(qMem, (snap) => {
            // In reality need to fetch user profiles for names/images
            // For demo, we might miss profile data if not joined with users...
            // Let's do a quick client-side join logic or just display rough data?
            // Since we need names, let's fetch profiles if changed.
            const mems = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            setMembers(mems);
        });

        const unsubEvents = circleService.subscribeToScheduledHuddles(circleId, (list) => {
            setEvents(list);
        });

        return () => {
            unsubReq();
            unsubMem();
            unsubRep();
            unsubEvents();
        };
    }, [circleId]);

    // Enrich Members and Requests with User Data
    const [enrichedMembers, setEnrichedMembers] = useState([]);
    const [enrichedRequests, setEnrichedRequests] = useState([]);

    useEffect(() => {
        const fetchProfiles = async () => {
            // Enrich Members
            if (members.length > 0) {
                try {
                    const enrichedM = await Promise.all(members.map(async (m) => {
                        if (m.uid) {
                            const userDoc = await userService.getUserDocument(m.uid);
                            return {
                                ...m,
                                name: userDoc?.name || userDoc?.displayName || 'Unknown Member',
                                image: userDoc?.photoURL || null,
                                email: userDoc?.email || ''
                            };
                        }
                        return { ...m, name: 'Unknown', image: null };
                    }));
                    setEnrichedMembers(enrichedM);
                } catch (error) {
                    console.error("Failed to enrich members", error);
                    setEnrichedMembers(members);
                }
            } else {
                setEnrichedMembers([]);
            }

            // Enrich Requests
            if (requests.length > 0) {
                try {
                    const enrichedR = await Promise.all(requests.map(async (r) => {
                        if (r.uid) {
                            const userDoc = await userService.getUserDocument(r.uid);
                            return {
                                ...r,
                                displayName: userDoc?.name || userDoc?.displayName || r.displayName || 'Unknown',
                                photoURL: userDoc?.photoURL || r.photoURL || null,
                            };
                        }
                        return r;
                    }));
                    setEnrichedRequests(enrichedR);
                } catch (error) {
                    setEnrichedRequests(requests);
                }
            } else {
                setEnrichedRequests([]);
            }
        };
        fetchProfiles();
    }, [members, requests]);


    const handleAcceptRequest = async (req) => {
        setProcessingId(req.uid);
        try {
            await circleService.handleJoinRequest(circleId, req.uid, 'accept');
            showModal({ type: 'success', title: 'Approved', message: `${req.displayName} has gathered to the circle.` });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Failed to approve request.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectRequest = async (req) => {
        setProcessingId(req.uid);
        try {
            await circleService.handleJoinRequest(circleId, req.uid, 'reject');
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Failed to reject request.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleManageMember = async (member) => {
        // Determine available actions based on target's role and my role
        // Uses top-level myRole


        const options = [{ text: 'Cancel', style: 'cancel' }];

        // ADMIN/CREATOR ACTIONS
        if (myRole === 'creator' || (myRole === 'admin' && member.role !== 'admin')) {
            if (member.role === 'member') {
                options.push({ text: 'Promote to Moderator', onPress: () => performMemberAction(member, 'promote_mod') });
                options.push({ text: 'Promote to Admin', onPress: () => performMemberAction(member, 'promote_admin') });
            } else if (member.role === 'moderator') {
                options.push({ text: 'Promote to Admin', onPress: () => performMemberAction(member, 'promote_admin') });
                options.push({ text: 'Demote to Member', onPress: () => performMemberAction(member, 'demote') });
            } else if (member.role === 'admin' && myRole === 'creator') {
                options.push({ text: 'Demote to Moderator', onPress: () => performMemberAction(member, 'promote_mod') });
                options.push({ text: 'Demote to Member', onPress: () => performMemberAction(member, 'demote') });
            }
            // Kick/Ban
            options.push({ text: 'Kick User', onPress: () => performMemberAction(member, 'kick'), style: 'destructive' });
            options.push({ text: 'Ban User', onPress: () => performMemberAction(member, 'ban'), style: 'destructive' });
        } else {
            // REGULAR MEMBER ACTIONS (Report)
            options.push({
                text: 'Report User',
                onPress: () => {
                    setReportTarget({ uid: member.uid, name: member.name, type: 'member' });
                    setShowReportModal(true);
                },
                style: 'destructive'
            });
        }

        // Alert.alert replacement
        console.log('Options for member:', member.name, options);
        showModal({ type: 'info', title: 'Member Options', message: 'Member management actions are being updated.' });
    };

    const handleSubmitReport = async () => {
        if (!reportReason) {
            showModal({ type: 'error', title: 'Required', message: 'Please provide a reason.' });
            return;
        }
        setLoading(true);
        try {
            await circleService.submitReport(
                circleId,
                reportTarget.uid,
                reportTarget.type,
                reportReason,
                reportDesc
            );

            setShowReportModal(false);
            showModal({ type: 'success', title: 'Reported', message: 'Thank you. Administrators will review this.' });
            setReportReason('');
            setReportDesc('');
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Failed to submit report.' });
        } finally {
            setLoading(false);
        }
    };

    const performMemberAction = async (member, action) => {
        setLoading(true);
        try {
            await circleService.manageMember(circleId, member.uid, action);
            showModal({ type: 'success', title: 'Success', message: 'Member updated.' });
            // List updates automatically via onSnapshot
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Action failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleEvent = async () => {
        if (!eventTitle.trim()) {
            showModal({ type: 'error', title: 'Required', message: 'Please enter a title.' });
            return;
        }
        try {
            setLoading(true);
            await circleService.scheduleHuddle(circleId, eventTitle, eventDate);
            setShowScheduleModal(false);
            setEventTitle('');
            showModal({ type: 'success', title: 'Success', message: 'Huddle scheduled.' });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Failed to schedule huddle.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        showModal({
            type: 'confirmation',
            title: 'Delete Event',
            message: 'Are you sure you want to delete this event?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await circleService.deleteScheduledHuddle(circleId, eventId);
                    // Short delay to allow modal to close before showing success? 
                    // Or modal handles replacement? The current StatusModal design only supports one at a time.
                    // We need to wait for close.
                    setTimeout(() => {
                        showModal({ type: 'success', title: 'Deleted', message: 'Event successfully deleted.' });
                    }, 500);
                } catch (error) {
                    console.error("Error deleting event:", error);
                    setTimeout(() => {
                        showModal({ type: 'error', title: 'Error', message: 'Failed to delete event.' });
                    }, 500);
                }
            }
        });
    };

    const MembersTab = () => {
        // Uses top-level myRole

        return (
            <View style={styles.tabContent}>
                <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                {enrichedMembers.map(mem => (
                    <MemberItem key={mem.uid} member={mem} currentUserUid={user.uid} onManage={handleManageMember} currentMemberRole={myRole} />
                ))}
            </View>
        );
    };

    const RequestsTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Join Requests ({requests.length})</Text>
            {requests.length === 0 ? (
                <Text style={styles.emptyText}>No pending requests.</Text>
            ) : (
                enrichedRequests.map(req => (
                    <RequestItem key={req.uid} request={req}
                        onAccept={handleAcceptRequest} onReject={handleRejectRequest}
                        processingId={processingId}
                    />
                ))
            )}
        </View>
    );

    const handleResolveReport = async (report, action) => {
        showModal({
            type: 'confirmation',
            title: 'Confirm Action',
            message: `Are you sure you want to ${action} this report?`,
            confirmText: 'Confirm',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await circleService.resolveCircleReport(circleId, report.id, action, `Action taken by ${user.uid}`);
                    setTimeout(() => {
                        showModal({ type: 'success', title: 'Success', message: 'Report resolved.' });
                    }, 500);
                } catch (error) {
                    setTimeout(() => {
                        showModal({ type: 'error', title: 'Error', message: 'Failed to resolve report.' });
                    }, 500);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const ReportsTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Reports ({reports.length})</Text>
            {reports.length === 0 ? (
                <Text style={styles.emptyText}>No pending reports.</Text>
            ) : (
                reports.map(rep => (
                    <View key={rep.id} style={styles.listItem}>
                        <View style={styles.listItemContent}>
                            <Text style={styles.itemTitle}>{rep.reason}</Text>
                            <Text style={styles.itemSubtitle}>{rep.description}</Text>
                            <Text style={{ fontSize: 12, color: '#9E9E9E', marginTop: 4 }}>
                                Target: {rep.targetType} ({rep.targetId})
                            </Text>
                            <Text style={{ fontSize: 12, color: '#9E9E9E' }}>Status: {rep.status}</Text>
                        </View>
                        {rep.status === 'pending' && (
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity onPress={() => handleResolveReport(rep, 'dismiss')} style={[styles.smBtn, { backgroundColor: '#E0E0E0', width: 'auto', paddingHorizontal: 12 }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '600' }}>Dismiss</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleResolveReport(rep, 'ban')} style={[styles.smBtn, { backgroundColor: '#FFEBEE', width: 'auto', paddingHorizontal: 12 }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#D32F2F' }}>Ban</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))
            )}
        </View>
    );

    const EventsTab = () => (
        <View style={styles.tabContent}>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowScheduleModal(true)}>
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Schedule Huddle</Text>
            </TouchableOpacity>

            <View style={{ height: 16 }} />

            {events.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming events scheduled.</Text>
            ) : (
                events.map(item => (
                    <View key={item.id} style={styles.listItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.itemSubtitle}>
                                {item.scheduledAt?.toDate ? item.scheduledAt.toDate().toLocaleString() : new Date(item.scheduledAt).toLocaleString()}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.actionButtonSmall}>
                            <Ionicons name="trash-outline" size={18} color="#FF5252" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    );

    if (loading || !circle) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Circle Settings</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderHeader()}

            {/* Role Indicator Banner */}
            <View style={{ backgroundColor: '#E3F2FD', paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: '#1565C0', fontWeight: '600', fontSize: 12 }}>
                    You are viewing this Circle as: {myRole.toUpperCase()}
                </Text>
            </View>

            {/* Custom Tab Bar */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabBar}
                    style={{ flexGrow: 0 }}
                >
                    <TabButton title="General" active={activeTab === 'General'} onPress={() => setActiveTab('General')} />
                    <TabButton title="Members" active={activeTab === 'Members'} onPress={() => setActiveTab('Members')} />
                    <TabButton title="Events" active={activeTab === 'Events'} onPress={() => setActiveTab('Events')} />

                    {isAdminOrCreator && (
                        <TabButton title="Requests" active={activeTab === 'Requests'} onPress={() => setActiveTab('Requests')} badge={requests.length} />
                    )}
                    {isModOrAbove && (
                        <TabButton title="Reports" active={activeTab === 'Reports'} onPress={() => setActiveTab('Reports')} badge={reports.length} alert />
                    )}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'General' && <GeneralSettings circle={circle} onEdit={openEditModal} canEdit={isAdminOrCreator} onEditPhoto={handleUpdatePhoto} />}
                {activeTab === 'Members' && <MembersTab />}
                {activeTab === 'Requests' && isAdminOrCreator && <RequestsTab />}
                {activeTab === 'Reports' && isModOrAbove && <ReportsTab />}
                {activeTab === 'Events' && <EventsTab />}
            </ScrollView>

            <Modal visible={showScheduleModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Schedule Huddle</Text>

                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Weekly Sync"
                            value={eventTitle}
                            onChangeText={setEventTitle}
                        />

                        {/* Simple Date Input for MVP */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => setEventDate(new Date(Date.now() + 3600000))} style={styles.chip}>
                                <Text>+1 Hour (Demo)</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={{ marginBottom: 20, color: '#666' }}>{eventDate.toLocaleString()}</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowScheduleModal(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleScheduleEvent} style={styles.modalConfirm}>
                                <Text style={styles.modalConfirmText}>{loading ? 'Saving...' : 'Schedule'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showEditModal} animationType="fade" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Circle Details</Text>

                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Circle Name"
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            value={editDesc}
                            onChangeText={setEditDesc}
                            placeholder="Description"
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateCircle} style={styles.modalConfirm}>
                                <Text style={styles.modalConfirmText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Report Modal */}
            <Modal visible={showReportModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Report Member</Text>
                        <Text style={{ marginBottom: 16, color: '#666' }}>Reporting {reportTarget?.name}</Text>

                        <Text style={styles.label}>Reason</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Harassment, Spam"
                            value={reportReason}
                            onChangeText={setReportReason}
                        />

                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Details..."
                            value={reportDesc}
                            onChangeText={setReportDesc}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSubmitReport} style={[styles.modalConfirm, { backgroundColor: '#D32F2F' }]}>
                                <Text style={styles.modalConfirmText}>Submit Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>


            <ImageCropper
                visible={cropperVisible}
                imageUri={tempImage}
                onClose={() => setCropperVisible(false)}
                onCrop={async (uri, cropData) => {
                    setCropperVisible(false);
                    setLoading(true); // Block UI
                    try {
                        const uploadedUrl = await mediaService.uploadAsset(uri, 'circles');
                        // Apply standard header transformation
                        const optimizedUrl = uploadedUrl.replace('/upload/', '/upload/c_fill,w_800,h_400,g_auto/');

                        await circleService.updateCircle(circleId, {
                            image: optimizedUrl
                        });

                        // Optimistic update
                        setCircle(prev => ({ ...prev, image: optimizedUrl }));
                        showModal({ type: 'success', title: 'Success', message: 'Circle photo updated.' });
                    } catch (error) {
                        console.error("Upload failed", error);
                        showModal({ type: 'error', title: 'Error', message: 'Failed to upload photo.' });
                    } finally {
                        setLoading(false);
                    }
                }}
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backButtonSimple: { padding: 16 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyStateText: { color: '#666', fontSize: 14, textAlign: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backBtn: { padding: 4 },
    tabBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFF'
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        height: 40, // Explicit height to prevent stretching
    },
    activeTab: {
        backgroundColor: '#E0F2F1', // Light version of primary
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    tabLabel: { marginLeft: 6, fontWeight: '600', color: '#757575' },
    activeTabLabel: { color: COLORS.primary },
    badge: {
        marginLeft: 6,
        backgroundColor: '#D32F2F',
        borderRadius: 10,
        height: 20,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    content: { padding: 16 },
    tabContent: {},
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
    infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    infoLabel: { color: '#757575', fontSize: 14 },
    infoValue: { fontSize: 16, fontWeight: '600', color: '#333' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
    updateButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
    updateButtonText: { color: '#FFF', fontWeight: '700' },
    emptyText: { color: '#9E9E9E', fontStyle: 'italic', marginTop: 10 },
    // List Items
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    listItemContent: { flex: 1, marginLeft: 12 },
    itemTitle: { fontWeight: '700', fontSize: 16, color: '#333' },
    itemSubtitle: { color: '#757575', fontSize: 13, marginTop: 2 },
    actionButtons: { flexDirection: 'row' },
    smBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    rejectBtn: { backgroundColor: '#FFEBEE' },
    acceptBtn: { backgroundColor: COLORS.primary },
    moreBtn: { padding: 8 },
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 14, color: '#757575', marginBottom: 8, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 20, color: '#333' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
    modalCancel: { flex: 1, padding: 14, alignItems: 'center', marginRight: 8, backgroundColor: '#F5F5F5', borderRadius: 12 },
    modalConfirm: { flex: 1, padding: 14, alignItems: 'center', marginLeft: 8, backgroundColor: COLORS.primary, borderRadius: 12 },
    modalCancelText: { color: '#757575', fontWeight: '700' },
    modalConfirmText: { color: '#FFF', fontWeight: '700' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E0F2F1', borderRadius: 20, marginRight: 8 },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 12, borderRadius: 12 },
    addButtonText: { color: '#FFF', fontWeight: '600', marginLeft: 8 },
    actionButtonSmall: { padding: 8 }
});

export default CircleSettingsScreen;
