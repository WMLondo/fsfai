import { StyleSheet, Text, View } from "react-native";

export const HomePage = () => {
  return (
    <View style={styles.container}>
      <Text>{{appName}}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
