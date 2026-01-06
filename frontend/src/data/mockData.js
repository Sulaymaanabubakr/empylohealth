export const SUPPORT_GROUPS = [
    {
        id: '1',
        name: 'Community Connect',
        members: 12,
        verified: true,
        tags: ['Connect', 'Culture'],
        image: require('../assets/images/icon_support_community.png'),
        description: 'We are a community dedicated to connecting people from diverse backgrounds. Share your stories, learn from others, and build lasting friendships in a safe and welcoming environment.',
        activeMembers: 11,
        meetingsPerWeek: 2,
        contact: {
            address: '123 Community Lane, Cityville',
            phone: '+1 555-0123',
            email: 'connect@community.org'
        }
    },
    {
        id: '2',
        name: 'Mindful Moments',
        members: 22,
        verified: true,
        tags: ['Mental health'],
        image: require('../assets/images/icon_support_mental.png'),
        description: 'Practice mindfulness and meditation techniques to reduce stress and anxiety. Our group focuses on living in the present moment and cultivating inner peace.',
        activeMembers: 18,
        meetingsPerWeek: 3,
        contact: {
            address: '456 Serenity Way, Wellness Park',
            phone: '+1 555-0124',
            email: 'peace@mindfulmoments.com'
        }
    },
    {
        id: '3',
        name: 'Green Living',
        members: 12,
        verified: true,
        tags: ['Green Activities'],
        image: require('../assets/images/icon_support_nature.png'),
        description: 'Join us in making sustainable lifestyle choices. We discuss eco-friendly habits, gardening, recycling, and how to reduce our carbon footprint.',
        activeMembers: 10,
        meetingsPerWeek: 1,
        contact: {
            address: '789 Eco Blvd, Green City',
            phone: '+1 555-0125',
            email: 'nature@greenliving.org'
        }
    },
    {
        id: '4',
        name: 'Workplace Enablement',
        members: 12,
        verified: true,
        tags: ['Enablement'],
        image: require('../assets/images/icon_support_community.png'),
        description: 'Support and resources for professional growth. We discuss workplace challenges, career development, and strategies for a balanced work-life.',
        activeMembers: 8,
        meetingsPerWeek: 1,
        contact: {
            address: '101 Corporate Dr, Business District',
            phone: '+1 555-0126',
            email: 'growth@workplacen.com'
        }
    },
    {
        id: '5',
        name: 'Wellness Warriors',
        members: 12,
        verified: true,
        tags: ['Physical health'],
        image: require('../assets/images/icon_support_mental.png'),
        description: 'Focused on physical health and exercise. Whether you are a beginner or an athlete, join us for motivation, tips, and group workouts.',
        activeMembers: 12,
        meetingsPerWeek: 4,
        contact: {
            address: '202 Fitness Ave, Sportstown',
            phone: '+1 555-0127',
            email: 'fit@wellnesswarriors.com'
        }
    },
    {
        id: '6',
        name: 'Eco Friends',
        members: 15,
        verified: true,
        tags: ['Green Activities'],
        image: require('../assets/images/icon_support_nature.png'),
        description: 'A friendly group for nature lovers. We organize local cleanups, hikes, and discussions about preserving our local environment.',
        activeMembers: 14,
        meetingsPerWeek: 2,
        contact: {
            address: '303 Nature Path, Forest Hills',
            phone: '+1 555-0128',
            email: 'friends@ecofriends.org'
        }
    },
    {
        id: '7',
        name: 'Cultural Exchange',
        members: 8,
        verified: true,
        tags: ['Culture'],
        image: require('../assets/images/icon_support_community.png'),
        description: 'Celebrating cultural diversity. Share your traditions, food, and language with others who are eager to learn and appreciate different cultures.',
        activeMembers: 6,
        meetingsPerWeek: 1,
        contact: {
            address: '404 Heritage Rd, Culture Bay',
            phone: '+1 555-0129',
            email: 'hello@culturalx.org'
        }
    },
];

export const CHAT_LIST = [
    {
        id: '1',
        name: 'Circle 1',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80', // Group avatar placeholder
        lastMessage: 'James: Thanks everyone for the great session!',
        time: '9:41am',
        unread: 0,
        isGroup: true,
    },
    {
        id: '2',
        name: 'Sarah',
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'I\'ll talk to you in a bit',
        time: '9:41am',
        unread: 0,
        isOnline: true,
        verified: true, // Assuming the tick matches verified logic
    },
    {
        id: '3',
        name: 'James',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'I had some challenges with my project yest...',
        time: '9:40 am',
        unread: 2,
        isOnline: true,
    },
    {
        id: '4',
        name: 'Emily',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'I\'m looking forward to the group activities',
        time: '8:45 am',
        unread: 0,
        isOnline: false,
    },
    {
        id: '5',
        name: 'Oliver',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'You think you might have time for a chat later',
        time: '8:40 am',
        unread: 3,
        isOnline: true,
    },
    {
        id: '6',
        name: 'Harry',
        avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'This platform has literally transformed my li...',
        time: '8:40 am',
        unread: 1,
        isOnline: true,
    },
    {
        id: '7',
        name: 'Jack',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'Feels good to have someone to talk to',
        time: '7:45 am',
        unread: 0,
        isOnline: false,
    },
    {
        id: '8',
        name: 'George',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        lastMessage: 'Good morning',
        time: '7:40 am',
        unread: 0,
        isOnline: false,
    },
];

