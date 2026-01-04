import { createClient } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  channel: string;
  content: string;
  created_at: string;
  username: string | null;
};

const MAX_MESSAGE_LENGTH = 280;
const PROFANITY_LIST = ["slur1", "slur2", "slur3"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const validateMessage = (content: string) => {
  if (!content.trim()) {
    return "Message cannot be empty.";
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return `Keep it under ${MAX_MESSAGE_LENGTH} characters.`;
  }

  const lowered = content.toLowerCase();
  const hasProfanity = PROFANITY_LIST.some((term) => lowered.includes(term));
  if (hasProfanity) {
    return "Message contains blocked language.";
  }

  return null;
};

export const fetchMessages = async (channel: string) => {
  if (!supabaseClient) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabaseClient
    .from("messages")
    .select("id, channel, content, created_at, username")
    .eq("channel", channel)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatMessage[];
};

export const sendMessage = async (payload: {
  channel: string;
  content: string;
  username?: string | null;
}) => {
  if (!supabaseClient) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabaseClient
    .from("messages")
    .insert({
      channel: payload.channel,
      content: payload.content,
      username: payload.username ?? null,
    })
    .select("id, channel, content, created_at, username")
    .single();

  if (error) {
    throw error;
  }

  return data as ChatMessage;
};

export const subscribeToMessages = (
  channel: string,
  onMessage: (message: ChatMessage) => void
) => {
  if (!supabaseClient) {
    throw new Error("Supabase client is not configured.");
  }

  const subscription = supabaseClient
    .channel(`messages:${channel}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `channel=eq.${channel}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabaseClient.removeChannel(subscription);
  };
};

export const getMessageCharacterLimit = () => MAX_MESSAGE_LENGTH;
