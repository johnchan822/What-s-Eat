// 將狀態管理拆分成單獨的檔案 (state.js)
import { useState, useEffect, useRef, useCallback } from "react";

export function useAppState() {
  const [currentPosition, setCurrentPosition] = useState({ lat: 23.553118, lng: 121.0211024 });
  const [tempList, setTempList] = useState([]);
  const [localList, setLocalList] = useState([]);
  const [sliderValue,setSliderValue] = useState(1);
  const [openingScreen,setOpeningScreen] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState({});
  const [directions, setDirections] = useState({});
  const [tab , setTab] = useState('history');
  const [inputValue, setInputValue] = useState('');
  //option 
  const [prizeNumber, setPrizeNumber] = useState(0);

//輪盤動畫
  const [wheelShowText, setWheelShowText] = useState(false);
  const [mustSpin, setMustSpin] = useState(false);

  const autocompleteRef = useRef(null);
  const mapElementRef = useRef(null);


  return {
    currentPosition,
    setCurrentPosition,
    tempList,
    setTempList,
    localList,
    setLocalList,
    sliderValue,
    setSliderValue,
    selectedRestaurant,
    setSelectedRestaurant,
    tab,
    setTab,
    inputValue,
    setInputValue,
    prizeNumber,
    setPrizeNumber,
    wheelShowText,
    setWheelShowText,
    autocompleteRef,
    mapElementRef,
    mustSpin, 
    setMustSpin,
    autocomplete,
    setAutocomplete,
    directions,
    setDirections,
    openingScreen,
    setOpeningScreen
  };
}


