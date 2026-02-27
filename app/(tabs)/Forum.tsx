import { useState, useContext } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, LayoutAnimation } from "react-native"
import { AppContext } from "../../AppContext"
import Icon from "react-native-vector-icons/Ionicons"
import { useRouter } from "expo-router"

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedIndex, setExpandedIndex] = useState(null)

  const { selectedLanguage } = useContext(AppContext)
  const router = useRouter()

  const questionsEN = [
    { question: "Is it necessary to make up missed Salah?", answer: "Yes, it is obligatory to make up missed Fard prayers" },
    { question: "Can I perform Qadha Salah at any time throughout the day?", answer: "Yes, except for 5 minutes before sunrise, 10 minutes before dhuhr and 15 minutes before sunset" },
    { question: "Do I have to pray my Qadha Salah in order?", answer: "If you have only a few Qadha prayers, they should be made up in order. However, if there are many, then performing them regularly is sufficient without strict order." },
    { question: "What intention (niyyah) should I make for Qadha Salah?", answer: "You should specify which Salah you are making up, e.g., 'I intend to perform Qadha of Fajr prayer'. If the exact date is unknown, then a general intention is sufficient." },
    { question: "Can I pray Qadha Salah in congregation (Jama'ah)?", answer: "No, Qadha Salah should generally be performed individually. However, if a group agrees to perform Qadha together, it is permissible" },
    { question: "Can I pray Qadha Salah in place of Sunnah or Nafl prayers?", answer: "If you have a large backlog of missed Salah, it is recommended to prioritize Qadha over optional Sunnah/Nafl prayers (except emphasized Sunnah)" },
    { question: "Can I perform Qadha Salah for someone who has passed away?", answer: "No, Qadha Salah cannot be performed on behalf of a deceased person. Instead, you can give Sadaqah (charity) on their behalf." },
    { question: "If I was ignorant about the obligation of making up missed Salah, am I still responsible?", answer: "Yes, ignorance does not remove responsibility. You must sincerely repent and make up the missed prayers as soon as possible" },
    { question: "What if I converted to Islam—do I have to make up past missed prayers?", answer: "No, a convert does not need to make up missed Salah before embracing Islam. They start fresh upon conversion." },
    { question: "Does missing Salah intentionally make me a non-Muslim?", answer: "While neglecting Salah is a major sin, a person does not become a non-Muslim unless they completely reject the obligation of Salah. However, they must repent and start praying immediately." },
    { question: "What if I was unconscious or in a coma—do I need to make up missed prayers?", answer: "If unconscious for more than six Salah times, Qadha is not required. If it was less, then the missed Salah must be made up." },
  ]

  const questionsAR = [
    { question: "١", answer: "١" },
    { question: "٢", answer: "٢" },
    { question: "٣", answer: "٣" },
    { question: "٤", answer: "٤" },
    { question: "٥", answer: "٥" },
    { question: "٦", answer: "٦" },
    { question: "٧", answer: "٧" },
    { question: "٨", answer: "٨" },
    { question: "٩", answer: "٩" },
    { question: "١٠", answer: "١٠" },
    { question: "١١", answer: "١١" },
  ]

  const questionsUR = [
    { question: "١", answer: "١" },
    { question: "٢", answer: "٢" },
    { question: "٣", answer: "٣" },
    { question: "۴", answer: "۴" },
    { question: "٥", answer: "٥" },
    { question: "٦", answer: "٦" },
    { question: "۷", answer: "۷" },
    { question: "٨", answer: "٨" },
    { question: "٩", answer: "٩" },
    { question: "١٠", answer: "١٠" },
    { question: "١١", answer: "١١" },
  ]

  const questionsHI = [
    { question: "१", answer: "१" },
    { question: "२", answer: "२" },
    { question: "३", answer: "३" },
    { question: "४", answer: "४" },
    { question: "५", answer: "५" },
    { question: "६", answer: "६" },
    { question: "७", answer: "७" },
    { question: "८", answer: "८" },
    { question: "९", answer: "९" },
    { question: "१०", answer: "१०" },
    { question: "११", answer: "११" },
  ]

  const filteredQuestions =
    selectedLanguage === "English"
      ? questionsEN
      : selectedLanguage === "Arabic"
        ? questionsAR
        : selectedLanguage === "Urdu"
          ? questionsUR
          : selectedLanguage === "Hindi"
            ? questionsHI
            : questionsEN

  const filteredQuestionsResult = filteredQuestions.filter((q) =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handlePress = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push("/QiblahCompass")}
          style={{ position: 'absolute', left: 25, top: 65 }}
        >
          <Icon name="compass" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search questions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {filteredQuestionsResult.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="help-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No questions found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={filteredQuestionsResult}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.questionWrapper}>
                <TouchableOpacity
                  onPress={() => handlePress(index)}
                  style={[
                    styles.questionContainer,
                    expandedIndex === index && styles.questionContainerExpanded
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.questionHeader}>
                    <Text style={[
                      styles.questionText,
                      expandedIndex === index && styles.questionTextExpanded
                    ]}>
                      {item.question}
                    </Text>
                    <Icon
                      name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={expandedIndex === index ? "#FFFFFF" : "#6B7280"}
                      style={styles.chevronIcon}
                    />
                  </View>
                </TouchableOpacity>
                {expandedIndex === index && (
                  <View style={styles.answerContainer}>
                    <View style={styles.answerIconContainer}>
                      <Icon name="checkmark-circle" size={20} color="#5CB390" />
                    </View>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5CB390",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1F2937",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  questionWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  questionContainer: {
    padding: 18,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
  },
  questionContainerExpanded: {
    backgroundColor: "#5CB390",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
    lineHeight: 22,
    marginRight: 8,
  },
  questionTextExpanded: {
    color: "#FFFFFF",
  },
  chevronIcon: {
    marginLeft: 8,
  },
  answerContainer: {
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  answerIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  answerText: {
    flex: 1,
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  flatListContent: {
    paddingBottom: 20,
  },
})

export default Forum