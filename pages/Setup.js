import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Setup = () => {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calculation Method</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Would you like us to help calculate your qadha salah?</Text>
        <Text style={styles.descriptionText}>
          We can estimate your total qadha salah by asking you a few questions.
        </Text>
        <Text style={styles.descriptionText2}>
          Alternatively, you can skip this and enter your totals manually.
        </Text> 

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => navigation.navigate("SetDOB")}
          >
            <Text style={styles.optionText}>Yes, calculate for me</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, styles.secondaryButton]}
            onPress={async () => {
              const user = auth().currentUser;
              if (user) {
                await firestore().collection("users").doc(user.uid).set({
                  setupComplete: true
                }, { merge: true });
              }
              navigation.replace("MadhabSelection");
            }}
          >
            <Text style={[styles.optionText, styles.secondaryText]}>No, I'll enter them manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5CB390",
    padding: 20,
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2F7F6F",
    marginBottom: 12,
    textAlign: "center"
  },
  descriptionText: {
    fontSize: 15,
    color: "#777777",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 15,
  },
  descriptionText2: {
    fontSize: 15,
    color: "#777777",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: "column",
    gap: 16,
  },
  optionButton: {
    backgroundColor: "#4BD4A2",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#4BD4A2",
  },
  optionText: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryText: {
    color: "#4BD4A2",
  },
  bottomContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
  },
})

export default Setup