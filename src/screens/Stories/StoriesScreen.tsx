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
import { LinearGradient } from 'expo-linear-gradient';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0D0F1A',
  card: '#151828',
  cardBorder: '#1F2240',
  gold: '#D4AF37',
  goldDim: '#3A2E10',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
};

function StoryCard({ story, onPress }: { story: Story; onPress: () => void }) {
  const tagColor = CATEGORY_TEXT_COLORS[story.category];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={story.image} style={s.cardImage} resizeMode="cover" />
      <View style={s.cardOverlay} />
      <View style={s.cardBody}>
        <View style={[s.categoryTag, { borderColor: tagColor + '60' }]}>
          <Text style={[s.categoryTagText, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{story.title}</Text>
        <Text style={s.cardSubtitle} numberOfLines={1}>{story.subtitle}</Text>
        <View style={s.cardMeta}>
          <Text style={s.cardRef}>{story.reference}</Text>
          <Text style={s.cardTime}>{story.readTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function StoriesScreen() {
  const navigation = useNavigation<NavProp>();
  const [activeCategory, setActiveCategory] = useState<StoryCategory | 'All'>('All');

  const filtered =
    activeCategory === 'All'
      ? STORIES
      : STORIES.filter((s) => s.category === activeCategory);

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>BIBLE STORIES</Text>
        <View style={s.headerSpacer} />
      </View>

      {/* Category filter tabs */}
      <View style={s.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterContent}
        >
          {(['All', ...CATEGORIES] as const).map((cat) => {
            const isActive = activeCategory === cat;
            const color = cat === 'All' ? C.gold : CATEGORY_TEXT_COLORS[cat as StoryCategory];
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat as any)}
                style={[
                  s.filterTab,
                  isActive && { borderColor: color, backgroundColor: color + '18' },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[s.filterTabText, isActive && { color }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Story count */}
      <Text style={s.countLabel}>{filtered.length} {filtered.length === 1 ? 'story' : 'stories'}</Text>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            onPress={() => navigation.navigate('StoryReader', { storyId: item.id })}
          />
        )}
      />
    </SafeAreaView>
    </LinearGradient>
  );
}

const CARD_W = '48%';

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, color: C.gold, lineHeight: 34 },
  headerTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5 },
  headerSpacer: { width: 44 },

  filterWrapper: { borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  filterTabText: { fontSize: 12, fontWeight: '600', color: C.textMuted, letterSpacing: 0.4 },

  countLabel: {
    fontSize: 11,
    color: C.textMuted,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    letterSpacing: 0.4,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  row: { justifyContent: 'space-between', marginBottom: 16 },

  card: {
    width: CARD_W,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    height: 220,
  },
  cardImage: { position: 'absolute', width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(8,9,18,0.68)',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  categoryTagText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },

  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    lineHeight: 18,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 10,
    color: C.textSub,
    lineHeight: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRef: { fontSize: 9, color: C.gold, fontWeight: '600', flex: 1 },
  cardTime: { fontSize: 9, color: C.textMuted },
});
