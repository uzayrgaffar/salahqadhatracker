import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { AppContext } from '../AppContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

const MadhabSelection = () => {
  const navigation = useNavigation();
  const { madhab, setMadhab, selectedLanguage, dop } = useContext(AppContext);
  const [selectedMadhab, setSelectedMadhab] = useState(null);

  const selectMadhab = (madhab) => {
    setSelectedMadhab(madhab);
  };

  const handleConfirm = () => {
    if (selectedMadhab) {
      setMadhab(selectedMadhab);
      navigation.navigate('SetQadhaSalah');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Madhab</Text>
      </View>
      <Text style={styles.instructions}>Please select your Madhab:</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, selectedMadhab === 'Hanafi' && styles.selectedButton]}
          activeOpacity={0.5}
          onPress={() => selectMadhab('Hanafi')}
        >
          <Text style={styles.buttonText}>Hanafi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedMadhab === 'Maliki' && styles.selectedButton]}
          activeOpacity={0.5}
          onPress={() => selectMadhab('Maliki')}
        >
          <Text style={styles.buttonText}>Maliki</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedMadhab === "Shafi'i" && styles.selectedButton]}
          activeOpacity={0.5}
          onPress={() => selectMadhab("Shafi'i")}
        >
          <Text style={styles.buttonText}>Shafi'i</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedMadhab === 'Hanbali' && styles.selectedButton]}
          activeOpacity={0.5}
          onPress={() => selectMadhab('Hanbali')}
        >
          <Text style={styles.buttonText}>Hanbali</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedMadhab && styles.disabledButton]}
        onPress={handleConfirm}
        disabled={!selectedMadhab}
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
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#E0F7F4'
  },
  buttonContainer: {
    justifyContent: 'space-around',
    width: '100%',
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
    backgroundColor: '#1A6866'
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    color: '#E0F7F4',
    fontSize: 30,
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
});

export default MadhabSelection;