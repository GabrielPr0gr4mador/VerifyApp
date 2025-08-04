import { Text, View, TouchableOpacity} from "react-native";

import { styles } from "./style"

type MyBtn = {
    title?: string,
    onPress?: () => void;
}

export function CamBtn({onPress}: MyBtn){
  return (  
    <View>
        <TouchableOpacity style={styles.container} onPress={onPress}>
        </TouchableOpacity>
    </View>
    )
}