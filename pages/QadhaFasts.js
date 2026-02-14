import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Haptics from 'expo-haptics';

const QadhaFasts = () => {
  const [fastCount, setFastCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [initialInput, setInitialInput] = useState("")
  const [adjustInput, setAdjustInput] = useState("")

  const userId = auth().currentUser?.uid
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!userId) return

    const unsubscribe = firestore()
      .collection("users")
      .doc(userId)
      .onSnapshot(doc => {
        if (doc.exists && doc.data().qadhaFasts !== undefined) {
          setFastCount(doc.data().qadhaFasts)
          setHasData(true)
        } else {
          setHasData(false)
        }
        setLoading(false)
      }, err => {
        console.error("Firestore Error:", err)
        setLoading(false)
      })

    return () => unsubscribe()
  }, [userId])

  // Helper to ensure only numbers are typed
  const validateAndSetInput = (text, setter) => {
    const cleaned = text.replace(/[^0-9]/g, "")
    setter(cleaned)
  }

  const handleInitialSetup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    if (initialInput === "") return Alert.alert("Wait", "Please enter a number to start.")
    const num = parseInt(initialInput, 10)
    try {
      await firestore().collection("users").doc(userId).set({ qadhaFasts: num }, { merge: true })
      setHasData(true)
    } catch (error) {
      console.error("Setup error: ", error)
    }
  }

  const handleAdjustCount = async () => {
    if (adjustInput === "") return setShowAdjustModal(false)
    const num = parseInt(adjustInput, 10)
    try {
      await firestore().collection("users").doc(userId).set({ qadhaFasts: num }, { merge: true })
      setShowAdjustModal(false)
      setAdjustInput("")
    } catch (error) {
      console.error("Adjustment error: ", error)
    }
  }

  const updateFasts = async (change) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const newValue = Math.max(0, fastCount + change)
    try {
      await firestore().collection("users").doc(userId).set({ qadhaFasts: newValue }, { merge: true })
    } catch (error) {
      console.error("Error updating fasts: ", error)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5CB390" />
      </View>
    )
  }

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Qadha Fasts</Text>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.helpIcon}>
            <Icon name="help-circle" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!hasData ? (
            /* --- SETUP VIEW --- */
            <View style={styles.setupContainer}>
              <View style={styles.setupIconCircle}>
                <Icon name="moon" size={40} color="#5CB390" />
              </View>
              <Text style={styles.setupTitle}>Setup</Text>
              <Text style={styles.setupSubtitle}>How many qadha fasts do you currently have left to complete?</Text>
              
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="number-pad"
                value={initialInput}
                onChangeText={(text) => validateAndSetInput(text, setInitialInput)}
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.gotItButton} onPress={handleInitialSetup}>
                <Text style={styles.gotItButtonText}>Start Tracking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* --- MAIN COUNTER VIEW --- */
            <>
              <View style={styles.counterCard}>
                <Text style={styles.label}>Remaining Fasts</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setAdjustInput(fastCount.toString())
                    setShowAdjustModal(true)
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.countText}>{fastCount}</Text>
                  <Text style={styles.tapToEdit}>Tap number to adjust</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.circleButton, { backgroundColor: '#FF6B6B' }]} 
                    onPress={() => updateFasts(-1)}
                  >
                    <Icon name="remove" size={32} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.circleButton, { backgroundColor: '#5CB390' }]} 
                    onPress={() => updateFasts(1)}
                  >
                    <Icon name="add" size={32} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Icon name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                  Use the buttons to log fasts. Tap the number if you need to manually correct your total.
                </Text>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* --- ADJUST MODAL --- */}
      <Modal visible={showAdjustModal} transparent={true} animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adjust Total</Text>
                <Text style={styles.modalSubtitle}>Enter your correct qadha total</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: '#F9FAFB', marginBottom: 20 }]}
              keyboardType="number-pad"
              autoFocus={true}
              value={adjustInput}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "");
                setAdjustInput(cleaned);
              }}
            />

            <TouchableOpacity 
              style={styles.gotItButton} 
              onPress={handleAdjustCount}
              activeOpacity={0.8}
            >
              <Text style={styles.gotItButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- HELP MODAL --- */}
      <Modal visible={showHelp} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Qadha Fasts Guide</Text>
                <Text style={styles.modalSubtitle}>Tracking your missed fasts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Icon name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.helpItem}>
                <View style={[styles.helpIconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <Icon name="calendar-outline" size={24} color="#4F46E5" />
                </View>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpLabel}>Manual Adjustments</Text>
                  <Text style={styles.helpDescription}>Tap the large number on the main screen to manually type in a new total at any time.</Text>
                </View>
              </View>
              <View style={styles.helpItem}>
                <View style={[styles.helpIconCircle, { backgroundColor: '#E8FFF6' }]}>
                  <Icon name="checkmark-done" size={24} color="#5CB390" />
                </View>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpLabel}>Completing Fasts</Text>
                  <Text style={styles.helpDescription}>Use the minus (-) button when you complete a fast to lower your debt.</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.gotItButton} onPress={() => setShowHelp(false)}>
              <Text style={styles.gotItButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#5CB390" },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: "600", color: "#FFFFFF" },
  helpIcon: { position: 'absolute', right: 20, top: 65 },
  content: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center' },
  setupContainer: { width: '100%', paddingTop: 40, alignItems: 'center' },
  setupIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F9F4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  setupTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  setupSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 30 },
  input: { width: '100%', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 18, fontSize: 20, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginBottom: 24 },
  counterCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, marginTop: 20 },
  label: { fontSize: 16, color: '#777', fontWeight: '500', marginBottom: 10 },
  countText: { fontSize: 80, fontWeight: '800', color: '#333', textAlign: 'center' },
  tapToEdit: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  buttonRow: { flexDirection: 'row', gap: 40 },
  circleButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginTop: 40, alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 100 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  helpItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12 },
  helpIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  helpTextContainer: { flex: 1 },
  helpLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  helpDescription: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  gotItButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#2F7F6F", padding: 18, borderRadius: 16, elevation: 3 },
  gotItButtonText: { fontSize: 17, color: "#FFFFFF", fontWeight: "600" },
})

export default QadhaFasts