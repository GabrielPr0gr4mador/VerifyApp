import {Text, View, StyleSheet, SafeAreaView} from "react-native"
import { useCameraDevice, useCameraPermission} from "react-native-vision-camera"
import { Camera as VisionCamera } from "react-native-vision-camera"
import { useIsFocused} from "@react-navigation/native"
import { useRef, useState } from "react"
import { Image, Alert } from "react-native"
import { PermissionsAndroid, Platform } from "react-native"
import RNFS from "react-native-fs"
import RNFetchBlob from 'react-native-blob-util';

import { PermissionsPage } from "../../components/PermissionPage"
import { NoCamDevice } from "../../components/NoCam"
import { useAppState } from "../../hooks/UseAppState"

import { styles } from "./style"
import { CamBtn } from "../../components/CamBtn"
import { CameraRoll, SaveToCameraRollOptions } from "@react-native-camera-roll/camera-roll"





export function CameraApp(){
    const device = useCameraDevice("back");
    const { hasPermission } = useCameraPermission();
    const isFocused = useIsFocused()
    const appState = useAppState()
    const isActive = isFocused && appState === "active"
    const camera = useRef<VisionCamera>(null)
    const [lastPhotoPath, setLastPhotoPath] = useState<string | null>(null)

    async function hasAndroidPermission(){
        const getCheckPermissionPromisse = () => {
            //@ts-ignore//
                if (Platform.Version >= 33){
                    return Promise.all([
                        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
                        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
                    ]).then(
                        ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) => 
                            hasReadMediaImagesPermission && hasReadMediaVideoPermission,
                    ); 
                } else {
                    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                }
            
        }

            const hasPermission = await getCheckPermissionPromisse();
                if (hasPermission) {
                    console.log("Permissão concedida")
                    return true;
                }

                const getRequestPermissionPromise = () => {
                    //@ts-ignore//
                        if (Platform.Version >= 33){
                            return PermissionsAndroid.requestMultiple([
                                PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                                PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                            ]).then(
                                (statuses) =>
                                    statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
                                PermissionsAndroid.RESULTS.GRANTED &&
                                statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
                                PermissionsAndroid.RESULTS.GRANTED,
                            );
                        } else {
                            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE)
                            .then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
                        }
                    
                };
                return await getRequestPermissionPromise();
            
                
            }

            async function sendPhotoToBackend(photoUri: string){
               try {
                const formData = new FormData();
                formData.append("image",{
                    uri: photoUri,
                    type: "image/jpeg",
                    name: "photo.jpg",
                });

                const response = await fetch("http://192.168.1.110:3000/sign-image", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok){
                    throw new Error("Imagem não enviada para ser assinada");
                }
               
                const signedImage = await response.blob();
                console.log ("Imagem assinada recebida com sucesso");
                return signedImage;
            } catch (error) {
                console.error("Erro ao enviar imagem para o backEnd");
                Alert.alert("Erro", "Falha na tentativa de assinar imagem");
                return null;
            }

        }

    const saveToGallery = async (signedImage: Blob) => {
        try {
            console.log("Iniciando Salvamento");

            const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {

                    // Lê a imagem como string e separa com split pela vírgula
                    // Separa o tipo de dado, encoding e dados: exemplo data:[mediatype];base64,[dados]
                    // Pegamos apenas o índice 1 que é a base64 pura
                    //O data URI tem formato data:tipo;base64,dados
                    const base64String = (reader.result as string).split(",")[1];
                    console.log("Fez a leitura com sucesso");

                    const timeStamp = new Date().getTime();
                    const fileName = `verifyapp_signed_${timeStamp}.jpg`;
                    //saveAsset não aceita URI tem que salvar um arquivo temporário
                    const tempFilePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                    await RNFS.writeFile(tempFilePath, base64String, "base64");
                    console.log ("Arquivo temporário criado");
                    
                    const result = await CameraRoll.saveAsset(tempFilePath, {
                        type: "photo",
                        album: "VerifyApp"
                    });
                    console.log("CameraRoll Funcionou");

                     try {
                        await RNFS.unlink(tempFilePath);
                        console.log("Arquivo temporário removido");
                    } catch (cleanupError) {
                        console.log("Erro ao limpar arquivo temporário:", cleanupError);
                    }
                    
                    Alert.alert(
                        "Sucesso",
                        "Foto autenticada salva com sucesso!",
                        [{text: "OK"}]
                    );
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;

            reader.readAsDataURL(signedImage);
        });
        
    } catch (error) {
        console.error("Erro ao salvar imagem assinada:", error);
        Alert.alert("Erro", "Erro ao salvar imagem autenticada!");
    }
}

    const takePhoto = async () => {
    try {
        const photo = await camera.current?.takePhoto({
            flash: "auto"
        });
        
        if (photo?.path){
            console.log("Path original da foto:", photo.path);
            const photoUri = Platform.OS === 'android' ? 'file://' + photo.path : photo.path;
            console.log("PhotoUri para exibição:", photoUri); 
            setLastPhotoPath(photoUri);
            
            const pathToSave = photo.path;
            console.log("Path para salvar:", pathToSave);

            console.log("Tentando salvar foto:", photoUri);
            // Verifica E solicita permissão se necessário
            
                const permissionToCam = await hasAndroidPermission();
                if (!permissionToCam) {
                    Alert.alert("Permissão negada", "Não foi possível salvar a foto na galeria");
                    return;
                }

            const signedImage = await sendPhotoToBackend(photoUri)
            
            if (signedImage){
            await saveToGallery(signedImage);
            console.log("Foto final salva com sucesso");
        }
        }

    } catch (error) {
        console.error("Error ao tirar foto", error);
        Alert.alert("Erro", "Não foi possível tirar a foto", [{text: "OK"}])
      }
    }

    if (!hasPermission) return <PermissionsPage />
    if (device == null) return <NoCamDevice />

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: "black"}}>
        <VisionCamera isActive={isActive}
        style={styles.camera}
        device={device}
        ref={camera}
        photo={true}
        />
        <CamBtn onPress={takePhoto}/>
        {lastPhotoPath && (
            <Image
            source={{uri: lastPhotoPath}}
            style={{ width: "100%", height: "100%", position: 'absolute'}} 
            />
        )}
        </SafeAreaView>
    )
}