export const CHAT_MESSAGES = {
    '1': [ // Circle 1
        { id: '1', text: 'Hey everyone, are we still on for the meetup?', time: '9:30am', isMe: false, sender: 'Sarah' },
        { id: '2', text: 'Yes, looking forward to it!', time: '9:32am', isMe: true },
        { id: '3', text: 'Me too!', time: '9:35am', isMe: false, sender: 'Emily' },
        { id: '4', text: 'Thanks everyone for the great session!', time: '9:41am', isMe: false, sender: 'James' },
    ],
    '2': [ // Sarah
        { id: '1', text: 'Hi! I\'m Sarah', time: '12:50pm', isMe: true },
        { id: '2', text: 'Hey there! It\'s nice to meet you', time: '12:50pm', isMe: false },
        { id: '3', text: 'Loved your presentation on the circle huddle yesterday!', time: '12:52pm', isMe: true },
        { id: '4', text: 'It was a team effort! Glad you enjoyed it.', time: '12:53pm', isMe: false },
    ],
    // Default messages for others
    'default': [
        { id: '1', text: 'Hello!', time: '9:00am', isMe: false },
        { id: '2', text: 'Hi, how are you?', time: '9:05am', isMe: true },
    ]
};

export const HUDDLE_PARTICIPANTS = [
    { id: '1', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
    { id: '2', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
    { id: '3', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
    { id: '4', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
    { id: '5', image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
];

export const PROFILE_DATA = {
    user: {
        name: 'Jane',
        email: 'janedoe@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80',
        role: 'Personal user'
    },
    circles: [
        {
            id: '1',
            name: 'Circle 1',
            score: 57.5,
            members: 5,
            activity: 'High',
            membersAvatars: [
                { name: 'Ade', image: 'https://i.pravatar.cc/150?u=Ade' },
                { name: 'Mary', image: 'https://i.pravatar.cc/150?u=Mary' },
                { name: 'Chioma', image: 'https://i.pravatar.cc/150?u=Chioma' },
                { name: 'Jane', image: 'https://i.pravatar.cc/150?u=Jane' },
                { name: 'Mike', image: 'https://i.pravatar.cc/150?u=Mike' }
            ]
        },
        {
            id: '2',
            name: 'Circle 2',
            score: 65,
            members: 5,
            activity: 'High',
            membersAvatars: [
                { name: 'Ameer', image: 'https://i.pravatar.cc/150?u=Ameer' },
                { name: 'Jason', image: 'https://i.pravatar.cc/150?u=Jason' },
                { name: 'Halima', image: 'https://i.pravatar.cc/150?u=Halima' },
                { name: 'Jane', image: 'https://i.pravatar.cc/150?u=Jane' },
                { name: 'Prince', image: 'https://i.pravatar.cc/150?u=Prince' }
            ]
        }
    ],
    learningSessions: [
        { id: '1', title: 'Workplace relationships and interactions 1', progress: 0.7 },
        { id: '2', title: 'Workplace relationships and interactions 2', progress: 0.5 },
    ],
    completedLearningSessions: [
        { id: '3', title: 'Workplace relationships and interactions 2', grade: 96 },
        { id: '4', title: 'Workplace relationships and interactions 2', grade: 96 },
        { id: '5', title: 'Workplace relationships and interactions 2', grade: 96 },
    ],
    campaigns: [
        {
            id: '1',
            title: 'Health Management',
            date: '20 Jan, 2024',
            time: '04:00pm',
            image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        {
            id: '2',
            title: 'Stress awareness',
            date: '24 Jan, 2024',
            time: '02:00pm',
            image: 'https://images.unsplash.com/photo-1544367563-121542f83149?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        }
    ],
    completedCampaigns: [
        {
            id: '3',
            title: 'Health Management',
            completedDate: '21 Jan, 2024',
            image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        {
            id: '4',
            title: 'Stress awareness',
            completedDate: '26 Jan, 2024',
            image: 'https://images.unsplash.com/photo-1544367563-121542f83149?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        }
    ]
};
