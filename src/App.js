import React, { Component } from 'react';
import {useState, useEffect , useRef ,useMemo ,useCallback} from "react";
import Slider from "@mui/material/Slider";
import 'bootstrap/dist/css/bootstrap.min.css';
import { GoogleMap, useJsApiLoader, Marker , Autocomplete , MarkerF, DirectionsService, DirectionsRenderer , InfoWindow} from '@react-google-maps/api';
import { Wheel } from 'react-custom-roulette'

import './styles.scss'; // 导入您的Sass文件

import iconImage from './img/icon.png'; // 請確保路徑是正確的
import {SignTurnSlightLeft} from 'react-bootstrap-icons';
import Tab from "./_parts/Tab";
import SearchItem from "./_parts/SearchItem";
import FavouriteItem from "./_parts/FavouriteItem";
import  { isEmpty, removeDuplicates, getPhoto, getDistance ,countDistance}  from "./methods";
import { useAppState } from "./useAppState"; // 引入狀態管理

const libraries = ["places"];
function MyComponent() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries:libraries,
    language:"zh-TW"
  })
  const {
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
  } = useAppState();

  const  onPlaceChanged = () => {
    const place = autocomplete?.getPlace();
    getPhoto(place?.place_id).then((imgUrl) =>{
        if (!isEmpty(place)) {
          let selectedRestaurant = {
              location: place?.geometry?.location,
              placeId:place?.place_id,
              name:place?.name,
              img:imgUrl,
          }
          //這邊不能直接賦予值，需要使用parse轉換
          const copySelectedRestaurant = JSON.parse(JSON.stringify(selectedRestaurant));
          setSelectedRestaurant(copySelectedRestaurant)
        }
      })
      setTab('history')
      setInputValue('');
  };

  const onLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
    autocompleteRef.current = autocomplete;
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.log(error);
      }
    );
    setLocalList(JSON.parse(localStorage.getItem('myData')))
    const timeoutId = setTimeout(() => {
        setOpeningScreen(true)
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, []);


  useEffect(() => {
    // 確保只在有需要時才更新 selectedRestaurant.directions 為空值 但是 selectedRestaurant要有值
    if (isEmpty(selectedRestaurant.directions) && !isEmpty(selectedRestaurant)) {

      const handleDistanceCalculation = async () => {
        try {
          const result = await countDistance(
            currentPosition?.lat,
            currentPosition?.lng,
            selectedRestaurant.location?.lat,
            selectedRestaurant.location?.lng
          );
          const direction = parseFloat(result.toFixed(2));
          const updatedSelectedRestaurant = {
            ...selectedRestaurant,
            directions: direction,
          };
          setSelectedRestaurant(updatedSelectedRestaurant);
      
          setTempList(prevTest => {
            return removeDuplicates([{ ...updatedSelectedRestaurant }, ...prevTest]);
          });
        } catch (error) {
          console.error("Error calculating distance:", error);
        }
      };
      handleDistanceCalculation();
    }
}, [onPlaceChanged]);


//
useEffect(()=>{
  //取得資料後 再去算距離
   let localList = JSON.parse(localStorage.getItem('myData')) || []
   const calculateDistances = async () => {
      const newData = [];
      for (const node of localList) {
        const result = await countDistance(
          currentPosition?.lat,
          currentPosition?.lng,
          node.location?.lat,
          node.location?.lng
        );
        const direction = parseFloat(result.toFixed(2));
        newData.push({ ...node, directions: direction });
      }
      setLocalList(newData);
  };
  calculateDistances()

 },[])

  const bounds = useMemo(()=>{
    let delta = getDistance(2 ,currentPosition)
    return{ 
      east: currentPosition.lng + delta.lng,
      west: currentPosition.lng - delta.lng,
      south: currentPosition.lat - delta.lat,
      north: currentPosition.lat + delta.lat,
    }
   },[currentPosition])


  const directionsServiceOptions = useMemo(() => {
    return {
      origin: currentPosition,
      destination: {
        lat: selectedRestaurant?.location?.lat,
        lng: selectedRestaurant?.location?.lng,
      },
      travelMode: 'WALKING',
    };
  }, [currentPosition, selectedRestaurant]);
  
  const autocompleteOptions = {
    fields: ["address_components", "geometry", "name",'place_id'],
    types: ["restaurant"],
    componentRestrictions: { country: "tw" },
    location: currentPosition,
    strictBounds: true,
    'bounds':bounds
  };

  //距離篩選
  let filterLocalList = useMemo(()=>{
    if(isEmpty(localList)){
      return 
    }
    return localList?.filter((node)=> node.directions <= sliderValue)

  },[sliderValue,selectedRestaurant,localList])

  //輪盤資料
  let wheelData = useMemo(()=>{
    return filterLocalList?.reduce((acc,node)=>{
      let shortName = node.name
     if(node.name.length>5){
      shortName = node.name.slice(0, 5)+'...';
     }
      return [
            ...acc,
            {'option':shortName}
      ]
    },[])
  },[filterLocalList,localList])
 
  const directionsCallback = useCallback((response) => {
    if(!isEmpty(response)){
      setDirections(response);
    }
}, [setDirections]);


  const handleSpinClick = () => {
    const newPrizeNumber = Math.floor(Math.random() * wheelData?.length);
    setPrizeNumber(newPrizeNumber);
    setTimeout(()=>{
      setMustSpin(true);
    }) 
    setWheelShowText(false)
  };
  

  
  return (
    isLoaded &&
    <>
    { openingScreen 
      ? <div className={'overflow-hidden'}>
        <GoogleMap
          id="map"
          ref={mapElementRef}
          className="relative"
          mapContainerStyle={{
            width: '100%',
            height: '100vh'
          }}
          center={currentPosition}
          zoom={16}>   
          <MarkerF position={currentPosition}></MarkerF>
        { 
        
        !isEmpty(selectedRestaurant?.location?.lat) &&
          <>
            <MarkerF position={selectedRestaurant?.location}></MarkerF>
            <DirectionsService
              options={directionsServiceOptions}
              callback={directionsCallback}
            />
            <DirectionsRenderer
            options={{
              directions: directions,
            }}/>
            <InfoWindow position={selectedRestaurant?.location}
            options={{
              pixelOffset: { width: 0, height: -30 }, 
              zIndex: 100, 
            }}>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant?.location?.lat},${selectedRestaurant?.location?.lng}&dir_action=walk`}
            className="location text-[14px]"
            style={{
              "textDecoration": "none",
            }}>
              <div className="text-center text-black">
                <div className="flex items-center justify-center border"
                 style={{
                  "backgroundColor": "#e8dbf8"
                  }}>
                  <SignTurnSlightLeft size={20} className='mr-2'/>
                  <div className="my-2 text-[14px] font-bold">點選導航：約 {selectedRestaurant.directions}KM </div>
                </div>
                <div className="flex flex-col">
                  <img src={selectedRestaurant?.img} 
                  style={{
                    maxWidth: '100%',
                    height: '100px'
                  }}/>
                  <div className="font-bold p-2 text-[16px]" style={{
                    "backgroundColor":  tab === 'history' ?  '#c7edf9' :  '#faf2c7',
                  }}> 
                  {selectedRestaurant?.name}
                   </div>
                </div>
              </div>
            </a>
            </InfoWindow>
          </>
          }
        <Autocomplete
        onLoad={onLoad} 
        restrictions={{
          country: 'tw',
        }}
        options={autocompleteOptions}
        onPlaceChanged={onPlaceChanged}>
          <div style={{
              zIndex: '1',
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              top:'4%',
              left: '50%',
              width: '80vw',
          }}>
              <input
                type="text"
                className="h-10 w-100 searchInput p-3"
                placeholder="請搜尋附近的餐廳"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                    "border": "2px #181818 solid",
                    "background":'white',
                    "fontWeight": 'bold'
                }}
              />
          </div>
        </Autocomplete>
      </GoogleMap>
        <div className="absolute w-100 fixed bottom-0 overflow-hidden">
            <div className="rounded-t-lg shadow-black">
                <div className="bg-white pt-2"style={{
                  "borderTop":  "1.2px black solid",
                }}>
                <div className="justify-between  flex w-100">
                  <div className="flex">
                  <Tab
                  tab={tab}
                  setTab={setTab}
                  setSelectedRestaurant={setSelectedRestaurant}
                  tabName ={'history'}
                  />
                  <Tab
                  tab={tab}
                  setTab={setTab}
                  setSelectedRestaurant={setSelectedRestaurant}
                  tabName ={'favourite'}
                  />
                  </div>
                  {
                    (!isEmpty(filterLocalList)&&  tab === 'favourite') && 
                    <div className='mr-2'>
                      <Tab
                      tab={tab}
                      setTab={setTab}
                      tabName ={'random'}
                      handleSpinClick={handleSpinClick}/>
                    </div>
                  }
                </div>
                  <div className="container-lg">
                  {{          
                    'history': 
                    <div className="overflow-scroll px-2 mt-2"
                    style={{
                      height: '30vh'
                    }}>
                      <div className="p-2 h-100 w-100">
                        <div className="row p-2">
                          {
                            !isEmpty(tempList) ? 
                              tempList?.map((node,index)=>{
                                  return (
                                  <SearchItem
                                  key={node.placeId}
                                  className="cursor-pointer"
                                  node={node}
                                  selectedRestaurant={selectedRestaurant}
                                  setSelectedRestaurant={setSelectedRestaurant}
                                  localList={localList}
                                  setLocalList={setLocalList}
                                  />)
                                })
                                :<div className='font-bold'
                                style={{
                                "textAlign": "center",
                                "position":"absolute",
                                "top":'50%',
                                "left": '50%',
                                "transform": "translate(-50%, -50%)",
                                "background":  "white",
                                "color": "#181818"}}>尚無搜尋紀錄</div>
                          }
                          </div>
                        </div>
                    </div>,
                    'favourite': <div
                    style={{
                      height: '33vh'
                    }}>
                          <div className="row pt-2 mx-2">
                              <div className="col-2 font-bold text-[13px]">
                              <div className="col">距離</div>
                              <div className="col">{ sliderValue >=1 ?`${sliderValue}KM`:`${sliderValue *1000}M`}</div>
                            </div>
                            <div className="col-10">
                            <Slider
                              aria-label="Temperature"
                              onChange={(e)=>{
                                setSliderValue(e.target.value)
                              }}
                              value={sliderValue}
                              disabled={false}
                              marks={false}
                              max={2}
                              step={0.2}
                              min={0}
                              valueLabelDisplay="auto"
                              defaultValue={20}/>
                            </div>
                          </div>
                          <div className="overflow-scroll h-100">
                              <div className="row px-4">
                                {
                                  !isEmpty(filterLocalList)?
                                  filterLocalList?.map((node,index)=>{
                                    return(
                                        <FavouriteItem 
                                        key={index}
                                        node={node}
                                        selectedRestaurant={selectedRestaurant}
                                        setSelectedRestaurant= {setSelectedRestaurant}
                                        filterLocalList={filterLocalList}
                                        setLocalList={setLocalList}
                                    />)
                                  })
                                  : <div className='font-bold'
                                  style={{
                                  "text-align": "center",
                                  "position":"absolute",
                                  "top":'50%',
                                  "left": '50%',
                                  "transform": "translate(-50%, -50%)",
                                  "background":  "white",
                                  "color": "#181818"}}>尚無資料</div>
                                  }
                            </div>
                          </div>
                        </div>,
                    'random':<div className="fixed w-100 h-100 left-0 top-0 z-[99] flex"
                    style={{
                      "justifyContent": 'center',
                      "alignItems": 'flex-center',
                      "backgroundColor": '#000c',
                    }}>
                      <div className="relative"
                      style={{
                      "marginTop": 'auto',
                      "marginBottom": 'auto',
                      }}>
                      { <>
                          <Wheel
                          spinDuration={0.1}
                          mustStartSpinning={mustSpin}
                          prizeNumber={prizeNumber}
                          backgroundColors={wheelData?.length % 2 === 0 ?  ['#c7edf9' ,'#faf2c7']: ['#c7edf9', '#e8dbf8' ,'#faf2c7']}
                          textColors={['#181818']}
                          innerRadius={4}
                          innerBorderColor='black'
                          innerBorderWidth={10}
                          radiusLineWidth={0}
                          outerBorderColor='white'
                          outerBorderWidth={10}
                          fontSize={18}
                          data={wheelData}
                          onStopSpinning={(value) => {
                              localList.forEach((node)=>{
                                if(node.name.includes(wheelData[prizeNumber].option.split('...').join(''))){
                                  setSelectedRestaurant(node)
                                  setWheelShowText(true)
                                  setTimeout(()=>{
                                    setMustSpin(false);
                                    setTab('favourite')  
                                  },1000)
                                }
                              })
                          }}/>
                          <button
                          className="w-8 h-8  bg-white z-10 absolute font-bold rounded-full text-[11px]"
                          style={{
                            "position":"absolute",
                            "top":'50%',
                            "left": '50%',
                            "transform": "translate(-50%, -50%)",
                            "boxShadow" :'3px 3px rgba(0,0,0,0.8)'
                          }}
                          onClick={handleSpinClick}></button>
                        </>
                      }
                      </div>
                      {wheelShowText && 
                      <div className="w-100 font-bold"
                          style={{
                            "position":"absolute",
                            "top":'50%',
                            "left": '50%',
                            "transform": "translate(-50%, -50%)",
                            "background":  "#181818",
                            "borderTop": '2px white solid',
                            "borderBottom": '2px white solid',
                            "zIndex":30,
                            "color": "white"
                          }}>
                          <div className="text-center p-8">
                              <div className="text-[16px] mb-4">你選到的餐廳是</div>
                              <div className="text-[20px]">"{selectedRestaurant.name}"</div>
                          </div>
                      </div> 
                          }
                    </div>
                      }[tab]}
                  </div>
                </div>
            </div>
        </div>
      </div> 
      : <div className="w-100 vh-100 font-bold relative">
          <div  style={{
          "position":"absolute",
          "top":'50%',
          "left": '50%',
          "transform": "translate(-50%, -50%)",
          "background":  "white",
          "borderTop": '2px white solid',
          "borderBottom": '2px white solid',
          "zIndex":30,
          "color": "#181818"
          }} >
            <img src={iconImage} className="mb-4"
            style={{
              width:"120px"
            }}/>
            <div>ㄟ！到底吃什麼?</div>
            </div>
        </div>
      }
  </>
  )
}



export default React.memo(MyComponent)
