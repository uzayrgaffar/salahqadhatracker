import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const YearsMissed = () => {
  const navigation = useNavigation();
  const { dob, dop, setYearsMissed, setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr } = useContext(AppContext);
  const [showYearsPicker, setShowYearsPicker] = useState(false);
  const [selectedYears, setSelectedYears] = useState(null);

  const currentYear = new Date().getFullYear();
  const dopYear = new Date(dop).getFullYear();
  const maxYearsMissed = currentYear - dopYear;
  const yearsOptions = Array.from({ length: maxYearsMissed + 1 }, (_, i) => i);

  const handleYearSelection = (years) => {
    setSelectedYears(years);
    setShowYearsPicker(false);
  };

  const handleConfirm = () => {
    if (selectedYears !== null) {
      setYearsMissed(selectedYears);
      if (selectedYears === 0) {
        navigation.navigate('MadhabSelection');
        setFajr(0)
        setDhuhr(0)
        setAsr(0)
        setMaghrib(0)
        setIsha(0)
        setWitr(0)
      } else {
        navigation.navigate('MadhabSelection');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Years Missed</Text>
      </View>
      
      <Text style={styles.instructions}>Please select the number of years of salah you have missed:</Text>
      <View style={styles.yearsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedYears !== null && styles.selectedButton,
          ]}
          onPress={() => setShowYearsPicker(true)}
        >
          <Text style={styles.buttonText}>
            {selectedYears !== null ? `Years (${selectedYears})` : 'Select Years'}
          </Text>
        </TouchableOpacity>
        
        <Modal visible={showYearsPicker} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Years</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedYears}
                  onValueChange={(itemValue) => handleYearSelection(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {yearsOptions.map(year => (
                    <Picker.Item key={year} label={`${year}`} value={year} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowYearsPicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton, 
          selectedYears === null && styles.disabledButton
        ]}
        onPress={handleConfirm}
        disabled={selectedYears === null}
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
    paddingHorizontal: 20,
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
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#E0F7F4'
  },
  yearsContainer: {
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
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
    color: '#fff',
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
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,
    elevation: 11,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
    color: '#E0F7F4',
    fontWeight: 'bold',
  },
  pickerWrapper: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 5,
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: '100%',
    color: '#E0F7F4',
  },
  pickerItem: {
    fontSize: 22,
    height: 44,
  },
  modalCloseButton: {
    backgroundColor: '#259591',
    padding: 10,
    borderRadius: 10,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default YearsMissed;