import { useContext } from "react"
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Linking } from "react-native"
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

  const handleLinkPress = () => {
    Linking.openURL('https://iftaainstitute.org/');
  };


  // const getContent = () => {
  //   switch (selectedLanguage) {
  //     case "Arabic":
  //       return "محتوى عربي هنا"
  //     case "Urdu":
  //       return "یہاں اردو مواد ہے"
  //     case "Hindi":
  //       return "यहां हिंदी सामग्री है"
  //     default:
  //       return "English content here"
  //   }
  // }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.contentText}>Alhamdulillāh, Darul Iftaa Mu'adh Ibn Jabal - Leicester, UK is humbled to present this app to help the Muslim Ummah track and make up for their missed Salāh. We understand the importance of fulfilling our obligations to Allah Ta'ālā, and this app is designed to make the journey of completing Qadhā Salāh easier and more organised. May Allah Ta'ālā accept our efforts and grant us all steadfastness in Salāh. Āmīn.</Text>
          <Text style={styles.contentTitle}>Darul Iftaa Mu'adh Ibn Jabal</Text>
          <Text style={styles.contentText}>Darul Iftaa Mu'adh Ibn Jabal, based in Leicester, UK, is dedicated to providing Islamic guidance rooted in the teachings of the Qur'an and Sunnah. Under the supervision of qualified scholars, we offer reliable Fatāwā, educational programmes, and spiritual support to help the Muslim Ummah navigate their religious obligations with clarity and confidence. May Allah Ta'ālā accept our service to His Deen and make this app a means of ease and reward for all. Āmīn.</Text>
          <Text style={styles.contentText2}>Kindly refer to the Darul Iftaa website attached.</Text>
          <Text style={styles.link} onPress={handleLinkPress}>https://iftaainstitute.org/</Text>
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
  contentTitle: {
    fontSize: 22,
    color: "#333333",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 50,
  },
  contentText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    textAlign: "center"
  },
  contentText2: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    textAlign: "center",
    marginTop: 20,
  },
  link: {
    fontSize: 16,
    color: 'blue',
    textDecorationLine: 'underline',
    textAlign: "center"
  }
})

export default About