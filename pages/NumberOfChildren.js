import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';

const NumberOfChildren = () => {
  const navigation = useNavigation();
  const { numberOfChildren, setNumberOfChildren } = useContext(AppContext);
  const [showChildrenPicker, setShowChildrenPicker] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState(numberOfChildren);

  const handleChildrenSelection = (children) => {
    setSelectedChildren(children);
    setNumberOfChildren(children);
    setShowChildrenPicker(false);
  };

  const handleConfirm = () => {
    if (selectedChildren !== null) {
      navigation.navigate('PostNatal');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Number of Children</Text>
      </View>
      <Text style={styles.instructions}>Please select the number of children you had before you started praying salah regularly:</Text>
      
      <TouchableOpacity
        style={[styles.button, selectedChildren !== null && styles.selectedButton]}
        onPress={() => setShowChildrenPicker(true)}
      >
        <Text style={styles.buttonText}>
          {selectedChildren !== null ? `Children (${selectedChildren})` : 'Select Children'}
        </Text>
      </TouchableOpacity>
      
      <Modal visible={showChildrenPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Number of Children</Text>
            <View style={styles.childrenButtonsContainer}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(children => (
                <TouchableOpacity
                  key={children}
                  style={styles.childrenButton}
                  onPress={() => handleChildrenSelection(children)}
                >
                  <Text style={styles.childrenButtonText}>{children}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChildrenPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedChildren && styles.disabledButton]}
        onPress={handleConfirm}
        disabled={!selectedChildren}
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
  childrenButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  childrenButton: {
    backgroundColor: '#259591',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    width: 50,
    alignItems: 'center',
  },
  childrenButtonText: {
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

export default NumberOfChildren;