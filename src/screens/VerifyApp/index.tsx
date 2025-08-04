import {Text, View, SafeAreaView, Alert} from "react-native"
import React from "react";

import * as MediaLibrary from 'expo-media-library';

import RNFS from 'react-native-fs';



import {styles} from "./style"
import { MyButton } from "../../components/Button"



export function Verify() {
    console.log('Componente Verify montado!');
    const [loading, setLoading] = React.useState<boolean>(false);

    async function sendPhotoToBackend(){
        try {
            setLoading(true)

            const { assets } = await MediaLibrary.getAssetsAsync({
                mediaType: "photo",
                sortBy: ['creationTime'],
                first: 1
            });

             if (assets.length === 0) {
            Alert.alert('Galeria vazia', 'Nenhuma imagem encontrada');
            return;
           }

           const imageUri = assets[0].uri;

           const base64Data = await RNFS.readFile(imageUri, "base64");

           const response = await fetch("http://192.168.1.110:3000/verify", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64: base64Data }),
           });

           if (!response.ok) throw new Error("Falha na verificação");

           const result = await response.json();
           console.log("Resultado:", result);
           Alert.alert("Sucesso!", "Imagem verificada com sucesso");
        } catch (err) {
            console.error("Erro: ", err);
            Alert.alert("Erro", "Falha ao processar imagem");
        } finally {
            setLoading(false);
        }
    }
                 
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.button}>
                <MyButton 
                    title={loading ? "Verificando..." : "Selecionar Imagem"} 
                    onPress={sendPhotoToBackend}
                />
            </View>       
        </SafeAreaView>
    )
}
