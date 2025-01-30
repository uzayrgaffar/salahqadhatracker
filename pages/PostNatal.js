import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';

const PostNatal = () => {
  const navigation = useNavigation();
  const { pnb, setPNB } = useContext(AppContext);
  const [showPNBPicker, setShowPNBPicker] = useState(false);
  const [selectedPNB, setSelectedPNB] = useState(pnb);

  const handlePNBSelection = (days) => {
    setSelectedPNB(days);
    setPNB(days);
    setShowPNBPicker(false);
  };

  const handleConfirm = () => {
    if (selectedPNB !== null) {
      navigation.navigate('YearsMissed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Natal Bleeding</Text>
      </View>
      <Text style={styles.instructions}>Please select the average number of days for your post natal bleeding:</Text>
      
      <TouchableOpacity
        style={[styles.button, selectedPNB !== null && styles.selectedButton]}
        onPress={() => setShowPNBPicker(true)}
      >
        <Text style={styles.buttonText}>
          {selectedPNB !== null ? `Days (${selectedPNB})` : 'Select Days'}
        </Text>
      </TouchableOpacity>
      
      <Modal visible={showPNBPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Days</Text>
            <View style={styles.daysButtonsContainer}>
              {Array.from({ length: 40 }, (_, i) => i + 1).map(days => (
                <TouchableOpacity
                  key={days}
                  style={styles.daysButton}
                  onPress={() => handlePNBSelection(days)}
                >
                  <Text style={styles.daysButtonText}>{days}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPNBPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedPNB && styles.disabledButton]}
        onPress={handleConfirm}
        disabled={!selectedPNB}
      >
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#66435a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    color: '#E0F7F4',
    fontWeight: 'bold',
    marginRight: 30,
  },
  instructions: {
    color: '#E0F7F4',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    paddingLeft: 12,
    paddingRight: 12,
  },
  button: {
    backgroundColor: '#259591',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    width: '40%',
    margin: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'grey',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  selectedButton: {
    backgroundColor: '#1A6866',
  },
  buttonText: {
    color: '#E0F7F4',
    fontSize: 20,
  },
  confirmButton: {
    backgroundColor: '#259591',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    borderWidth: 1,
    borderColor: 'grey',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#E0F7F4',
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#66435a',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#E0F7F4',
    fontSize: 20,
    marginBottom: 20,
  },
  daysButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  daysButton: {
    backgroundColor: '#259591',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    width: 50,
    alignItems: 'center',
  },
  daysButtonText: {
    color: '#E0F7F4',
    fontSize: 16,
  },
  modalCloseButton: {
    backgroundColor: '#1A6866',
    padding: 10,
    marginTop: 20,
    borderRadius: 10,
  },
  modalCloseButtonText: {
    color: '#E0F7F4',
    fontSize: 16,
  },
});

export default PostNatal;