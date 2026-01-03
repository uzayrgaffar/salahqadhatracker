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
                <Text style={[styles.questionText, expandedIndex === index && styles.questionTextExpanded]}>{item.question}</Text>
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
  questionTextExpanded: {
    fontSize: 16,
    color: "#FFFFFF",
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