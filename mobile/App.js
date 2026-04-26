import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Image, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOtp({ email });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!image || !session) return;
    const response = await fetch(image);
    const blob = await response.blob();
    const filePath = `${session.user.id}/profile.jpg`;

    await supabase.storage.from('profile-photos').upload(filePath, blob, { upsert: true });

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);

    await supabase.from('profiles').upsert({ id: session.user.id, photo_url: data.publicUrl });
  };

  if (!session) {
    return (
      <View style={{ padding: 40 }}>
        <Text>Login</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
        <Button title="Login" onPress={signIn} />
      </View>
    );
  }

  return (
    <View style={{ padding: 40 }}>
      <Text>VibeMatch Mobile</Text>
      <Button title="Pick Photo" onPress={pickImage} />
      <Button title="Upload Photo" onPress={uploadImage} />
      {image && <Image source={{ uri: image }} style={{ width: 100, height: 100 }} />}
    </View>
  );
}
