import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { AppContext } from '../AppContext';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

const Progress = () => {
  const navigation = useNavigation()
  const { dailyPrayerCounts, fajr, dhuhr, asr, maghrib, isha, witr } = useContext(AppContext);

  const totalPrayers = fajr + dhuhr + asr + maghrib + isha + witr

  const generateDates = () => {
    let dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
    }
    return dates.reverse();
  };

  const dates = generateDates();

  const getPrayerCounts = () => {
    return dates.map(date => {
      const counts = dailyPrayerCounts[date] || { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 };
      return Object.values(counts).reduce((total, count) => total + count, 0);
    });
  };

  const prayerCounts = getPrayerCounts();
  const daysToFinish = (totalPrayers / (prayerCounts.reduce((sum, count) => sum + count, 0) / 14)).toFixed(0)

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>
      <LineChart
        data={{
          labels: dates.map(date => moment(date).format('DD')),
          datasets: [
            {
              data: prayerCounts,
              color: () => `rgba(255, 99, 71, 1)`, 
              strokeWidth: 2, 
            },
          ],
        }}
        width={screenWidth - 32} 
        height={280} 
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: 'white', 
          backgroundGradientFrom: 'white',
          backgroundGradientTo: 'white',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(67, 170, 139, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(67, 170, 139, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#00aaff', 
          },
          propsForBackgroundLines: {
            stroke: '#e0e0e0', 
            strokeDasharray: '', 
          },
          propsForHorizontalLabels: {
            fontSize: 12, 
          },
          propsForVerticalLabels: {
            fontSize: 12, 
          },
        }}
        bezier
        style={{
          marginVertical: 25,
          borderRadius: 16,
        }}
      />
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Summary:</Text>
        <Text style={styles.summaryText}>
          Total Qadha Prayed in the Last 14 Days: {prayerCounts.reduce((sum, count) => sum + count, 0)}
        </Text>
        <Text style={styles.summaryText}>
          Average Qadha Prayed per Day: {(prayerCounts.reduce((sum, count) => sum + count, 0) / 14).toFixed(2)}
        </Text>
        <Text style={styles.summaryText}>
          You will finish all your qadha in {daysToFinish} days, or {(daysToFinish/365).toFixed(2)} years
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>

        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#66435a', 
  },
  header: {
    top: 15,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
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
  summaryContainer: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    color: '#081C15',
    textAlign: 'center',
    marginVertical: 5,
  },
});

export default Progress;