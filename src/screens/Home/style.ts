import { StyleSheet } from "react-native"

export const styles  = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "white",
    },
    band: {
        backgroundColor: "lightblue",
        width: "100%",
        height: 20,
        marginBottom: 20
    },
    textBand: {
        backgroundColor: "lightblue",
        width: "100%",
        height: 100,
        marginBottom: 100,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        color: "white",
        fontFamily: "Chewy",
        fontSize: 24
    },
    bottom: {
        backgroundColor: "lightblue",
        width: "100%",
        height: 100,
        justifyContent: "center",
        alignItems: "center"
    }
})