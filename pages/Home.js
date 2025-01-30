import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Home = () => {
    const navigation = useNavigation()

    const { 
        fajr, setFajr,
        dhuhr, setDhuhr,
        asr, setAsr,
        maghrib, setMaghrib,
        isha, setIsha,
        witr, setWitr, madhab
    } = useContext(AppContext);

    const adjustCount = (prayer, amount) => {
        switch (prayer) {
            case 'fajr':
                if (fajr + amount >= 0) setFajr(fajr + amount);
                break;
            case 'dhuhr':
                if (dhuhr + amount >= 0) setDhuhr(dhuhr + amount);
                break;
            case 'asr':
                if (asr + amount >= 0) setAsr(asr + amount);
                break;
            case 'maghrib':
                if (maghrib + amount >= 0) setMaghrib(maghrib + amount);
                break;
            case 'isha':
                if (isha + amount >= 0) setIsha(isha + amount);
                break;
            case 'witr':
                if (witr + amount >= 0) setWitr(witr + amount);
                break;
        }
    };

    const PrayerBox = ({ name, count, onIncrement, onDecrement }) => (
        <View style={styles.prayerBox}>
            <Text style={styles.prayerName}>{name}</Text>
            <View style={styles.countContainer}>
                <TouchableOpacity onPress={onDecrement} style={styles.button}>
                    <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.prayerCount}>{count}</Text>
                <TouchableOpacity onPress={onIncrement} style={styles.button}>
                    <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#E0F7F4" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Qadha</Text>
            </View>

            <View style={styles.row}>
                <PrayerBox
                    name="Fajr"
                    count={fajr}
                    onIncrement={() => adjustCount('fajr', 1)}
                    onDecrement={() => adjustCount('fajr', -1)}
                />
                <PrayerBox
                    name="Dhuhr"
                    count={dhuhr}
                    onIncrement={() => adjustCount('dhuhr', 1)}
                    onDecrement={() => adjustCount('dhuhr', -1)}
                />
            </View>
            <View style={styles.row}>
                <PrayerBox
                    name="Asr"
                    count={asr}
                    onIncrement={() => adjustCount('asr', 1)}
                    onDecrement={() => adjustCount('asr', -1)}
                />
                <PrayerBox
                    name="Maghrib"
                    count={maghrib}
                    onIncrement={() => adjustCount('maghrib', 1)}
                    onDecrement={() => adjustCount('maghrib', -1)}
                />
            </View>
            <View style={styles.row}>
                <PrayerBox
                    name="Isha"
                    count={isha}
                    onIncrement={() => adjustCount('isha', 1)}
                    onDecrement={() => adjustCount('isha', -1)}
                />
                {madhab === "Hanafi" && (
                    <PrayerBox
                        name="Witr"
                        count={witr}
                        onIncrement={() => adjustCount('witr', 1)}
                        onDecrement={() => adjustCount('witr', -1)}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#66435a',
        alignItems: 'center',
        justifyContent: 'center',
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
    },
    prayerBox: {
        backgroundColor: '#E0F7F4',
        padding: 20,
        margin: 10,
        borderRadius: 10,
        alignItems: 'center',
        width: '40%',
    },
    prayerName: {
        fontSize: 24,
        marginBottom: 10,
        textAlign: 'center',
    },
    countContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prayerCount: {
        fontSize: 24,
        marginHorizontal: 20,
    },
    button: {
        backgroundColor: '#259591',
        padding: 7,
        borderRadius: 5,
    },
    buttonText: {
        fontSize: 20,
        color: '#ffffff',
        textAlign: 'center',
        padding: 2
    },
});

export default Home;