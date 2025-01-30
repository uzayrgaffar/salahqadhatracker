import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, LayoutAnimation, Platform, UIManager, ImageBackground } from 'react-native';
import { AppContext } from '../AppContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const { selectedLanguage, gender, madhab } = useContext(AppContext);

  const questionsEN = [
    { question: '1', answer: '1' },
    { question: '2', answer: '2' },
    { question: '3', answer: '3' },
    { question: '4', answer: '4' },
    { question: '5', answer: '5' },
    { question: '6', answer: '6' },
    { question: '7', answer: '7' },
    { question: '8', answer: '8' },
    { question: '9', answer: '9' },
    { question: '10', answer: '10' },
    { question: '11', answer: '11' },
    { question: '12', answer: '12' },
    { question: '13', answer: '13' },
    { question: '14', answer: '14' },
  ];

  const questionsAR = [
    { question: '١', answer: '١' },
    { question: '٢', answer: '٢' },
    { question: '٣', answer: '٣' },
    { question: '٤', answer: '٤' },
    { question: '٥', answer: '٥' },
    { question: '٦', answer: '٦' },
    { question: '٧', answer: '٧' },
    { question: '٨', answer: '٨' },
    { question: '٩', answer: '٩' },
    { question: '١٠', answer: '١٠' },
    { question: '١١', answer: '١١' },
    { question: '١٢', answer: '١٢' },
    { question: '١٣', answer: '١٣' },
    { question: '١٤', answer: '١٤' },
  ];

  const questionsUR = [
    { question: '١', answer: '١' },
    { question: '٢', answer: '٢' },
    { question: '٣', answer: '٣' },
    { question: '۴', answer: '۴' },
    { question: '٥', answer: '٥' },
    { question: '٦', answer: '٦' },
    { question: '۷', answer: '۷' },
    { question: '٨', answer: '٨' },
    { question: '٩', answer: '٩' },
    { question: '١٠', answer: '١٠' },
    { question: '١١', answer: '١١' },
    { question: '١٢', answer: '١٢' },
    { question: '١٣', answer: '١٣' },
    { question: '١۴', answer: '١۴' },
  ];

  const questionsHI = [
    { question: '१', answer: '१' },
    { question: '२', answer: '२' },
    { question: '३', answer: '३' },
    { question: '४', answer: '४' },
    { question: '५', answer: '५' },
    { question: '६', answer: '६' },
    { question: '७', answer: '७' },
    { question: '८', answer: '८' },
    { question: '९', answer: '९' },
    { question: '१०', answer: '१०' },
    { question: '११', answer: '११' },
    { question: '१२', answer: '१२' },
    { question: '१३', answer: '१३' },
    { question: '१४', answer: '१४' },
  ];

  const filteredQuestions = 
  selectedLanguage === 'English' ? questionsEN :
  selectedLanguage === 'Arabic' ? questionsAR :
  selectedLanguage === 'Urdu' ? questionsUR :
  selectedLanguage === 'Hindi' ? questionsHI :
  questionsEN;

  const filteredQuestionsResult = filteredQuestions.filter(q => q.question.toLowerCase().includes(searchQuery.toLowerCase())
);

  const handlePress = index => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    // <ImageBackground source={require('../assets/Masjid.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredQuestionsResult}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.questionWrapper}>
              <TouchableOpacity onPress={() => handlePress(index)} style={styles.questionContainer}>
                <Text style={styles.questionText}>{item.question}</Text>
              </TouchableOpacity>
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    // </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#66435a',
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 16,
    marginTop: 40,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  questionWrapper: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  questionContainer: {
    padding: 16,
    backgroundColor: '#259591',
    borderBottomWidth: 1,
    borderBottomColor: 'grey',
    borderRadius: 10,
  },
  questionText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  answerContainer: {
    padding: 16,
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  answerText: {
    fontSize: 20,
    color: '#081C15',
  },
  flatListContent: {
    paddingBottom: 40,
  },
});

export default Forum;