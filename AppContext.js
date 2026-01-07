import { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [gender, setGender] = useState(null);
  const [madhab, setMadhab] = useState(null);
  const [fajr, setFajr] = useState(null)
  const [dhuhr, setDhuhr] = useState(null)
  const [asr, setAsr] = useState(null)
  const [maghrib, setMaghrib] = useState(null)
  const [isha, setIsha] = useState(null)
  const [witr, setWitr] = useState(null)
  const [dob, setDob] = useState(null)
  const [dop, setDop] = useState(null)
  const [daysOfCycle, setDaysOfCycle] = useState(null)
  const [yearsMissed, setYearsMissed] = useState(null)
  const [dailyPrayerCounts, setDailyPrayerCounts] = useState({});
  const [numberOfChildren, setNumberOfChildren] = useState(null)
  const [pnb, setPNB] = useState(null)

  return (
    <AppContext.Provider value={{ selectedLanguage, setSelectedLanguage, gender, setGender, madhab, setMadhab, fajr, setFajr, dhuhr, setDhuhr, asr, setAsr, maghrib, setMaghrib, isha, setIsha, witr, setWitr, dob, setDob, dop, setDop, daysOfCycle, setDaysOfCycle, yearsMissed, setYearsMissed, dailyPrayerCounts, setDailyPrayerCounts, numberOfChildren, setNumberOfChildren, pnb, setPNB }}>
      {children}
    </AppContext.Provider>
  );
};