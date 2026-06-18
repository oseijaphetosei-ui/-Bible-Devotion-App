import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { STORIES, CATEGORIES, CATEGORY_TEXT_COLORS, type Story, type StoryCategory } from '../../data/stories';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function StoryCard({ story, onPress, gold }: { story: Story; onPress: () => void; gold: string }) {
  const tagColor = CATEGORY_TEXT_COLORS[story.category];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={story.image} style={s.cardImage} resizeMode="cover" />
      <View style={s.cardOverlay} />
      <View style={s.cardBody}>
        <View style={s.cardGlass}>
          <View style={[s.categoryTag, { borderColor: tagColor + '60' }]}>
            <Text style={[s.categoryTagText, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
          </View>
          <Text style={s.cardTitle} numberOfLines={2}>{story.title}</Text>
          <Text style={s.cardSubtitle} numberOfLines={1}>{story.subtitle}</Text>
          <View style={s.cardMeta}>
            <Text style={[s.cardRef, { color: gold }]}>{story.reference}</Text>
            <Text style={s.cardTime}>{story.readTime} min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function StoriesScreen() {
  const navigation = useNavigation<NavProp>();
  const t = useTheme();
  const [activeCategory, setActiveCategory] = useState<StoryCategory | 'All'>('All');

  const filtered =
    activeCategory === 'All'
      ? STORIES
      : STORIES.filter((s) => s.category === activeCategory);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={[s.backIcon, { color: t.gold }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.textMuted }]}>BIBLE STORIES</Text>
          <View style={s.headerSpacer} />
        </View>

        {/* Category filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterContent}
        >
          {(['All', ...CATEGORIES] as const).map((cat) => {
            const isActive = activeCategory === cat;
            const color = cat === 'All' ? t.gold : CATEGORY_TEXT_COLORS[cat as StoryCategory];
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat as any)}
                style={[
                  s.filterTab,
                  { borderColor: t.chipBorder, backgroundColor: t.chipBg },
                  isActive && { borderColor: color + 'AA', backgroundColor: color + '18' },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[s.filterTabText, { color: t.textMuted }, isActive && { color }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Story count */}
        <Text style={[s.countLabel, { color: t.textMuted }]}>
          {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
        </Text>

        {/* Grid */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={52}
          maxToRenderPerBatch={52}
          windowSize={21}
          removeClippedSubviews={false}
          getItemLayout={(_data, index) => ({
            length: CARD_ROW_H,
            offset: LIST_PADDING_TOP + Math.floor(index / 2) * CARD_ROW_H,
            index,
          })}
          renderItem={({ item }) => (
            <StoryCard
              story={item}
              gold={t.gold}
              onPress={() => navigation.navigate('StoryReader', { storyId: item.id })}
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const CARD_W = '48%';
const CARD_ROW_H = 236;
const LIST_PADDING_TOP = 8;

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, lineHeight: 34 },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  headerSpacer: { width: 44 },

  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  filterTabText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },

  countLabel: {
    fontSize: 11, paddingHorizontal: 20, paddingTop: 4,
    paddingBottom: 4, letterSpacing: 0.4,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  row: { justifyContent: 'space-between', marginBottom: 16 },

  card: {
    width: CARD_W, borderRadius: 14, overflow: 'hidden',
    height: 220, backgroundColor: '#111',
  },
  cardImage: { position: 'absolute', width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(8,9,18,0.22)',
  },
  cardBody: { flex: 1, justifyContent: 'flex-end' },
  cardGlass: {
    backgroundColor: 'rgba(8,8,20,0.82)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)',
    padding: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6,
  },
  categoryTagText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  cardTitle: {
    fontSize: 13, fontWeight: '700', color: '#F0EFE9', lineHeight: 18, marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 10, color: '#8B8FA8', lineHeight: 14, marginBottom: 8, fontStyle: 'italic',
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRef: { fontSize: 9, fontWeight: '600', flex: 1 },
  cardTime: { fontSize: 9, color: '#555870' },
});
