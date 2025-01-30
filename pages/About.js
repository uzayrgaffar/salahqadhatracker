import React, { useContext } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { AppContext } from '../AppContext';

export const About = () => {
  
  const { selectedLanguage, gender, madhab } = useContext(AppContext);

  return (
      <View style={styles.container}>
        {/* <ImageBackground source={require('../assets/Masjid.jpg')} style={styles.imageBackground}> */}
            
            {selectedLanguage === 'English' ? <Text style={styles.title}>About Us</Text>
              : selectedLanguage === 'Arabic' ? <Text style={styles.title}>معلومات عنا</Text>
              : selectedLanguage === 'Urdu' ? <Text style={styles.title}>ہمارے بارے میں</Text>
              : selectedLanguage === 'Hindi' ? <Text style={styles.title}>हमारे बारे में</Text>
              : <Text style={styles.title}>About Us</Text>
            }
            
            
            {selectedLanguage === 'English' ? <Text style={styles.content}></Text>
              : selectedLanguage === 'Arabic' ? <Text style={styles.content}></Text>
              : selectedLanguage === 'Urdu' ? <Text style={styles.content}></Text>
              : selectedLanguage === 'Hindi' ? <Text style={styles.content}></Text>
              : <Text style={styles.content}></Text>
            }

        {/* </ImageBackground> */}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#66435a',
  },
  title: {
    fontSize: 70,
    marginBottom: 20,
    color: 'white',
  },
  content: {
    fontSize: 40,
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
    color: 'white',
  },
});

export default About;