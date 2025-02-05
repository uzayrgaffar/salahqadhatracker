import { useContext } from "react"
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native"
import { AppContext } from "../AppContext"

export const About = () => {
  const { selectedLanguage } = useContext(AppContext)

  const getTitle = () => {
    switch (selectedLanguage) {
      case "Arabic":
        return "معلومات عنا"
      case "Urdu":
        return "ہمارے بارے میں"
      case "Hindi":
        return "हमारे बारे में"
      default:
        return "About Us"
    }
  }

  const getContent = () => {
    switch (selectedLanguage) {
      case "Arabic":
        return "محتوى عربي هنا"
      case "Urdu":
        return "یہاں اردو مواد ہے"
      case "Hindi":
        return "यहां हिंदी सामग्री है"
      default:
        return "English content here"
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.contentText}>{getContent()}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5CB390",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    paddingTop: 40,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentText: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
  },
})

export default About