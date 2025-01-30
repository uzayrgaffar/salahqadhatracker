import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import Dialog from 'react-native-dialog';
import { AppContext } from '../AppContext';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation();

  const [isConfirming, setIsConfirming] = useState(false);

  const { selectedLanguage, setSelectedLanguage, setGender, setMadhab, gender, madhab } = useContext(AppContext);
  const [localSelectedLanguage, setLocalSelectedLanguage] = useState(selectedLanguage);
  const [localGender, setLocalGender] = useState(gender);
  const [localMadhab, setLocalMadhab] = useState(madhab);

  const selectLanguage = (language) => {
    setLocalSelectedLanguage(language);
    setSelectedLanguage(language);
  };

  const selectGender = (gender) => {
    setLocalGender(gender);
    setGender(gender);
  };

  const selectMadhab = (madhab) => {
    setLocalMadhab(madhab);
    setMadhab(madhab);
  };

  const goToQadha = () => {
    setIsConfirming(true);
  };

  const handleConfirmation = (isYes) => {
    setIsConfirming(false);
    if (isYes) {
      navigation.navigate('SetQadhaSalah');
    }
  };

  const getConfirmationTitle = () => {
    switch (localSelectedLanguage) {
      case 'Arabic':
        return 'التأكيد';
      case 'Urdu':
        return 'تصدیق';
      case 'Hindi':
        return 'पुष्टि';
      default:
        return 'Confirmation';
    }
  };

  const getConfirmationDescription = () => {
    const selections = `
      ${localSelectedLanguage === 'English' ? 'Language: English' : 
        localSelectedLanguage === 'Arabic' ? 'اللغة: العربية' : 
        localSelectedLanguage === 'Urdu' ? 'زبان: اردو' : 
        'भाषा'}
      
      ${localSelectedLanguage === 'English' ? 'Gender' : 
        localSelectedLanguage === 'Arabic' ? 'جنس' : 
        localSelectedLanguage === 'Urdu' ? 'جنس' : 
        'लिंग'}: ${localGender}
      
      ${localSelectedLanguage === 'English' ? 'Madhab' : 
        localSelectedLanguage === 'Arabic' ? 'مذهب' : 
        localSelectedLanguage === 'Urdu' ? 'مکتب' : 
        'मस्लक'}: ${localMadhab}
    `;

    switch (localSelectedLanguage) {
      case 'Arabic':
        return `لقد اخترت:\n\n${selections}\nيمكنك تغيير هذه الاختيارات لاحقًا في أي وقت. هل أنت متأكد أنك تريد التقدم؟`;
      case 'Urdu':
        return `آپ نے منتخب کیا ہے:\n\n${selections}\nآپ ان انتخاب کو بعد میں کسی بھی وقت تبدیل کر سکتے ہیں۔ کیا آپ واقعی آگے بڑھنا چاہتے ہیں؟`;
      case 'Hindi':
        return `आपने चयन किया है:\n\n${selections}\nआप बाद में कभी भी इन चयन को बदल सकते हैं। क्या आप वाकई आगे बढ़ना चाहते हैं?`;
      default:
        return `You have selected:\n\n${selections}\nYou can change these selections later at any time. Are you sure you want to advance?`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Text style={styles.containerHeader}>Language:</Text>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectLanguage('English')}
          style={[styles.flagButton, localSelectedLanguage === 'English' && styles.selectedButton2]}
        >
          <Image source={require('../assets/UK.webp')} style={styles.flagFull} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectLanguage('Arabic')}
          style={[styles.flagButton, localSelectedLanguage === 'Arabic' && styles.selectedButton2]}
        >
          <Image source={require('../assets/Saudi.webp')} style={styles.flagFull} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectLanguage('Urdu')}
          style={[styles.flagButton, localSelectedLanguage === 'Urdu' && styles.selectedButton2]}
        >
          <Image source={require('../assets/Pakistan.png')} style={styles.flagFull} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => selectLanguage('Hindi')}
          style={[styles.flagButton, localSelectedLanguage === 'Hindi' && styles.selectedButton2]}
        >
          <Image source={require('../assets/India.png')} style={styles.flagFull} />
        </TouchableOpacity>
      </View>

      <View style={styles.wrapper}>
        <View style={styles.buttonContainer2}>
          <Text style={styles.genderHeader}>Gender:</Text>
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => selectGender('Male')}
            style={[styles.flagButton, localGender === 'Male' && styles.selectedButton2]}
          >
            <Image source={require('../assets/Male.jpg')} style={styles.flagFull} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => selectGender('Female')}
            style={[styles.flagButton, localGender === 'Female' && styles.selectedButton2]}
          >
            <Image source={require('../assets/Female.jpg')} style={styles.flagFull} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer3}>
        <Text style={styles.containerHeader}>Madhab:</Text>
        <TouchableOpacity style={[styles.button, localMadhab === 'Hanafi' && styles.selectedButton]} activeOpacity={0.5} onPress={() => selectMadhab('Hanafi')}>
          {selectedLanguage === 'English' ? <Text style={styles.buttonText}>Hanafi</Text>
            : selectedLanguage === 'Arabic' ? <Text style={styles.buttonText}>حنفي</Text>
            : selectedLanguage === 'Urdu' ? <Text style={styles.buttonText}>حنفی</Text>
            : selectedLanguage === 'Hindi' ? <Text style={styles.buttonText}>हनाफी</Text>
            : <Text style={styles.text}>Hanafi</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, localMadhab === 'Maliki' && styles.selectedButton]} activeOpacity={0.5} onPress={() => selectMadhab('Maliki')}>
          {selectedLanguage === 'English' ? <Text style={styles.buttonText}>Maliki</Text>
            : selectedLanguage === 'Arabic' ? <Text style={styles.buttonText}>المالكي</Text>
            : selectedLanguage === 'Urdu' ? <Text style={styles.buttonText}>مالکی</Text>
            : selectedLanguage === 'Hindi' ? <Text style={styles.buttonText}>मलीकी</Text>
            : <Text style={styles.text}>Maliki</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer4}>
        <TouchableOpacity style={[styles.button, localMadhab === "Shafi'i" && styles.selectedButton]} activeOpacity={0.5} onPress={() => selectMadhab("Shafi'i")}>
          {selectedLanguage === 'English' ? <Text style={styles.buttonText}>Shafi'i</Text>
            : selectedLanguage === 'Arabic' ? <Text style={styles.buttonText}>ٱلشَّافِعِيّ</Text>
            : selectedLanguage === 'Urdu' ? <Text style={styles.buttonText}>شفیع</Text>
            : selectedLanguage === 'Hindi' ? <Text style={styles.buttonText}>शफ़ीई</Text>
            : <Text style={styles.text}>Shafi'i</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, localMadhab === 'Hanbali' && styles.selectedButton]} activeOpacity={0.5} onPress={() => selectMadhab('Hanbali')}>
          {selectedLanguage === 'English' ? <Text style={styles.buttonText}>Hanbali</Text>
            : selectedLanguage === 'Arabic' ? <Text style={styles.buttonText}>الحنبلي</Text>
            : selectedLanguage === 'Urdu' ? <Text style={styles.buttonText}>حنبلی</Text>
            : selectedLanguage === 'Hindi' ? <Text style={styles.buttonText}>हनबली</Text>
            : <Text style={styles.text}>Hanbali</Text>
          }
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.qadhaButton, localSelectedLanguage && localGender && localMadhab ? styles.qadhaButton : styles.disabledQadhaButton]}
        disabled={!(localSelectedLanguage && localGender && localMadhab)}
        activeOpacity={0.5}
        onPress={goToQadha}
      >
        {selectedLanguage === 'English' ? <Text style={styles.buttonText}>Reset Qadha Salah</Text>
          : selectedLanguage === 'Arabic' ? <Text style={styles.buttonText}>تعيين قضاء صلاح</Text>
          : selectedLanguage === 'Urdu' ? <Text style={styles.buttonText}>قضاء صلاۃ مقرر کریں</Text>
          : selectedLanguage === 'Hindi' ? <Text style={styles.buttonText}>क़ाधा सलाह सेट करें</Text>
          : <Text style={styles.text}>Set Qadha Salah</Text>
        }
      </TouchableOpacity>

      <Dialog.Container visible={isConfirming} contentStyle={styles.dialogContainer}>
        <Dialog.Title style={styles.dialogTitle}>{getConfirmationTitle()}</Dialog.Title>
        <Dialog.Description style={styles.dialogDescription}>
          {getConfirmationDescription()}
        </Dialog.Description>
        <Dialog.Button label={localSelectedLanguage === 'English' ? 'Cancel' :
          localSelectedLanguage === 'Arabic' ? 'يلغي' :
          localSelectedLanguage === 'Urdu' ? 'منسوخ' :
          'रद्द करना'}
          onPress={() => handleConfirmation(false)} 
          style={styles.dialogButton}
        />
        <Dialog.Button label={localSelectedLanguage === 'English' ? 'Yes' :
          localSelectedLanguage === 'Arabic' ? 'نعم' :
          localSelectedLanguage === 'Urdu' ? 'جی ہاں' :
          'हाँ'} 
          onPress={() => handleConfirmation(true)} 
          style={styles.dialogButton}
        />
      </Dialog.Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#66435a',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 60,
    paddingBottom: 30,
    justifyContent: 'space-around',
    width: '100%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    position: 'relative',
  },
  wrapper: {
    width: '100%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    alignItems: 'center',
    paddingBottom: 30,
  },
  buttonContainer2: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-around',
    width: '50%',
    position: 'relative',
  },
  buttonContainer3: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-around',
    width: '100%',
    position: 'relative',
  },
  buttonContainer4: {
    flexDirection: 'row',
    marginTop: 20,
    paddingBottom: 30,
    justifyContent: 'space-around',
    width: '100%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    position: 'relative',
  },
  flagButton: {
    width: 80,
    height: 80,
    margin: 10,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  selectedButton: {
    backgroundColor: '#1A6866'
  },
  selectedButton2: {
    borderWidth: 3,
    borderColor: '#1A6866'
  },
  flagFull: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  qadhaButton: {
    backgroundColor: '#1A6866',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    width: '90%',
    margin: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'grey',
    borderWidth: 1,
    marginTop: '15%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  disabledQadhaButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    width: '90%',
    margin: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'grey',
    borderWidth: 1,
    marginTop: '15%',
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 30,
  },
  dialogContainer: {
    borderRadius: 10,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dialogDescription: {
    fontSize: 16,
  },
  dialogButton: {
    fontSize: 16,
  },
  containerHeader: {
    position: 'absolute',
    top: '-20%',
    left: '2.5%',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: "#E0F7F4"
  },
  genderHeader: {
    position: 'absolute',
    top: '-20%',
    left: '-46%',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: "#E0F7F4"
  },
});

export default Profile;