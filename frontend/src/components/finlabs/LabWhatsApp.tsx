import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { FONT } from '@/src/ui/theme';
import { FL_GREEN, FL_YELLOW, FL_BG } from '@/src/finlabs/storage';

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  isPlayer?: boolean;
  time?: string;
};

export type ChatMember = {
  id: string;
  name: string;
  avatar: string;
  color: string;
};

type Props = {
  title: string;
  subtitle?: string;
  members: ChatMember[];
  messages: ChatMessage[];
  typing?: { name: string; avatar: string } | null;
  onBack?: () => void;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  overlay?: React.ReactNode;
  style?: ViewStyle;
};

export function LabWhatsAppChat({
  title,
  subtitle,
  members,
  messages,
  typing,
  onBack,
  headerExtra,
  footer,
  overlay,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const hasBottomPanel = !!(overlay || footer);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages.length, typing, overlay, footer]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backText}>◀</Text>
          </Pressable>
        ) : null}
        <View style={styles.avatarStack}>
          {members.slice(0, 3).map((m, i) => (
            <View
              key={m.id}
              style={[
                styles.headerAvatar,
                { backgroundColor: m.color, marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
              ]}
            >
              <Text style={styles.headerAvatarEmoji}>{m.avatar}</Text>
            </View>
          ))}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle ?? members.map((m) => m.name).join(', ')}
          </Text>
        </View>
      </View>

      {headerExtra ? <View style={styles.headerExtraBar}>{headerExtra}</View> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={[
            styles.chatContent,
            hasBottomPanel && styles.chatContentWithPanel,
          ]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>TODAY</Text>
          </View>

          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              entering={FadeInDown.duration(220)}
              style={[styles.msgRow, msg.isPlayer && styles.msgRowPlayer]}
            >
              {!msg.isPlayer ? (
                <View style={[styles.msgAvatar, { backgroundColor: memberColor(members, msg.senderId) }]}>
                  <Text style={styles.msgAvatarEmoji}>{msg.avatar}</Text>
                </View>
              ) : (
                <View style={styles.msgAvatarSpacer} />
              )}
              <View style={styles.msgBody}>
                {!msg.isPlayer ? (
                  <Text style={styles.msgSender}>{msg.senderName}</Text>
                ) : null}
                <View style={[styles.bubble, msg.isPlayer ? styles.bubblePlayer : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, msg.isPlayer && styles.bubbleTextPlayer]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.bubbleTime, msg.isPlayer && styles.bubbleTimePlayer]}>
                    {msg.time ?? 'now'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}

          {typing ? (
            <Animated.View entering={FadeIn} style={styles.msgRow}>
              <View style={[styles.msgAvatar, { backgroundColor: '#333' }]}>
                <Text style={styles.msgAvatarEmoji}>{typing.avatar}</Text>
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingName}>{typing.name} is typing</Text>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { opacity: 0.3 }]} />
                </View>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>

        {hasBottomPanel ? (
          <View style={styles.bottomPanel}>
            {overlay ? (
              <ScrollView
                style={styles.overlayPanel}
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {overlay}
              </ScrollView>
            ) : null}
            {footer ? (
              <ScrollView
                style={styles.footerScroll}
                contentContainerStyle={[
                  styles.footerContent,
                  overlay ? styles.footerContentAfterOverlay : null,
                ]}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {footer}
              </ScrollView>
            ) : null}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function memberColor(members: ChatMember[], id: string) {
  return members.find((m) => m.id === id)?.color ?? '#333';
}

/** Quick-reply chips styled like WhatsApp message drafts */
export function ChatQuickReplies({
  options,
}: {
  options: { label: string; onPress: () => void; color?: string }[];
}) {
  return (
    <View style={styles.quickReplies}>
      {options.map((opt) => (
        <Pressable
          key={opt.label}
          onPress={opt.onPress}
          style={({ pressed }) => [
            styles.quickReply,
            opt.color ? { borderColor: opt.color } : null,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={[styles.quickReplyText, opt.color ? { color: opt.color } : null]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Compact stat strip for chat screens */
export function ChatStatStrip({
  wallet,
  social,
  mood,
}: {
  wallet?: number;
  social?: number;
  mood?: number;
}) {
  return (
    <View style={styles.statStrip}>
      {wallet !== undefined ? (
        <Text style={styles.statItem}>💰 ₹{Math.round(wallet)}</Text>
      ) : null}
      {social !== undefined ? (
        <Text style={styles.statItem}>👥 {Math.round(social)}</Text>
      ) : null}
      {mood !== undefined ? (
        <Text style={styles.statItem}>😊 {Math.round(mood)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0a1a12',
    borderBottomWidth: 3,
    borderBottomColor: FL_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerExtraBar: {
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 2,
    borderBottomColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 12 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarEmoji: { fontSize: 18 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: FONT.body, color: '#fff', fontSize: 20, lineHeight: 22 },
  headerSub: { fontFamily: FONT.body, color: FL_GREEN, fontSize: 15, marginTop: 2 },
  chatScroll: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 16, flexGrow: 1 },
  chatContentWithPanel: { paddingBottom: 8 },
  datePill: {
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  datePillText: { fontFamily: FONT.display, color: '#666', fontSize: 7, letterSpacing: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowPlayer: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  msgAvatarSpacer: { width: 38 },
  msgAvatarEmoji: { fontSize: 16 },
  msgBody: { maxWidth: '78%', flexShrink: 1 },
  msgSender: {
    fontFamily: FONT.body,
    color: FL_GREEN,
    fontSize: 14,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#141414',
    borderLeftWidth: 4,
    borderLeftColor: FL_GREEN,
  },
  bubblePlayer: {
    backgroundColor: '#0a2a1a',
    borderColor: FL_GREEN,
  },
  bubbleText: {
    fontFamily: FONT.body,
    color: '#eee',
    fontSize: 18,
    lineHeight: 22,
  },
  bubbleTextPlayer: { color: '#fff' },
  bubbleTime: {
    fontFamily: FONT.display,
    color: '#555',
    fontSize: 6,
    textAlign: 'right',
    marginTop: 4,
  },
  bubbleTimePlayer: { color: '#4a8a6a' },
  typingBubble: {
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingName: { fontFamily: FONT.body, color: '#888', fontSize: 14, marginBottom: 4 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: {
    width: 6,
    height: 6,
    backgroundColor: FL_GREEN,
    borderRadius: 3,
  },
  bottomPanel: {
    borderTopWidth: 3,
    borderTopColor: FL_YELLOW,
    backgroundColor: FL_BG,
    maxHeight: '52%',
  },
  overlayPanel: { flexGrow: 0, flexShrink: 1 },
  overlayContent: { padding: 12, paddingBottom: 4 },
  footerScroll: { flexGrow: 0, flexShrink: 1, maxHeight: 220 },
  footerContent: { padding: 10 },
  footerContentAfterOverlay: { paddingTop: 0 },
  quickReplies: { gap: 8 },
  quickReply: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  quickReplyText: {
    fontFamily: FONT.body,
    color: FL_GREEN,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 22,
  },
  statStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  statItem: {
    fontFamily: FONT.body,
    color: FL_YELLOW,
    fontSize: 16,
  },
});
