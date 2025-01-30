import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../AppContext';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DailyChart = () => {
  const navigation = useNavigation();
  const { fajr, setFajr, dhuhr, setDhuhr, asr, setAsr, maghrib, setMaghrib, isha, setIsha, witr, setWitr, dailyPrayerCounts, setDailyPrayerCounts, madhab } = useContext(AppContext);
  const today = moment().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today);
  const [prayerStates, setPrayerStates] = useState({
    [today]: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      witr: false,
    },
  });

  const [ldailyPrayerCounts, lsetDailyPrayerCounts] = useState({
    [today]: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      witr: 0,
    },
  });

  const flatListRef = useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const generateDates = () => {
    let dates = [];
    for (let i = -14; i <= 3; i++) {
      dates.push(moment().add(i, 'days').format('YYYY-MM-DD'));
    }
    return dates;
  };

  const countSelectedPrayers = (date) => {
    const selectedPrayers = prayerStates[date] || {};
    const selectedCount = Object.values(selectedPrayers).filter(value => value).length;
    // console.log(`Number of selected Salah for ${date}: ${selectedCount}`);
  };

  const handleDateSelect = (date) => {
    if (moment(date).isSameOrBefore(today)) {
      setSelectedDate(date);
      if (!prayerStates[date]) {
        setPrayerStates((prevStates) => ({
          ...prevStates,
          [date]: {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
            witr: false,
          },
        }));
      }
      if (!ldailyPrayerCounts[date]) {
        lsetDailyPrayerCounts((prevCounts) => ({
          ...prevCounts,
          [date]: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
        }));
      }
      countSelectedPrayers(date);
      
      const index = generateDates().indexOf(date);
      if (index >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    }
  };

  const handlePrayerSelect = (prayer) => {
    const updatedStates = {
      ...prayerStates,
      [selectedDate]: {
        ...prayerStates[selectedDate],
        [prayer]: !prayerStates[selectedDate][prayer],
      },
    };
    setPrayerStates(updatedStates);
  
    setTimeout(() => {
      countSelectedPrayers(selectedDate);
    }, 500);
  
    const countAdjust = updatedStates[selectedDate][prayer] ? -1 : 1;
    if (prayer === 'fajr') setFajr(fajr + countAdjust);
    if (prayer === 'dhuhr') setDhuhr(dhuhr + countAdjust);
    if (prayer === 'asr') setAsr(asr + countAdjust);
    if (prayer === 'maghrib') setMaghrib(maghrib + countAdjust);
    if (prayer === 'isha') setIsha(isha + countAdjust);
    if (prayer === 'witr') setWitr(witr + countAdjust);
  };

  const adjustCount = (prayer, amount) => {
    lsetDailyPrayerCounts((prevCounts) => {
      const currentCount = prevCounts[selectedDate][prayer];
      if (amount < 0 && currentCount === 0) return prevCounts;

      const updatedCount = currentCount + amount;
      return {
        ...prevCounts,
        [selectedDate]: {
          ...prevCounts[selectedDate],
          [prayer]: updatedCount,
        },
      };
    });

    const countAdjust = amount < 0 ? -1 : 1;
    if (prayer === 'fajr') setFajr(fajr - countAdjust);
    if (prayer === 'dhuhr') setDhuhr(dhuhr - countAdjust);
    if (prayer === 'asr') setAsr(asr - countAdjust);
    if (prayer === 'maghrib') setMaghrib(maghrib - countAdjust);
    if (prayer === 'isha') setIsha(isha - countAdjust);
    if (prayer === 'witr') setWitr(witr - countAdjust);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = moment().format('HH:mm');
      if (currentTime === '00:00') {
        setFajr(fajr + 1);
        setDhuhr(dhuhr + 1);
        setAsr(asr + 1);
        setMaghrib(maghrib + 1);
        setIsha(isha + 1);
        setWitr(witr + 1);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fajr, dhuhr, asr, maghrib, isha, witr]);

  const getTotalPrayersCountForDate = useMemo(() => {
    const counts = ldailyPrayerCounts[selectedDate] || {};
    return Object.values(counts).reduce((total, count) => total + count, 0);
  }, [ldailyPrayerCounts, selectedDate]);

  const renderDateItem = ({ item }) => {
    const isSelected = item === selectedDate;
    const isToday = item === today;
    const isFuture = moment(item).isAfter(today);
  
    const selectedPrayers = prayerStates[item] || {};
    const selectedCount = Object.values(selectedPrayers).filter(value => value).length;
    const circleColor = selectedCount === 0 ? 'black' :
                        selectedCount === 1 ? 'crimson' :
                        selectedCount === 2 ? 'red' :
                        selectedCount === 3 ? 'orange' :
                        selectedCount === 4 ? 'yellow' :
                        selectedCount === 5 ? 'lightgreen' :
                        selectedCount === 6 ? 'green' :
                        selectedCount === '#40916c';
                
    return (
      <TouchableOpacity
      onPress={() => handleDateSelect(item)}
      style={styles.dateItem}
      disabled={isFuture}
    >
      <View
        style={[
          styles.dateCircle,
          { backgroundColor: circleColor },
          isSelected && styles.selectedDateCircle,
          isFuture && styles.futureDateCircle,
        ]}
      >
        {isToday && <Text style={styles.todayLabel}>Today</Text>}
        <Text style={styles.dateText}>{moment(item).format('DD')}</Text>
        <Text style={styles.monthText}>{moment(item).format('MMM')}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  const goToProgress = () => {
    setDailyPrayerCounts(ldailyPrayerCounts);
    navigation.navigate('Progress');
  };

  const getMarkedDates = () => {
    const markedDates = {};
    Object.keys(prayerStates).forEach(date => {
      const selectedPrayers = prayerStates[date] || {};
      const selectedCount = Object.values(selectedPrayers).filter(value => value).length;
      const color = selectedCount === 0 ? 'black' :
                    selectedCount === 1 ? 'crimson' :
                    selectedCount === 2 ? 'red' :
                    selectedCount === 3 ? 'orange' :
                    selectedCount === 4 ? 'yellow' :
                    selectedCount === 5 ? 'lightgreen' :
                    selectedCount === 6 ? 'green' :
                    selectedCount === '#40916c';

      markedDates[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
          },
          text: {
            color: 'white',
          },
        },
      };
    });
    return markedDates;
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarBar}>
        <FlatList
          ref={flatListRef}
          data={generateDates()}
          renderItem={renderDateItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        />
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={styles.fullCalendarButton}
        >
          <Icon name="calendar" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Calendar
            current={today}
            onDayPress={(day) => {
              handleDateSelect(day.dateString);
              setIsModalVisible(false);
            }}
            markingType={'custom'}
            markedDates={getMarkedDates()}
            style={styles.calendar}
          />
          <TouchableOpacity
            onPress={() => setIsModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.chartContainer}>
        <View style={styles.salahButtonsContainer}>
          <Text style={styles.text}>Select the salah that you have prayed</Text>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', ...(madhab === 'Hanafi' ? ['witr'] : [])].map((prayer) => (
            <View key={prayer} style={styles.prayerWrapper}>
            <TouchableOpacity
              style={[styles.salahButton, prayerStates[selectedDate]?.[prayer] && styles.selectedSalahButton]}
              onPress={() => handlePrayerSelect(prayer)}
            >
              <Text style={[styles.salahButtonText, prayerStates[selectedDate]?.[prayer] && styles.selectedSalahButtonText]}>
                {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
              </Text>
              {prayerStates[selectedDate]?.[prayer] && (
                <View style={styles.counterContainer}>
                  <Text style={styles.addQadha}>Add Qadha</Text>
                  <TouchableOpacity
                    onPress={() => adjustCount(prayer, -1)}
                    style={[
                    styles.counterButtonN,
                    ldailyPrayerCounts[selectedDate]?.[prayer] === 0 && styles.disabledButton,
                    ]}
                    disabled={ldailyPrayerCounts[selectedDate]?.[prayer] === 0}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.prayerCount}>{ldailyPrayerCounts[selectedDate]?.[prayer]}</Text>
                  <TouchableOpacity onPress={() => adjustCount(prayer, 1)} style={styles.counterButtonP}>
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
            </View>
            ))}
        </View>
      </View>

      <View style={styles.totalContainer}>
        <TouchableOpacity onPress={() => { navigation.navigate('Home') }} style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>All Qadha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToProgress} style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>Progress</Text>
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
  calendarBar: {
    height: 110,
    backgroundColor: '#259591',
    flexDirection: 'row',
  },
  dateList: {
    alignItems: 'flex-end',
  },
  dateItem: {
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#fff',
  },
  dateCircle: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedDateCircle: {
    borderWidth: 2,
    borderColor: 'white'
  },
  futureDateCircle: {
    backgroundColor: '#ccc',
  },
  todayLabel: {
    position: 'absolute',
    top: -17,
    fontSize: 10,
    color: '#fff',
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
  },
  monthText: {
    color: '#fff',
    fontSize: 14,
  },
  chartContainer: {
    flex: 1,
    top: '5%',
  },
  salahButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    top: -15,
  },
  prayerWrapper: {
    marginBottom: 15,
    width: '90%',
  },
  salahButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 21,
    borderRadius: 15,
    backgroundColor: '#259591',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  selectedSalahButton: {
    backgroundColor: '#1A6866',
    padding: 15,
  },
  salahButtonText: {
    color: '#fff',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
  },
  selectedSalahButtonText: {
    color: '#fff',
    flex: 1,
    textAlign: 'left',
    left: '50%'
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#155553',
    padding: 5,
    borderRadius: 10,
    width: '35%',
    justifyContent: 'space-around',
  },
  counterButtonN: {
    backgroundColor: 'crimson',
    padding: 5,
    borderRadius: 5,
    width: '25%',
  },
  counterButtonP: {
    backgroundColor: '#52b788',
    padding: 5,
    borderRadius: 5,
    width: '25%',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  counterButtonText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  prayerCount: {
    fontSize: 20,
    color: '#ffffff',
  },
  text: {
    top: -10,
    fontSize: 20,
    color: '#E0F7F4',
  },
  addQadha: {
    position: 'absolute',
    color: '#fff',
    fontSize: 10,
    top: -13,
    left: 34,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginLeft: '10%',
    marginBottom: '10%',
  },
  bottomButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 21,
    borderRadius: 15,
    backgroundColor: '#259591',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
  fullCalendarButton: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1A6866',
    marginHorizontal: 7,
    bottom: -47,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    backgroundColor: '#40916c',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  calendar: {
    padding: 20,
  },
});

export default DailyChart;