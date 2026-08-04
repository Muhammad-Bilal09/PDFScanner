import { Icon } from '@/components/shared/Icon';
import { TabBar } from '@/components/tabBar';
import { Shadows } from '@/theme';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ToolsStyle';
import { useToolsScreen } from './useToolsScreen';

export function ToolsScreen() {
  const { router, theme, handleToolPress } = useToolsScreen();

  const toolCategories = [
    {
      title: 'PDF & SCAN UTILITIES',
      tools: [
        {
          id: 'photo_pdf',
          title: 'Photos to PDF',
          desc: 'Convert single or batch gallery photos directly into high-quality PDFs.',
          icon: 'photo.on.rectangle',
          color: theme.primary,
          badge: 'POPULAR',
        },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>PDF Tools</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        {toolCategories.map((cat) => (
          <View key={cat.title}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {cat.title}
            </Text>
            <View style={styles.toolsGrid}>
              {cat.tools.map((t) => (
                <Pressable
                  key={t.id}
                  style={[
                    styles.toolCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.sm,
                  ]}
                  onPress={() => handleToolPress(t.title)}
                >
                  <View
                    style={[
                      styles.toolIconBox,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Icon sf={t.icon} fallback="🛠" size={22} color={t.color} />
                  </View>
                  <View style={styles.toolTextWrap}>
                    <View style={styles.toolTitleRow}>
                      <Text style={[styles.toolTitle, { color: theme.text }]}>
                        {t.title}
                      </Text>
                      {t.badge && (
                        <View
                          style={[
                            styles.badgeTag,
                            { backgroundColor: theme.primaryLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: theme.primary },
                            ]}
                          >
                            {t.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.toolDesc, { color: theme.textSecondary }]}
                    >
                      {t.desc}
                    </Text>
                  </View>
                  <Icon
                    sf="chevron.right"
                    fallback="›"
                    size={16}
                    color={theme.inactive}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 110 }} />
      </ScrollView>

      <TabBar activeTab="tools" />
    </View>
  );
}

export default ToolsScreen;
