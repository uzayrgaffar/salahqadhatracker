import { useContext, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Text, ScrollView, SafeAreaView } from "react-native"
import Dialog from "react-native-dialog"
import { AppContext } from "../AppContext"
import { useNavigation } from "@react-navigation/native"
import { ChevronRight } from "lucide-react-native"

const Profile = () => {
  const navigation = useNavigation()

  const [isConfirming, setIsConfirming] = useState(false)

  const { selectedLanguage, setSelectedLanguage, setGender, setMadhab, gender, madhab } = useContext(AppContext)
  const [localSelectedLanguage, setLocalSelectedLanguage] = useState(selectedLanguage)
  const [localGender, setLocalGender] = useState(gender)
  const [localMadhab, setLocalMadhab] = useState(madhab)

  const selectLanguage = (language) => {
    setLocalSelectedLanguage(language)
    setSelectedLanguage(language)
  }

  const selectGender = (gender) => {
    setLocalGender(gender)
    setGender(gender)
  }

  const selectMadhab = (madhab) => {
    setLocalMadhab(madhab)
    setMadhab(madhab)
  }

  const goToQadha = () => {
    setIsConfirming(true)
  }

  const handleConfirmation = (isYes) => {
    setIsConfirming(false)
    if (isYes) {
      navigation.navigate("SetQadhaSalah")
    }
  }

  const getConfirmationTitle = () => {
    switch (localSelectedLanguage) {
      case "Arabic":
        return "التأكيد"
      case "Urdu":
        return "تصدیق"
      case "Hindi":
        return "पुष्टि"
      default:
        return "Confirmation"
    }
  }

  const getConfirmationDescription = () => {
    const selections = `
      ${
        localSelectedLanguage === "English"
          ? "Language: English"
          : localSelectedLanguage === "Arabic"
            ? "اللغة: العربية"
            : localSelectedLanguage === "Urdu"
              ? "زبان: اردو"
              : "भाषा: हिंदी"
      }
      
      ${
        localSelectedLanguage === "English"
          ? "Gender"
          : localSelectedLanguage === "Arabic"
            ? "جنس"
            : localSelectedLanguage === "Urdu"
              ? "جنس"
              : "लिंग"
      }: ${localGender}
      
      ${
        localSelectedLanguage === "English"
          ? "Madhab"
          : localSelectedLanguage === "Arabic"
            ? "مذهب"
            : localSelectedLanguage === "Urdu"
              ? "مکتب"
              : "मस्लक"
      }: ${localMadhab}
    `

    switch (localSelectedLanguage) {
      case "Arabic":
        return `لقد اخترت:\n\n${selections}\nيمكنك تغيير هذه الاختيارات لاحقًا في أي وقت. هل أنت متأكد أنك تريد التقدم؟`
      case "Urdu":
        return `آپ نے منتخب کیا ہے:\n\n${selections}\nآپ ان انتخاب کو بعد میں کسی بھی وقت تبدیل کر سکتے ہیں۔ کیا آپ واقعی آگے بڑھنا چاہتے ہیں؟`
      case "Hindi":
        return `आपने चयन किया है:\n\n${selections}\nआप बाद में कभी भी इन चयन को बदल सकते हैं। क्या आप वाकई आगे बढ़ना चाहते हैं?`
      default:
        return `You have selected:\n\n${selections}\nYou can change these selections later at any time. Are you sure you want to advance?`
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.optionsContainer}>
                {["English", "Arabic", "Urdu", "Hindi"].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.option, localSelectedLanguage === lang && styles.selectedOption]}
                    onPress={() => selectLanguage(lang)}
                  >
                    <Text style={[styles.optionText, localSelectedLanguage === lang && styles.selectedOptionText]}>
                      {lang}
                    </Text>
                    {localSelectedLanguage === lang && <ChevronRight color="#FFFFFF" size={20} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.optionsContainer}>
                {["Male", "Female"].map((gen) => (
                  <TouchableOpacity
                    key={gen}
                    style={[styles.option, localGender === gen && styles.selectedOption]}
                    onPress={() => selectGender(gen)}
                  >
                    <Text style={[styles.optionText, localGender === gen && styles.selectedOptionText]}>{gen}</Text>
                    {localGender === gen && <ChevronRight color="#FFFFFF" size={20} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Madhab</Text>
              <View style={styles.optionsContainer}>
                {["Hanafi", "Maliki", "Shafi'i", "Hanbali"].map((mad) => (
                  <TouchableOpacity
                    key={mad}
                    style={[styles.option, localMadhab === mad && styles.selectedOption]}
                    onPress={() => selectMadhab(mad)}
                  >
                    <Text style={[styles.optionText, localMadhab === mad && styles.selectedOptionText]}>{mad}</Text>
                    {localMadhab === mad && <ChevronRight color="#FFFFFF" size={20} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.qadhaButton,
                !(localSelectedLanguage && localGender && localMadhab) && styles.disabledQadhaButton,
              ]}
              disabled={!(localSelectedLanguage && localGender && localMadhab)}
              onPress={goToQadha}
            >
              <Text style={styles.qadhaButtonText}>
                {localSelectedLanguage === "English"
                  ? "Reset Qadha Salah"
                  : localSelectedLanguage === "Arabic"
                    ? "تعيين قضاء صلاح"
                    : localSelectedLanguage === "Urdu"
                      ? "قضاء صلاۃ مقرر کریں"
                      : "क़ाधा सलाह सेट करें"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Dialog.Container visible={isConfirming} contentStyle={styles.dialogContainer}>
        <Dialog.Title style={styles.dialogTitle}>{getConfirmationTitle()}</Dialog.Title>
        <Dialog.Description style={styles.dialogDescription}>{getConfirmationDescription()}</Dialog.Description>
        <Dialog.Button
          label={
            localSelectedLanguage === "English"
              ? "Cancel"
              : localSelectedLanguage === "Arabic"
                ? "يلغي"
                : localSelectedLanguage === "Urdu"
                  ? "منسوخ"
                  : "रद्द करना"
          }
          onPress={() => handleConfirmation(false)}
          color="#777777"
        />
        <Dialog.Button
          label={
            localSelectedLanguage === "English"
              ? "Yes"
              : localSelectedLanguage === "Arabic"
                ? "نعم"
                : localSelectedLanguage === "Urdu"
                  ? "جی ہاں"
                  : "हाँ"
          }
          onPress={() => handleConfirmation(true)}
          color="#5CB390"
        />
      </Dialog.Container>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5CB390",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  selectedOption: {
    backgroundColor: "#4BD4A2",
  },
  optionText: {
    fontSize: 16,
    color: "#777777",
  },
  selectedOptionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  qadhaButton: {
    backgroundColor: "#FBC742",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  disabledQadhaButton: {
    backgroundColor: "#EEEEEE",
  },
  qadhaButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  dialogContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  dialogDescription: {
    fontSize: 16,
    color: "#777777",
    marginBottom: 20,
  },
})

export default Profile