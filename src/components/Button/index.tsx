import { Text, StyleSheet, View, TouchableOpacity, SafeAreaView} from "react-native";

import { styles } from "./style"

type MyBtn = {
    title?: string,
    onPress?: () => void;
}

export function MyButton({title, onPress}: MyBtn){
  return (  
    <View>
        <TouchableOpacity style={styles.BtnStyle} onPress={onPress}>
            <Text style={styles.Text}>{title}</Text>
        </TouchableOpacity>
    </View>
    )
}