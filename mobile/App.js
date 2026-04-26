import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isConfigured = Boolean(supabaseUrl && supabaseKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey) : null;

const demoProfiles = [
  {
    id: 'demo-1',
    name: 'Ava',
    age: 27,
    city: 'Detroit',
    bio: 'Golden-hour chaser, coffee person, and always down for a good playlist.',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'demo-2',
    name: 'Kai',
    age: 29,
    city: 'Southfield',
    bio: 'Ramen, design, and late-night city drives. Keep the vibe easy.',
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('swipe');
  const [profiles, setProfiles] = useState(demoProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 'm1', body: 'Hey 👋', mine: false },
    { id: 'm2', body: 'What city are you in?', mine: true },
  ]);
  const [profileForm, setProfileForm] = useState({ name: '', age: '', city: 'Detroit', bio: '' });
  const [image, setImage] = useState(null);

  const currentProfile = profiles[currentIndex];

  useEffect(() => {
    if (!isConfigured) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConfigured || !session?.user?.id) return;

    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name,age,city,bio,photo_url')
        .neq('id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data?.length) setProfiles(data);
    };

    loadProfiles();
  }, [session]);

  const signIn = async () => {
    if (!isConfigured) {
      setNotice('Add your Supabase mobile environment values before live login. Demo mode is still available.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    setNotice(error ? error.message : 'Check your email for the login link.');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const saveProfile = async () => {
    if (!profileForm.name || !profileForm.age || !profileForm.city) {
      setNotice('Name, age, and city are required.');
      return;
    }

    if (!isConfigured || !session?.user?.id) {
      setNotice('Profile saved in preview mode. Connect Supabase to save live.');
      return;
    }

    let photoUrl = null;

    if (image) {
      const response = await fetch(image);
      const blob = await response.blob();
      const filePath = `${session.user.id}/profile.jpg`;
      await supabase.storage.from('profile-photos').upload(filePath, blob, { upsert: true });
      const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name: profileForm.name,
      age: Number(profileForm.age),
      city: profileForm.city,
      bio: profileForm.bio,
      photo_url: photoUrl,
    });

    setNotice(error ? error.message : 'Profile saved. You are live.');
  };

  const likeProfile = () => {
    if (!currentProfile) return;
    setMatches((prev) => [currentProfile, ...prev]);
    setCurrentIndex((prev) => prev + 1);
  };

  const passProfile = () => setCurrentIndex((prev) => prev + 1);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { id: String(Date.now()), body: message.trim(), mine: true }]);
    setMessage('');
  };

  const headerTitle = useMemo(() => {
    if (activeTab === 'profile') return 'Profile';
    if (activeTab === 'chat') return 'Messages';
    return 'VibeMatch';
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>{headerTitle}</Text>
          <Text style={styles.subtle}>Casual city-based dating</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>Free</Text></View>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {!session && activeTab === 'profile' ? (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.bodyText}>Use email magic link login. No password drama.</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TouchableOpacity style={styles.primaryButton} onPress={signIn}><Text style={styles.primaryText}>Send login link</Text></TouchableOpacity>
        </View>
      ) : null}

      {activeTab === 'swipe' && (
        <View style={styles.screen}>
          {currentProfile ? (
            <View style={styles.swipeCard}>
              <Image source={{ uri: currentProfile.photo_url }} style={styles.profileImage} />
              <View style={styles.profileOverlay}>
                <Text style={styles.profileName}>{currentProfile.name}, {currentProfile.age}</Text>
                <Text style={styles.profileCity}>{currentProfile.city}</Text>
                <Text style={styles.profileBio}>{currentProfile.bio}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}><Text style={styles.cardTitle}>No more profiles nearby</Text><Text style={styles.bodyText}>Check another city soon.</Text></View>
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.passButton} onPress={passProfile}><Text style={styles.passText}>Pass</Text></TouchableOpacity>
            <TouchableOpacity style={styles.likeButton} onPress={likeProfile}><Text style={styles.likeText}>Like</Text></TouchableOpacity>
          </View>
          <View style={styles.adPreview}><Text style={styles.adSmall}>Future local ad</Text><Text style={styles.adText}>Detroit date-night sponsor</Text></View>
        </View>
      )}

      {activeTab === 'profile' && (
        <ScrollView style={styles.screen}>
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Create your profile</Text>
            <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
              {image ? <Image source={{ uri: image }} style={styles.photoPreview} /> : <Text style={styles.bodyText}>Tap to choose profile photo</Text>}
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Name" value={profileForm.name} onChangeText={(text) => setProfileForm({ ...profileForm, name: text })} />
            <TextInput style={styles.input} placeholder="Age" value={profileForm.age} onChangeText={(text) => setProfileForm({ ...profileForm, age: text })} keyboardType="number-pad" />
            <TextInput style={styles.input} placeholder="City" value={profileForm.city} onChangeText={(text) => setProfileForm({ ...profileForm, city: text })} />
            <TextInput style={[styles.input, styles.bioInput]} placeholder="Short bio" value={profileForm.bio} onChangeText={(text) => setProfileForm({ ...profileForm, bio: text })} multiline />
            <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}><Text style={styles.primaryText}>Save profile</Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === 'chat' && (
        <View style={styles.screen}>
          <View style={styles.matchStrip}>
            {matches.length === 0 ? <Text style={styles.bodyText}>Matches will show here.</Text> : matches.map((match) => <View key={match.id} style={styles.matchBubble}><Text style={styles.matchInitial}>{match.name[0]}</Text></View>)}
          </View>
          <ScrollView style={styles.chatBox}>
            {messages.map((item) => (
              <View key={item.id} style={item.mine ? styles.myBubble : styles.theirBubble}><Text style={item.mine ? styles.myText : styles.theirText}>{item.body}</Text></View>
            ))}
          </ScrollView>
          <View style={styles.messageRow}>
            <TextInput style={styles.messageInput} placeholder="Type a message" value={message} onChangeText={setMessage} />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}><Text style={styles.primaryText}>Send</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.nav}>
        {['swipe', 'chat', 'profile'].map((tab) => (
          <TouchableOpacity key={tab} style={activeTab === tab ? styles.navItemActive : styles.navItem} onPress={() => setActiveTab(tab)}>
            <Text style={activeTab === tab ? styles.navTextActive : styles.navText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff5f7' },
  header: { padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 30, fontWeight: '800', color: '#111827' },
  subtle: { color: '#64748b', marginTop: 2 },
  badge: { backgroundColor: '#ffe4e6', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  badgeText: { color: '#be123c', fontWeight: '800' },
  notice: { marginHorizontal: 22, marginBottom: 8, color: '#be123c', fontWeight: '700' },
  screen: { flex: 1, paddingHorizontal: 18 },
  authCard: { margin: 18, backgroundColor: 'white', padding: 20, borderRadius: 24, gap: 12 },
  swipeCard: { flex: 1, borderRadius: 34, overflow: 'hidden', backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, elevation: 8 },
  profileImage: { width: '100%', height: '100%' },
  profileOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, backgroundColor: 'rgba(0,0,0,0.42)' },
  profileName: { color: 'white', fontSize: 32, fontWeight: '900' },
  profileCity: { color: '#fecdd3', fontSize: 16, fontWeight: '800', marginTop: 2 },
  profileBio: { color: 'white', marginTop: 10, lineHeight: 21 },
  emptyCard: { flex: 1, backgroundColor: 'white', borderRadius: 34, alignItems: 'center', justifyContent: 'center', padding: 30 },
  actionRow: { flexDirection: 'row', gap: 14, paddingVertical: 18 },
  passButton: { flex: 1, backgroundColor: 'white', borderRadius: 999, padding: 17, alignItems: 'center' },
  likeButton: { flex: 1, backgroundColor: '#e11d48', borderRadius: 999, padding: 17, alignItems: 'center' },
  passText: { color: '#111827', fontWeight: '900', fontSize: 16 },
  likeText: { color: 'white', fontWeight: '900', fontSize: 16 },
  adPreview: { backgroundColor: '#111827', padding: 16, borderRadius: 20, marginBottom: 12 },
  adSmall: { color: '#fb7185', fontWeight: '800', textTransform: 'uppercase', fontSize: 11 },
  adText: { color: 'white', fontWeight: '800', marginTop: 2 },
  formCard: { backgroundColor: 'white', padding: 20, borderRadius: 28, gap: 12, marginBottom: 20 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  bodyText: { color: '#64748b', lineHeight: 20 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, fontSize: 16 },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  photoPicker: { height: 180, backgroundColor: '#f8fafc', borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  primaryButton: { backgroundColor: '#e11d48', borderRadius: 999, padding: 16, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '900' },
  matchStrip: { minHeight: 74, backgroundColor: 'white', borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchBubble: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center' },
  matchInitial: { color: '#be123c', fontWeight: '900', fontSize: 20 },
  chatBox: { flex: 1, marginTop: 12 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#e11d48', padding: 12, borderRadius: 18, marginBottom: 8, maxWidth: '78%' },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: 'white', padding: 12, borderRadius: 18, marginBottom: 8, maxWidth: '78%' },
  myText: { color: 'white', fontWeight: '700' },
  theirText: { color: '#111827', fontWeight: '700' },
  messageRow: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  messageInput: { flex: 1, backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 16 },
  sendButton: { backgroundColor: '#e11d48', borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center' },
  nav: { flexDirection: 'row', backgroundColor: 'white', padding: 12, gap: 10 },
  navItem: { flex: 1, padding: 12, borderRadius: 999, alignItems: 'center', backgroundColor: '#f8fafc' },
  navItemActive: { flex: 1, padding: 12, borderRadius: 999, alignItems: 'center', backgroundColor: '#111827' },
  navText: { color: '#64748b', fontWeight: '800', textTransform: 'capitalize' },
  navTextActive: { color: 'white', fontWeight: '900', textTransform: 'capitalize' },
});
