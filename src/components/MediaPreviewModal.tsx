import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  PanResponder,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CapturedMedia } from '../types/camera';
import { Colors } from '../constants/colors';
import { saveMediaToDevice } from '../utils/mediaSaver';
import { triggerShutterPressHaptic } from '../utils/haptics';

interface MediaPreviewModalProps {
  media: CapturedMedia | null;
  visible: boolean;
  onClose: () => void;
}

type VoiceEffectId =
  | 'normal'
  | 'chipmunk'
  | 'deep'
  | 'robot'
  | 'alien'
  | 'megaphone';

interface VoicePreset {
  id: VoiceEffectId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  pitchSemitones: number;
  rateMultiplier: number;
  color: string;
}

const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'normal',
    label: 'Original',
    icon: 'mic-outline',
    pitchSemitones: 0,
    rateMultiplier: 1.0,
    color: '#ffffff',
  },
  {
    id: 'chipmunk',
    label: 'Chipmunk',
    icon: 'happy-outline',
    pitchSemitones: 7,
    rateMultiplier: 1.38,
    color: '#facc15',
  },
  {
    id: 'deep',
    label: 'Deep Giant',
    icon: 'skull-outline',
    pitchSemitones: -6,
    rateMultiplier: 0.74,
    color: '#ef4444',
  },
  {
    id: 'robot',
    label: 'Robot',
    icon: 'hardware-chip-outline',
    pitchSemitones: -2,
    rateMultiplier: 0.95,
    color: '#38bdf8',
  },
  {
    id: 'alien',
    label: 'Alien Echo',
    icon: 'planet-outline',
    pitchSemitones: 5,
    rateMultiplier: 1.22,
    color: '#4ade80',
  },
  {
    id: 'megaphone',
    label: 'Megaphone',
    icon: 'megaphone-outline',
    pitchSemitones: 1,
    rateMultiplier: 1.05,
    color: '#fb923c',
  },
];

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x', desc: 'Slow-Mo' },
  { value: 0.75, label: '0.75x', desc: 'Chill' },
  { value: 1.0, label: '1x', desc: 'Normal' },
  { value: 1.5, label: '1.5x', desc: 'Fast' },
  { value: 2.0, label: '2x', desc: 'Hyper' },
];

type ColorFilterId = 'none' | 'vivid' | 'neon' | 'gold' | 'retro' | 'noir';

interface ColorFilterOption {
  id: ColorFilterId;
  label: string;
  overlayColor: string;
  cssFilter: string;
}

const COLOR_FILTERS: ColorFilterOption[] = [
  { id: 'none', label: 'Normal', overlayColor: 'transparent', cssFilter: 'none' },
  {
    id: 'vivid',
    label: 'Vivid Pop',
    overlayColor: 'rgba(244, 63, 94, 0.08)',
    cssFilter: 'saturate(1.45) contrast(1.1)',
  },
  {
    id: 'neon',
    label: 'Cyber Neon',
    overlayColor: 'rgba(139, 92, 246, 0.16)',
    cssFilter: 'hue-rotate(18deg) saturate(1.6) contrast(1.15)',
  },
  {
    id: 'gold',
    label: 'Warm Gold',
    overlayColor: 'rgba(250, 204, 21, 0.14)',
    cssFilter: 'sepia(0.28) saturate(1.35) brightness(1.05)',
  },
  {
    id: 'retro',
    label: 'VHS 90s',
    overlayColor: 'rgba(56, 189, 248, 0.12)',
    cssFilter: 'contrast(1.2) sepia(0.18) saturate(0.88)',
  },
  {
    id: 'noir',
    label: 'Noir B&W',
    overlayColor: 'rgba(0, 0, 0, 0.22)',
    cssFilter: 'grayscale(1) contrast(1.25)',
  },
];

type TextStyleVariant = 'pill' | 'neon' | 'banner' | 'outline';

interface VideoCaption {
  id: string;
  text: string;
  color: string;
  styleVariant: TextStyleVariant;
  x: number; // relative offset in px
  y: number; // relative offset in px
}

const TEXT_COLORS = [
  '#ffffff',
  '#facc15',
  '#ef4444',
  '#ec4899',
  '#38bdf8',
  '#4ade80',
  '#a855f7',
  '#fb923c',
];

