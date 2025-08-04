import { Text, View,} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

import {MyButton} from "../../components/Button"
import {styles} from "./style"

type StackParamList = {
    GetStarted: undefined,
    Home: undefined
}

export function GetStarted(){

    const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();

   return ( 
   <View style={styles.container}>
        <Text style={styles.text}>
            Verify!
        </Text>
        <Text style={styles.sub}>
            Never Trust
        </Text>
        <MyButton
        title="Get Started"
        onPress={() => navigation.navigate("Home")} 
        />
   </View>)
}