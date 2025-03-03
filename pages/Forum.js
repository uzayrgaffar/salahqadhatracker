import { useState, useContext } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native"
import { AppContext } from "../AppContext"
import { Search } from "lucide-react-native"

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedIndex, setExpandedIndex] = useState(null)

  const { selectedLanguage } = useContext(AppContext)

  const questionsEN = [
    { question: "When can you not pray qadha salah?", answer: "5 minutes before sunrise, 10 minutes before dhuhr and 15 minutes before sunset" },
    { question: "2", answer: "2" },
    { question: "3", answer: "3" },
    { question: "4", answer: "4" },
    { question: "5", answer: "5" },
    { question: "6", answer: "6" },
    { question: "7", answer: "7" },
    { question: "8", answer: "8" },
    { question: "9", answer: "9" },
    { question: "10", answer: "10" },
    { question: "11", answer: "11" },
    { question: "12", answer: "12" },
    { question: "13", answer: "13" },
    { question: "14", answer: "14" },
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
    { question: "١٢", answer: "١٢" },
    { question: "١٣", answer: "١٣" },
    { question: "١٤", answer: "١٤" },
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
    { question: "١٢", answer: "١٢" },
    { question: "١٣", answer: "١٣" },
    { question: "١۴", answer: "١۴" },
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
    { question: "१२", answer: "१२" },
    { question: "१३", answer: "१३" },
    { question: "१४", answer: "१४" },
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
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#777777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search questions..."
            placeholderTextColor="#777777"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredQuestionsResult}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.questionWrapper}>
              <TouchableOpacity
                onPress={() => handlePress(index)}
                style={[styles.questionContainer, expandedIndex === index && styles.questionContainerExpanded]}
              >
                <Text style={styles.questionText}>{item.question}</Text>
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
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
    backgroundColor: "#EEEEEE",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#333333",
  },
  questionWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionContainer: {
    padding: 16,
    backgroundColor: "#EEEEEE",
    borderRadius: 12,
  },
  questionContainerExpanded: {
    backgroundColor: "#4BD4A2",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  questionText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  answerContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  answerText: {
    fontSize: 14,
    color: "#777777",
    lineHeight: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
})

export default Forum