const DraggableCaptionItem: React.FC<{
  caption: VideoCaption;
  onEdit: (caption: VideoCaption) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
}> = ({ caption, onEdit, onDelete, onMove }) => {
  const startPosRef = useRef({ x: caption.x, y: caption.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        startPosRef.current = { x: caption.x, y: caption.y };
      },
      onPanResponderMove: (_, g) => {
        onMove(
          caption.id,
          startPosRef.current.x + g.dx,
          startPosRef.current.y + g.dy
        );
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          onEdit(caption);
        }
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.draggableCaption,
        {
          transform: [{ translateX: caption.x }, { translateY: caption.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.captionBox,
          caption.styleVariant === 'pill' && styles.captionPill,
          caption.styleVariant === 'banner' && {
            backgroundColor: caption.color,
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 10,
          },
          caption.styleVariant === 'neon' && {
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderColor: caption.color,
            borderWidth: 1.5,
          },
        ]}
      >
        <Text
          style={[
            styles.captionText,
            {
              color:
                caption.styleVariant === 'banner' &&
                (caption.color === '#ffffff' || caption.color === '#facc15')
                  ? '#09090b'
                  : caption.styleVariant === 'banner'
                  ? '#ffffff'
                  : caption.color,
            },
            caption.styleVariant === 'neon' && {
              textShadowColor: caption.color,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            },
            caption.styleVariant === 'outline' && {
              textShadowColor: '#000000',
              textShadowOffset: { width: 1.5, height: 1.5 },
              textShadowRadius: 2,
            },
          ]}
        >
          {caption.text}
        </Text>
      </View>

      {/* Mini Delete Button on Caption Corner */}
      <TouchableOpacity
        style={styles.captionDeleteBtn}
        onPress={() => onDelete(caption.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  media,
  visible,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Studio Active Panel ('none' | 'text' | 'voice' | 'speed' | 'filter')
  const [activeTool, setActiveTool] = useState<
    'none' | 'text' | 'voice' | 'speed' | 'filter'
  >('none');

  // Video Speed & Pitch / Voice Changer State
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [voiceEffect, setVoiceEffect] = useState<VoiceEffectId>('normal');
  const [customPitchSemitones, setCustomPitchSemitones] = useState<number>(0);
  const [colorFilter, setColorFilter] = useState<ColorFilterId>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Text Overlays State
  const [captions, setCaptions] = useState<VideoCaption[]>([]);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [draftColor, setDraftColor] = useState<string>('#ffffff');
  const [draftVariant, setDraftVariant] = useState<TextStyleVariant>('pill');

  // Web HTML5 Video + WebAudio API DSP refs
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<any>(null);
  const sourceNodeRef = useRef<any>(null);
  const filterNodeRef = useRef<any>(null);
  const delayNodeRef = useRef<any>(null);
  const feedbackGainRef = useRef<any>(null);

  // Reset editor state when new media arrives
  useEffect(() => {
    if (visible && media) {
      setPlaybackSpeed(1.0);
      setVoiceEffect('normal');
      setCustomPitchSemitones(0);
      setColorFilter('none');
      setCaptions([]);
      setActiveTool('none');
      setExportSuccess(null);
      setIsMuted(false);
    }
  }, [visible, media]);

  // Apply real-time playback speed, pitch shift, and WebAudio Voice Changer DSP on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const video = webVideoRef.current;
    if (!video) return;

    const preset =
      VOICE_PRESETS.find((p) => p.id === voiceEffect) || VOICE_PRESETS[0];
    const totalPitchSemitones = preset.pitchSemitones + customPitchSemitones;
    const pitchFactor = Math.pow(2, totalPitchSemitones / 12);

    // Combine user speed and pitch shift factor
    const effectiveRate = Math.max(
      0.35,
      Math.min(3.0, playbackSpeed * ( totalPitchSemitones !== 0 ? pitchFactor : 1.0 ))
    );

    // Disable pitch preservation when shifting voice pitch so the voice pitch actually shifts!
    const shouldShiftPitch = totalPitchSemitones !== 0 || voiceEffect !== 'normal';
    try {
      (video as any).preservesPitch = !shouldShiftPitch;
      (video as any).mozPreservesPitch = !shouldShiftPitch;
      (video as any).webkitPreservesPitch = !shouldShiftPitch;
    } catch {
      // Ignore browser vendor prefix differences
    }

    video.playbackRate = effectiveRate;
    video.muted = isMuted;

    // Configure Web Audio API DSP graph for Robot, Alien Echo, Deep Bass, Chipmunk, Megaphone
    try {
      const AudioContextCtor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor && !audioCtxRef.current) {
        const ctx = new AudioContextCtor();
        const source = ctx.createMediaElementSource(video);
        const biquad = ctx.createBiquadFilter();
        const delay = ctx.createDelay(1.0);
        const feedback = ctx.createGain();

        source.connect(biquad);
        biquad.connect(ctx.destination);

        // Echo feedback loop branch
        biquad.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(ctx.destination);

        audioCtxRef.current = ctx;
        sourceNodeRef.current = source;
        filterNodeRef.current = biquad;
        delayNodeRef.current = delay;
        feedbackGainRef.current = feedback;
      }

      if (audioCtxRef.current && filterNodeRef.current && feedbackGainRef.current) {
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const biquad = filterNodeRef.current;
        const delay = delayNodeRef.current;
        const feedback = feedbackGainRef.current;

        if (voiceEffect === 'chipmunk') {
          biquad.type = 'highshelf';
          biquad.frequency.value = 1600;
          biquad.gain.value = 8;
          delay.delayTime.value = 0;
          feedback.gain.value = 0;
        } else if (voiceEffect === 'deep') {
          biquad.type = 'lowshelf';
          biquad.frequency.value = 280;
          biquad.gain.value = 12;
          delay.delayTime.value = 0.025;
          feedback.gain.value = 0.22;
        } else if (voiceEffect === 'robot') {
          biquad.type = 'peaking';
          biquad.frequency.value = 750;
          biquad.Q.value = 6;
          biquad.gain.value = 14;
          delay.delayTime.value = 0.018;
          feedback.gain.value = 0.52;
        } else if (voiceEffect === 'alien') {
          biquad.type = 'bandpass';
          biquad.frequency.value = 1100;
          biquad.Q.value = 1.8;
          delay.delayTime.value = 0.14;
          feedback.gain.value = 0.48;
        } else if (voiceEffect === 'megaphone') {
          biquad.type = 'bandpass';
          biquad.frequency.value = 1450;
          biquad.Q.value = 3.2;
          delay.delayTime.value = 0;
          feedback.gain.value = 0;
        } else {
          biquad.type = 'allpass';
          biquad.frequency.value = 1000;
          delay.delayTime.value = 0;
          feedback.gain.value = 0;
        }
      }
    } catch {
      // Fallback gracefully if MediaElementSource already attached
    }
  }, [
    visible,
    playbackSpeed,
    voiceEffect,
    customPitchSemitones,
    isMuted,
  ]);

  const handleOpenTextEditor = (existing?: VideoCaption) => {
    triggerShutterPressHaptic();
    if (existing) {
      setEditingCaptionId(existing.id);
      setDraftText(existing.text);
      setDraftColor(existing.color);
      setDraftVariant(existing.styleVariant);
    } else {
      setEditingCaptionId(null);
      setDraftText('');
      setDraftColor('#ffffff');
      setDraftVariant('pill');
    }
    setActiveTool('text');
  };

  const handleCommitText = () => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      setActiveTool('none');
      return;
    }
    if (editingCaptionId) {
      setCaptions((prev) =>
        prev.map((c) =>
          c.id === editingCaptionId
            ? {
                ...c,
                text: trimmed,
                color: draftColor,
                styleVariant: draftVariant,
              }
            : c
        )
      );
    } else {
      setCaptions((prev) => [
        ...prev,
        {
          id: `cap_${Date.now()}`,
          text: trimmed,
          color: draftColor,
          styleVariant: draftVariant,
          x: 0,
          y: (prev.length % 3) * 44 - 30,
        },
      ]);
    }
    setDraftText('');
    setEditingCaptionId(null);
    setActiveTool('none');
  };

  const handleMoveCaption = useCallback((id: string, x: number, y: number) => {
    setCaptions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  }, []);

  const handleDeleteCaption = useCallback((id: string) => {
    triggerShutterPressHaptic();
    setCaptions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Export & Save to Gallery (Top-Right Export Button)
  const handleExportAndSave = async () => {
    if (!media || isExporting) return;
    triggerShutterPressHaptic();
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const res = await saveMediaToDevice(media);
      setIsExporting(false);
      if (res.success) {
        setExportSuccess('Exported to Gallery!');
        setTimeout(() => setExportSuccess(null), 3500);
      } else {
        Alert.alert('Export Notice', res.message);
      }
    } catch {
      setIsExporting(false);
      Alert.alert('Export Error', 'Could not export video to gallery.');
    }
  };

  if (!media) return null;

  const activeFilterObj =
    COLOR_FILTERS.find((f) => f.id === colorFilter) || COLOR_FILTERS[0];
  const activeVoiceObj =
    VOICE_PRESETS.find((v) => v.id === voiceEffect) || VOICE_PRESETS[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.desktopFrame}>
          {/* TOP STUDIO BAR WITH PROMINENT EXPORT BUTTON */}
          <View style={styles.topHeader}>
            {/* Left: Discard / Back to Camera */}
            <TouchableOpacity
              style={styles.discardBtn}
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityLabel="Discard and return to camera"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
              <Text style={styles.discardText}>Retake</Text>
            </TouchableOpacity>

            {/* Center: Active Edits Summary Pill */}
            <View style={styles.statusSummaryPill}>
              <Text style={styles.statusSummaryText} numberOfLines={1}>
                {media.lensName || 'Natural'} • {playbackSpeed}x
                {voiceEffect !== 'normal' || customPitchSemitones !== 0
                  ? ` • ${activeVoiceObj.label}`
                  : ''}
              </Text>
            </View>

            {/* Right: Top EXPORT & Save to Gallery CTA Button */}
            <TouchableOpacity
              style={[
                styles.exportTopBtn,
                exportSuccess ? styles.exportTopBtnSuccess : null,
              ]}
              onPress={handleExportAndSave}
              disabled={isExporting}
              activeOpacity={0.85}
              accessibilityLabel="Export edited video and save to gallery"
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Ionicons
                    name={
                      exportSuccess ? 'checkmark-circle' : 'download-outline'
                    }
                    size={18}
                    color="#09090b"
                  />
                  <Text style={styles.exportTopBtnText}>
                    {exportSuccess ? 'Saved!' : 'Export'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* FULL-SCREEN VIDEO STUDIO VIEWPORT */}
          <View style={styles.videoViewport}>
            {media.type === 'photo' ? (
              <Image
                source={{ uri: media.uri }}
                style={styles.fullMedia}
                resizeMode="cover"
              />
            ) : Platform.OS === 'web' ? (
              <video
                ref={webVideoRef}
                src={media.uri}
                autoPlay
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: activeFilterObj.cssFilter,
                }}
              />
            ) : (
              <View style={styles.nativeVideoPreviewStage}>
                <View style={styles.nativePreviewPulseCircle}>
                  <Ionicons
                    name="play-circle"
                    size={68}
                    color={Colors.accentYellow}
                  />
                </View>
                <Text style={styles.nativePreviewTitle}>
                  {media.lensName || 'XayLens'} Video Ready
                </Text>
                <Text style={styles.nativePreviewSub}>
                  Speed: {playbackSpeed}x • Voice: {activeVoiceObj.label}
                  {customPitchSemitones !== 0
                    ? ` (${customPitchSemitones > 0 ? '+' : ''}${customPitchSemitones}st)`
                    : ''}
                </Text>
              </View>
            )}

            {/* Color Grade Filter Tint Overlay */}
            {activeFilterObj.overlayColor !== 'transparent' && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: activeFilterObj.overlayColor, pointerEvents: 'none' },
                ]}
              />
            )}

            {/* DRAGGABLE TEXT CAPTIONS ON VIDEO */}
            <View style={[styles.captionsStage, { pointerEvents: 'box-none' }]}>
              {captions.map((cap) => (
                <DraggableCaptionItem
                  key={cap.id}
                  caption={cap}
                  onEdit={handleOpenTextEditor}
                  onDelete={handleDeleteCaption}
                  onMove={handleMoveCaption}
                />
              ))}
            </View>

            {/* Exported Confirmation Toast Banner */}
            {exportSuccess && (
              <View style={styles.exportedBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#09090b" />
                <Text style={styles.exportedBannerText}>
                  {exportSuccess}
                </Text>
              </View>
            )}

            {/* RIGHT-SIDE FLOATING STUDIO TOOL DOCK (Text, Voice Pitch, Speed, Filter, Mute) */}
            <View style={styles.rightStudioDock}>
              {/* 1. Add Text Overlay (Aa) */}
              <TouchableOpacity
                style={[
                  styles.dockToolBtn,
                  activeTool === 'text' && styles.dockToolBtnActive,
                ]}
                onPress={() =>
                  activeTool === 'text'
                    ? setActiveTool('none')
                    : handleOpenTextEditor()
                }
                activeOpacity={0.8}
              >
                <Ionicons name="text" size={22} color={Colors.white} />
                <Text style={styles.dockToolLabel}>Text</Text>
              </TouchableOpacity>

              {/* 2. Smart Voice Changer & Pitch */}
              <TouchableOpacity
                style={[
                  styles.dockToolBtn,
                  (activeTool === 'voice' ||
                    voiceEffect !== 'normal' ||
                    customPitchSemitones !== 0) &&
                    styles.dockToolBtnActive,
                ]}
                onPress={() => {
                  triggerShutterPressHaptic();
                  setActiveTool(activeTool === 'voice' ? 'none' : 'voice');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="mic-outline"
                  size={22}
                  color={
                    voiceEffect !== 'normal' || customPitchSemitones !== 0
                      ? Colors.accentYellow
                      : Colors.white
                  }
                />
                <Text style={styles.dockToolLabel}>Voice</Text>
              </TouchableOpacity>

              {/* 3. Smart Playback Speed */}
              <TouchableOpacity
                style={[
                  styles.dockToolBtn,
                  (activeTool === 'speed' || playbackSpeed !== 1.0) &&
                    styles.dockToolBtnActive,
                ]}
                onPress={() => {
                  triggerShutterPressHaptic();
                  setActiveTool(activeTool === 'speed' ? 'none' : 'speed');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={22}
                  color={
                    playbackSpeed !== 1.0 ? Colors.accentCyan : Colors.white
                  }
                />
                <Text style={styles.dockToolLabel}>{playbackSpeed}x</Text>
              </TouchableOpacity>

              {/* 4. Color Vibe Filter */}
              <TouchableOpacity
                style={[
                  styles.dockToolBtn,
                  (activeTool === 'filter' || colorFilter !== 'none') &&
                    styles.dockToolBtnActive,
                ]}
                onPress={() => {
                  triggerShutterPressHaptic();
                  setActiveTool(activeTool === 'filter' ? 'none' : 'filter');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="color-wand-outline"
                  size={22}
                  color={
                    colorFilter !== 'none' ? '#ec4899' : Colors.white
                  }
                />
                <Text style={styles.dockToolLabel}>Vibe</Text>
              </TouchableOpacity>

              {/* 5. Audio Mute Toggle */}
              <TouchableOpacity
                style={styles.dockToolBtn}
                onPress={() => {
                  triggerShutterPressHaptic();
                  setIsMuted((m) => !m);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                  size={22}
                  color={isMuted ? '#ef4444' : Colors.white}
                />
                <Text style={styles.dockToolLabel}>
                  {isMuted ? 'Muted' : 'Sound'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* INTERACTIVE BOTTOM DRAWER FOR SELECTED STUDIO TOOL */}
            {activeTool !== 'none' && (
              <View style={styles.toolDrawer}>
                {/* A. TEXT OVERLAY COMPOSER */}
                {activeTool === 'text' && (
                  <View style={styles.drawerSection}>
                    <View style={styles.drawerHeaderRow}>
                      <Text style={styles.drawerTitle}>
                        {editingCaptionId ? 'Edit Text Overlay' : 'Add Text Overlay'}
                      </Text>
                      <TouchableOpacity
                        style={styles.doneSmallBtn}
                        onPress={handleCommitText}
                      >
                        <Text style={styles.doneSmallBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={styles.textInputBox}
                      placeholder="Type caption on video..."
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      value={draftText}
                      onChangeText={setDraftText}
                      autoFocus
                      maxLength={80}
                      returnKeyType="done"
                      onSubmitEditing={handleCommitText}
                    />

                    {/* Style Variant Picker */}
                    <View style={styles.variantRow}>
                      {(
                        [
                          { id: 'pill', label: 'Glass Pill' },
                          { id: 'banner', label: 'Bold Label' },
                          { id: 'neon', label: 'Neon Glow' },
                          { id: 'outline', label: 'Outline' },
                        ] as { id: TextStyleVariant; label: string }[]
                      ).map((v) => (
                        <TouchableOpacity
                          key={v.id}
                          style={[
                            styles.variantChip,
                            draftVariant === v.id && styles.variantChipActive,
                          ]}
                          onPress={() => setDraftVariant(v.id)}
                        >
                          <Text
                            style={[
                              styles.variantChipText,
                              draftVariant === v.id &&
                                styles.variantChipTextActive,
                            ]}
                          >
                            {v.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Color Swatches */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.colorSwatchesRow}
                    >
                      {TEXT_COLORS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: c },
                            draftColor === c && styles.colorSwatchActive,
                          ]}
                          onPress={() => setDraftColor(c)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* B. SMART VOICE CHANGER & PITCH SHIFTER */}
                {activeTool === 'voice' && (
                  <View style={styles.drawerSection}>
                    <View style={styles.drawerHeaderRow}>
                      <Text style={styles.drawerTitle}>
                        Smart Voice & Pitch Changer
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setVoiceEffect('normal');
                          setCustomPitchSemitones(0);
                        }}
                      >
                        <Text style={styles.resetLinkText}>Reset</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalPresetsRow}
                    >
                      {VOICE_PRESETS.map((preset) => {
                        const selected = voiceEffect === preset.id;
                        return (
                          <TouchableOpacity
                            key={preset.id}
                            style={[
                              styles.voiceChip,
                              selected && {
                                borderColor: preset.color,
                                backgroundColor: 'rgba(255,255,255,0.14)',
                              },
                            ]}
                            onPress={() => {
                              triggerShutterPressHaptic();
                              setVoiceEffect(preset.id);
                            }}
                          >
                            <Ionicons
                              name={preset.icon}
                              size={20}
                              color={selected ? preset.color : Colors.white}
                            />
                            <Text
                              style={[
                                styles.voiceChipLabel,
                                selected && { color: preset.color },
                              ]}
                            >
                              {preset.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Fine Pitch Semitone Control (-12 to +12) */}
                    <View style={styles.pitchControlBar}>
                      <Text style={styles.pitchLabel}>
                        Fine Pitch:{' '}
                        <Text style={{ color: Colors.accentYellow }}>
                          {customPitchSemitones > 0
                            ? `+${customPitchSemitones}`
                            : customPitchSemitones}{' '}
                          semitones
                        </Text>
                      </Text>
                      <View style={styles.pitchSteppers}>
                        <TouchableOpacity
                          style={styles.pitchStepBtn}
                          onPress={() =>
                            setCustomPitchSemitones((p) => Math.max(-12, p - 2))
                          }
                        >
                          <Ionicons name="remove" size={18} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.pitchStepBtn}
                          onPress={() => setCustomPitchSemitones(0)}
                        >
                          <Text style={styles.pitchZeroText}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.pitchStepBtn}
                          onPress={() =>
                            setCustomPitchSemitones((p) => Math.min(12, p + 2))
                          }
                        >
                          <Ionicons name="add" size={18} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* C. SMART PLAYBACK SPEED CONTROL */}
                {activeTool === 'speed' && (
                  <View style={styles.drawerSection}>
                    <View style={styles.drawerHeaderRow}>
                      <Text style={styles.drawerTitle}>Video Playback Speed</Text>
                      <TouchableOpacity onPress={() => setPlaybackSpeed(1.0)}>
                        <Text style={styles.resetLinkText}>1.0x Default</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.speedButtonsRow}>
                      {SPEED_OPTIONS.map((opt) => {
                        const selected = playbackSpeed === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.speedOptionBtn,
                              selected && styles.speedOptionBtnActive,
                            ]}
                            onPress={() => {
                              triggerShutterPressHaptic();
                              setPlaybackSpeed(opt.value);
                            }}
                          >
                            <Text
                              style={[
                                styles.speedOptionValue,
                                selected && styles.speedOptionValueActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <Text style={styles.speedOptionDesc}>
                              {opt.desc}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* D. VISUAL VIBE / COLOR GRADE FILTER */}
                {activeTool === 'filter' && (
                  <View style={styles.drawerSection}>
                    <View style={styles.drawerHeaderRow}>
                      <Text style={styles.drawerTitle}>Visual Vibe Filter</Text>
                      <TouchableOpacity onPress={() => setColorFilter('none')}>
                        <Text style={styles.resetLinkText}>Original</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalPresetsRow}
                    >
                      {COLOR_FILTERS.map((f) => {
                        const selected = colorFilter === f.id;
                        return (
                          <TouchableOpacity
                            key={f.id}
                            style={[
                              styles.voiceChip,
                              selected && {
                                borderColor: '#ec4899',
                                backgroundColor: 'rgba(236, 72, 153, 0.16)',
                              },
                            ]}
                            onPress={() => {
                              triggerShutterPressHaptic();
                              setColorFilter(f.id);
                            }}
                          >
                            <Ionicons
                              name="sparkles-outline"
                              size={18}
                              color={
                                selected ? '#ec4899' : Colors.white
                              }
                            />
                            <Text
                              style={[
                                styles.voiceChipLabel,
                                selected && { color: '#ec4899' },
                              ]}
                            >
                              {f.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  desktopFrame: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    height: '100%',
    backgroundColor: '#09090b',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#09090b',
    zIndex: 40,
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discardText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  statusSummaryPill: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
  },
  statusSummaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  exportTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentYellow,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
    shadowColor: Colors.accentYellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  exportTopBtnSuccess: {
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80',
  },
  exportTopBtnText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  videoViewport: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 10,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  nativeVideoPreviewStage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  nativePreviewPulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  nativePreviewTitle: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: '700',
  },
  nativePreviewSub: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    marginTop: 6,
  },
  captionsStage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  draggableCaption: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: 300,
  },
  captionPill: {
    backgroundColor: 'rgba(9, 9, 11, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  captionText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  captionDeleteBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#09090b',
    borderRadius: 10,
  },
  exportedBanner: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ade80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    zIndex: 45,
  },
  exportedBannerText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '800',
  },
  rightStudioDock: {
    position: 'absolute',
    right: 12,
    top: 24,
    backgroundColor: 'rgba(12, 12, 16, 0.65)',
    borderRadius: 26,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    gap: 12,
    zIndex: 30,
  },
  dockToolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dockToolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  dockToolLabel: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  toolDrawer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(12, 12, 16, 0.92)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    zIndex: 35,
  },
  drawerSection: {
    width: '100%',
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drawerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  resetLinkText: {
    color: Colors.accentYellow,
    fontSize: 12,
    fontWeight: '700',
  },
  doneSmallBtn: {
    backgroundColor: Colors.accentYellow,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  doneSmallBtnText: {
    color: '#09090b',
    fontSize: 12,
    fontWeight: '800',
  },
  textInputBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  variantChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  variantChipActive: {
    borderColor: Colors.accentYellow,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
  },
  variantChipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
  },
  variantChipTextActive: {
    color: Colors.accentYellow,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  colorSwatchActive: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },
  horizontalPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
  },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 7,
  },
  voiceChipLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  pitchControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pitchLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  pitchSteppers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pitchStepBtn: {
    width: 34,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pitchZeroText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  speedButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  speedOptionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  speedOptionBtnActive: {
    borderColor: Colors.accentCyan,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  speedOptionValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  speedOptionValueActive: {
    color: Colors.accentCyan,
  },
  speedOptionDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 2,
  },
});
