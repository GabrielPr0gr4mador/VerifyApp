import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useAppState(){
    const [appState, setappState] = useState<AppStateStatus>(AppState.currentState)

    useEffect(() => {
        const handleState = AppState.addEventListener("change", nextState => {
            setappState(nextState)
        })
      return () => {
        handleState.remove()
      };
    }, []);

    return appState;
}