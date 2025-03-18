// import React, { useContext, useState } from "react"
// import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native"
// import { AppContext } from "../AppContext"

// const SelectLanguage = ({ navigation }) => {
//   const { setSelectedLanguage } = useContext(AppContext)
//   const [localSelectedLanguage, setLocalSelectedLanguage] = useState(null)

//   const confirmLanguage = () => {
//     if (localSelectedLanguage) {
//       setSelectedLanguage(localSelectedLanguage)
//       navigation.navigate("Login")
//     }
//   }

//   const getLanguageText = (language) => {
//     switch (language) {
//       case "English":
//         return [
//           <Text key="title" style={styles.title}>
//             Qadha App
//           </Text>,
//           <Text key="text" style={styles.text}>
//             Select a language:
//           </Text>,
//         ]
//       case "Arabic":
//         return [
//           <Text key="title" style={styles.title}>
//             تطبيق قدها
//           </Text>,
//           <Text key="text" style={styles.text}>
//             اختر لغة:
//           </Text>,
//         ]
//       case "Urdu":
//         return [
//           <Text key="title" style={styles.titleUrdu}>
//             قضا کی درخواست
//           </Text>,
//           <Text key="text" style={styles.text}>
//             ایک زبان منتخب کریں:
//           </Text>,
//         ]
//       case "Hindi":
//         return [
//           <Text key="title" style={styles.title}>
//             कदा आवेदन
//           </Text>,
//           <Text key="text" style={styles.text}>
//             भाषा चुनें:
//           </Text>,
//         ]
//       default:
//         return [
//           <Text key="title" style={styles.title}>
//             Qadha App
//           </Text>,
//           <Text key="text" style={styles.text}>
//             Select a language:
//           </Text>,
//         ]
//     }
//   }

//   return (
//     <View style={styles.container}>
//       {getLanguageText(localSelectedLanguage)}

//       <TouchableOpacity
//         activeOpacity={1}
//         onPress={() => setLocalSelectedLanguage("English")}
//         style={[styles.button, localSelectedLanguage === "English" && styles.selectedButton]}
//       >
//         <Image source={require("../assets/UK.webp")} style={styles.flag} />
//         <Text style={[styles.buttonText, localSelectedLanguage === "English" && styles.selectedButtonText]}>
//           English
//         </Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         activeOpacity={1}
//         onPress={() => setLocalSelectedLanguage("Arabic")}
//         style={[styles.button, localSelectedLanguage === "Arabic" && styles.selectedButton]}
//       >
//         <Image source={require("../assets/Saudi.webp")} style={styles.flag} />
//         <Text style={[styles.buttonText, localSelectedLanguage === "Arabic" && styles.selectedButtonText]}>عربي</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         activeOpacity={1}
//         onPress={() => setLocalSelectedLanguage("Urdu")}
//         style={[styles.button, localSelectedLanguage === "Urdu" && styles.selectedButton]}
//       >
//         <Image source={require("../assets/Pakistan.png")} style={styles.flag} />
//         <Text style={[styles.buttonText, localSelectedLanguage === "Urdu" && styles.selectedButtonText]}>اردو</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         activeOpacity={1}
//         onPress={() => setLocalSelectedLanguage("Hindi")}
//         style={[styles.button, localSelectedLanguage === "Hindi" && styles.selectedButton]}
//       >
//         <Image source={require("../assets/India.png")} style={styles.flag} />
//         <Text style={[styles.buttonText, localSelectedLanguage === "Hindi" && styles.selectedButtonText]}>हिंदी</Text>
//       </TouchableOpacity>

//       <View style={styles.bottomContainer}>
//         {localSelectedLanguage && (
//           <TouchableOpacity
//             activeOpacity={0.8}
//             onPress={confirmLanguage}
//             style={[styles.confirmButton, styles.activeConfirmButton]}
//           >
//             {localSelectedLanguage === "English" ? (
//               <Text style={styles.confirmButtonText}>Confirm</Text>
//             ) : localSelectedLanguage === "Arabic" ? (
//               <Text style={styles.confirmButtonText}>يتأكد</Text>
//             ) : localSelectedLanguage === "Urdu" ? (
//               <Text style={styles.confirmButtonText}>تصدیق کریں</Text>
//             ) : localSelectedLanguage === "Hindi" ? (
//               <Text style={styles.confirmButtonText}>पुष्टि करना</Text>
//             ) : (
//               <Text style={styles.confirmButtonText}>Confirm</Text>
//             )}
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     backgroundColor: "#5CB390",
//   },
//   title: {
//     color: "#EEEEEE",
//     fontSize: 70,
//     marginTop: "15%",
//     marginBottom: "15%",
//   },
//   titleUrdu: {
//     color: "#EEEEEE",
//     fontSize: 55,
//     marginTop: "15%",
//     marginBottom: "15%",
//   },
//   text: {
//     color: "#EEEEEE",
//     fontSize: 30,
//   },
//   flag: {
//     width: 55,
//     height: 40,
//     borderRadius: 12,
//   },
//   button: {
//     backgroundColor: "#EEEEEE",
//     padding: 10,
//     alignSelf: "center",
//     width: "85%",
//     margin: 17,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 5,
//     borderRadius: 12,
//   },
//   buttonText: {
//     flex: 1,
//     textAlign: "center",
//     color: "#4BD4A2",
//     fontSize: 30,
//   },
//   selectedButtonText: {
//     flex: 1,
//     textAlign: "center",
//     color: "#EEEEEE",
//     fontSize: 30,
//   },
//   selectedButton: {
//     backgroundColor: "#4BD4A2",
//   },
//   bottomContainer: {
//     position: "absolute",
//     bottom: 40,
//     width: "100%",
//     alignItems: "center",
//   },
//   confirmButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 40,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 5,
//   },
//   activeConfirmButton: {
//     backgroundColor: "#FBC742",
//     borderRadius: 12,
//   },
//   confirmButtonText: {
//     color: "#EEEEEE",
//     fontSize: 24,
//   },
// })

// export default SelectLanguage






import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const SelectLanguage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setTimeout(() => {
          navigation.replace("MainPages", { screen: "Daily Chart" });
        }, 500);
      }
      setLoading(false);
    });
  
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  
    return () => unsubscribe();
  }, [fadeAnim]);  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }  

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate('Login')}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>iQadha</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>Tap anywhere to continue</Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5CB390',
  },
  title: {
    color: '#EEEEEE',
    fontSize: 70,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#EEEEEE',
    fontSize: 24,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },  
});

export default SelectLanguage;
