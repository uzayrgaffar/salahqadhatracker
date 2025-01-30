import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';

const Children = () => {
  const navigation = useNavigation();
  const { selectedLanguage, gender, madhab } = useContext(AppContext);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption === 'Yes') {
        navigation.navigate('NumberOfChildren');
    } else if (selectedOption === 'DontKnow') {
        navigation.navigate('NumberOfChildren');
    } else if (selectedOption === 'No') {
        navigation.navigate('YearsMissed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Previous Childbirth and Salah</Text>
      </View>
      <Text style={styles.instructions}>
        Did you have any children before you started praying salah regularly?
      </Text>
      
      <View style={styles.daysContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedOption === 'Yes' && styles.selectedButton,
          ]}
          onPress={() => handleOptionSelect('Yes')}
        >
          <Text style={styles.buttonText}>Yes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            selectedOption === 'DontKnow' && styles.selectedButton,
          ]}
          onPress={() => handleOptionSelect('DontKnow')}
        >
          <Text style={styles.buttonText}>Don't Know</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            selectedOption === 'No' && styles.selectedButton,
          ]}
          onPress={() => handleOptionSelect('No')}
        >
          <Text style={styles.buttonText}>No</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedOption && styles.disabledButton]}
        onPress={handleConfirm}
        disabled={!selectedOption}
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
  daysContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#259591',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    width: '40%',
    marginVertical: 10,
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
});

export default Children;