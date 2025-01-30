import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';

export const SetQadhaSalah = () => {
  const navigation = useNavigation();
  const { selectedLanguage, setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr, yearsMissed, daysOfCycle, gender, madhab, pnb, numberOfChildren } = useContext(AppContext);
  const [selectedSalah, setSelectedSalah] = useState({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
    Witr: false,
    Jummah: false,
    OnlyRamadan: false,
    None: false
  });

  const toggleSalah = (salah) => {
    setSelectedSalah(prevState => {
      const newState = { ...prevState };
  
      if (salah === 'None') {
        Object.keys(newState).forEach(key => {
          newState[key] = key === 'None' ? !prevState.None : false;
        });
      } else {
        newState.None = false;
        newState[salah] = !prevState[salah];
      }
  
      return newState;
    });
  };  

  const confirmSelection = () => {
    const totalDays = yearsMissed * 365;

    if (selectedSalah.OnlyRamadan) {
        const daysPerYear = 336;
        const missedDays = yearsMissed * daysPerYear;
        if (daysOfCycle && gender === 'Female') {
          const missedDays = yearsMissed * daysPerYear - daysOfCycle * 12 * yearsMissed;  
          const childAdjustment = numberOfChildren * 9 * daysOfCycle;
          const pnbAdjustment = pnb * numberOfChildren;
          const adjustedDays = missedDays + childAdjustment - pnbAdjustment;
      
          setFajr(adjustedDays);
          setDhuhr(adjustedDays);
          setAsr(adjustedDays);
          setMaghrib(adjustedDays);
          setIsha(adjustedDays);
          setWitr(adjustedDays);
      } else {
            setFajr(missedDays);
            setDhuhr(missedDays);
            setAsr(missedDays);
            setMaghrib(missedDays);
            setIsha(missedDays);
            setWitr(missedDays);

            if (selectedSalah.Jummah) {
                setDhuhr(missedDays - 48 * yearsMissed);
            }
        }
    } else if (selectedSalah.None) {
      if (daysOfCycle && gender === 'Female') {
        const daysPerYear = 365;
        const missedDays = yearsMissed * daysPerYear - daysOfCycle * 12 * yearsMissed;
        const childAdjustment = numberOfChildren * 9 * daysOfCycle;
        const pnbAdjustment = pnb * numberOfChildren;
        const adjustedDays = missedDays + childAdjustment - pnbAdjustment;
    
        setFajr(adjustedDays);
        setDhuhr(adjustedDays);
        setAsr(adjustedDays);
        setMaghrib(adjustedDays);
        setIsha(adjustedDays);
        setWitr(adjustedDays);
    } else {
            setFajr(totalDays);
            setDhuhr(totalDays);
            setAsr(totalDays);
            setMaghrib(totalDays);
            setIsha(totalDays);
            setWitr(totalDays);
        }
    } else {
        if (daysOfCycle && gender === 'Female') {
            const ftotalDays = totalDays - daysOfCycle * 12 * yearsMissed;
            setFajr(selectedSalah.Fajr ? 0 : ftotalDays);
            setDhuhr(selectedSalah.Dhuhr ? 0 : ftotalDays);
            setAsr(selectedSalah.Asr ? 0 : ftotalDays);
            setMaghrib(selectedSalah.Maghrib ? 0 : ftotalDays);
            setIsha(selectedSalah.Isha ? 0 : ftotalDays);
            setWitr(selectedSalah.Witr ? 0 : ftotalDays);

            if (selectedSalah.Jummah && !selectedSalah.Dhuhr) {
                const onlyJummah = ftotalDays - (52 * yearsMissed);
                setDhuhr(onlyJummah);
            }
        } else {
            setFajr(selectedSalah.Fajr ? 0 : totalDays);
            setDhuhr(selectedSalah.Dhuhr ? 0 : totalDays);
            setAsr(selectedSalah.Asr ? 0 : totalDays);
            setMaghrib(selectedSalah.Maghrib ? 0 : totalDays);
            setIsha(selectedSalah.Isha ? 0 : totalDays);
            setWitr(selectedSalah.Witr ? 0 : totalDays);

            if (selectedSalah.Jummah && !selectedSalah.Dhuhr) {
                const onlyJummah = totalDays - (52 * yearsMissed);
                setDhuhr(onlyJummah);
            }
        }
    }

    navigation.navigate('MainPages', { screen: 'Daily Chart' });
};
  

  const getTranslation = (text) => {
    switch (selectedLanguage) {
      case 'Arabic':
        return {
          Fajr: 'الفجر',
          Dhuhr: 'الظهر',
          Asr: 'العصر',
          Maghrib: 'المغرب',
          Isha: 'العشاء',
          Witr: 'الوتر',
          Jummah: 'الجمعة',
          OnlyRamadan: 'رمضان فقط',
          None: 'لا شيء مما سبق',
          question: 'أي صلاة كنت تصلي بانتظام؟',
          confirm: 'تأكيد'
        }[text];
      case 'Urdu':
        return {
          Fajr: 'فجر',
          Dhuhr: 'ظہر',
          Asr: 'عصر',
          Maghrib: 'مغرب',
          Isha: 'عشاء',
          Witr: 'وتر',
          Jummah: 'جمعہ',
          OnlyRamadan: 'صرف رمضان',
          None: 'اوپر میں سے کوئی نہیں',
          question: 'آپ نے کون سی نماز باقاعدگی سے ادا کی؟',
          confirm: 'تصدیق کریں'
        }[text];
      case 'Hindi':
        return {
          Fajr: 'फजर',
          Dhuhr: 'जुहर',
          Asr: 'असर',
          Maghrib: 'मग़रिब',
          Isha: 'ईशा',
          Witr: 'वितर',
          Jummah: 'जुम्मा',
          OnlyRamadan: 'केवल रमजान',
          None: 'उपरोक्त में से कोई नहीं',
          question: 'आपने कौन सी नमाज नियमित रूप से पढ़ी?',
          confirm: 'पुष्टि करें'
        }[text];
      default:
        return {
          Fajr: 'Fajr',
          Dhuhr: 'Dhuhr',
          Asr: 'Asr',
          Maghrib: 'Maghrib',
          Isha: 'Isha',
          Witr: 'Witr',
          Jummah: 'Jummah',
          OnlyRamadan: 'Only Ramadan',
          None: 'None of the Above',
          question: 'Which Salah did you pray regularly?',
          confirm: 'Confirm'
        }[text];
    }
  };

  const isAnySelected = Object.values(selectedSalah).some(value => value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Qadha Salah</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>
          {getTranslation('question')}
        </Text>

        <View style={styles.optionsContainer}>
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', ...(madhab === 'Hanafi' ? ['Witr'] : []), 'Jummah', 'OnlyRamadan', 'None'].map(salah => (
          <TouchableOpacity
            key={salah}
            style={[
            styles.optionButton,
            selectedSalah[salah] && styles.optionButtonSelected
            ]}
            onPress={() => toggleSalah(salah)}
          >
            <Text style={styles.optionText}>{getTranslation(salah)}</Text>
          </TouchableOpacity>
          ))}
        </View>


        <TouchableOpacity
          style={[styles.confirmButton, !isAnySelected && styles.confirmButtonDisabled]}
          onPress={confirmSelection}
          disabled={!isAnySelected}
        >
          <Text style={styles.buttonText}>{getTranslation('confirm')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#66435a',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  question: {
    color: '#E0F7F4',
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    marginHorizontal: '5%',
  },
  optionsContainer: {
    width: '80%',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#259591',
    padding: 10,
    alignItems: 'center',
    marginVertical: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
    borderRadius: 50,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'grey',
    borderWidth: 1,
  },
  optionButtonSelected: {
    backgroundColor: '#1A6866',
  },
  optionText: {
    color: '#E0F7F4',
    fontSize: 18,
  },
  confirmButton: {
    backgroundColor: '#259591',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'grey',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#E0F7F4',
    fontSize: 20,
    textAlign: 'center',
  },
});

export default SetQadhaSalah;