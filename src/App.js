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
import Item from "./_parts/Item";
import  { isEmpty, removeDuplicates, getPhoto, getDistance ,countDistance }  from "./methods";
import { useAppState } from "./useAppState"; // 引入狀態管理
import zIndex from '@mui/material/styles/zIndex';

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
    setOpeningScreen,
  } = useAppState();

  const [searchList, setSearchList] = useState([]);

  const  onPlaceChanged = () => {
    const place = autocomplete?.getPlace();
    getPhoto(place?.place_id).then((imgUrl) =>{
          //這邊不能直接賦予值，需要使用parse轉換
          const copySelectedRestaurant = JSON.parse(
            JSON.stringify({
              location: place?.geometry?.location,
              placeId:place?.place_id,
              name:place?.name,
              img:imgUrl,
            })
          );
          setSelectedRestaurant(copySelectedRestaurant)
      })
      setTab('history')
      setInputValue('');
  };

  const onLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
    autocompleteRef.current = autocomplete;
  };


  //初始畫面
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
    if (!isEmpty(directions) && isEmpty(selectedRestaurant.directions) && !isEmpty(selectedRestaurant)) {
      const distanceText = directions.routes[0].legs[0].distance.text

      const updatedSelectedRestaurant = {
        ...selectedRestaurant,
        directions: distanceText,
      };
      
        // 检查 updatedSelected
        // Restaurant 是否已经存在
        const isDuplicate = tempList.some(item => item.placeId === updatedSelectedRestaurant.placeId)
        setSelectedRestaurant(updatedSelectedRestaurant);
        if (!isDuplicate) {
          setTempList(prevTest => {
            return [updatedSelectedRestaurant, ...prevTest];
          });
        }
    }
}, [onPlaceChanged,setSelectedRestaurant ,selectedRestaurant]);


function scrollIntoView (scrollToId){
    const element = document.getElementById(scrollToId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }else{
      const element = document.getElementById('scrollTop');
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

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
        newData.push({ ...node, directions: result });
      }
      setLocalList(newData);
  };
  calculateDistances()

 },[currentPosition])

  const bounds = useMemo(()=>{
    return { 
      'north': currentPosition.lat + 0.008,
      'south': currentPosition.lat - 0.008,
      'east': currentPosition.lng + 0.008,
      'west': currentPosition.lng - 0.008
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
    types: ["restaurant",'food'],
    componentRestrictions: { country: "tw" },
    location: currentPosition,
    strictBounds: true,
    'bounds':bounds
  };

  //距離篩選
   let filterLocalList = useMemo(()=>{
    const newData = localList?.map((node)=>{
    if(isEmpty(node.directions)){
      return []
    }
    const  editDistance =  Number(node.directions.split(' ')?.[0] )
    return ({
            ...node,
            directionNumber : node.directions.includes('公里') ? editDistance :  editDistance / 1000 })
    })

    return newData?.filter((node)=>{ return node.directionNumber <= sliderValue })

  },[sliderValue,localList,currentPosition,setLocalList])

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
    { (openingScreen &&  !isEmpty(iconImage))
      ? <div className={'overflow-hidden'}>
        <GoogleMap
          id="map"
          ref={mapElementRef}
          clickableIcons={false}
          className="relative"
          mapContainerStyle={{
            width: '100%',
            height: '75vh'
          }}
          center={currentPosition}
          zoom={16}>   
          <MarkerF position={currentPosition}></MarkerF>
          { 
              !isEmpty(searchList) &&
              searchList.map((item)=>{
                const localListNames = localList.map((node)=>node.name)
                const itemNameSplit =   item.name.split('').length > 8  ? item.name.slice(0, 8)+'...' :  item.name ;
                
                return  <Marker
                key={item.id}
                icon={{
                  url: '/',
                  scaledSize: new window.google.maps.Size(120, 50) // 寬度與高度
                }}

                position={{ lat: item.geometry.location.lat(), lng: item.geometry.location.lng() }}
                label={{
                className: `rounded border-1  p-1  border-gray-950  cursor-pointer 
                ${ selectedRestaurant?.name == item?.name ? 'opacity-0' :''}
                ${  localListNames.includes(item.name) ?  'bg-main' :'bg-white' }`,
                color: 'black', 
                fontWeight: 'bold',
                text: itemNameSplit,
                fontSize:'14px'}}

              onClick={()=>{
                localListNames.includes(item.name) ?  setTab('favourite') : setTab('history') 
                getPhoto(item.place_id).then((imgUrl)=>{
                  setSelectedRestaurant({
                    location:{ lat: item.geometry.location.lat(), lng: item.geometry.location.lng() },
                    placeId:item.place_id,
                    name:item.name,
                    img:imgUrl,
                  })
                })
                scrollIntoView(item.place_id);
               
              }}>
              </Marker>
            })
          }
        { 
          !isEmpty(selectedRestaurant?.location) &&
          <>
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
                <div className="flex items-center justify-center"
                 style={{
                  backgroundColor: "#e8dbf8",
                  border: '1px solid black',
                  }}>
                  <div className="p-1.5 text-[13px] font-bold flex">
                    <SignTurnSlightLeft size={16} className='mr-2'/> 點選導航：約 {selectedRestaurant.directions}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div style={{
                    backgroundImage: `url(${(selectedRestaurant.img)})`,
                    width:'220px',
                    height: '120px',
                    backgroundSize: 'cover',
                    backgroundPosition:'center center',
                    borderLeft: '1px solid black',
                    borderRight:'1px solid black',
                  }}>
                  </div>
                  <div className="p-1.5 text-[13px] font-bold" style={{
                    backgroundColor: localList.map((node)=>node.name).includes(selectedRestaurant.name) ? '#faf2c7': '',
                    border: '1px solid black',
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
              top:'9%',
              left: '50%',
              width: '80vw',
          }}>
              <input
                type="text"
                className="h-10 w-100 searchInput p-3 mb-1 rounded-1"
                placeholder="請搜尋附近的餐廳"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                    "border": "1.5px #181818 solid",
                    "background":'white',
                    "fontWeight": 'bold'
                }}
              />


              <div className="flex justify-between">
                <div className="bg-white px-3 py-1 rounded-1 text-[14px]"
                style={{
                  "border": "1px black solid" ,
                  "background": 'white',
                  "boxShadow": !isEmpty(searchList)? '4px 4px rgba(0,0,0,0.9)' :''
                }} 
                onClick={()=>{
                  const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                  const request = {
                    location: { lat: currentPosition.lat, lng: currentPosition.lng }, 
                    radius: 950, 
                    type: ['restaurant'],
                  };
                  service.nearbySearch(request, (results, status) => {
                    if (status ===  window.google.maps.places.PlacesServiceStatus.OK) {
                      setSearchList(results)
                    }
                  });
                  setTab('history')
                }}>1KM 附近好吃的</div>

                <div  className="p-1 rounded-1 text-[14px]"
                style={{
                  "border": "1px black solid" ,
                  "background": 'white',
                  "zIndex":'100'
                }} 
                onClick={()=>{
                  setSearchList([])
                  setSelectedRestaurant({})
                }}> 清除
                </div>
              </div>
          </div>
        </Autocomplete>

      </GoogleMap>
      <div>
      </div>
        <div className="absolute w-100 fixed bottom-0">
            <div className="rounded-t-lg shadow-black">
                <div className="bg-white pt-2"style={{
                  "borderTop":  "1.2px black solid",
                }}>
                <div className="justify-between flex container-lg mb-3">
                  <div className="flex">
                  <Tab
                  tab={tab}
                  setTab={setTab}
                  tabName ={'history'}/>

                  <Tab
                  tab={tab}
                  setTab={setTab}
                  tabName ={'favourite'}/>
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
                    <div 
                    className="overflow-scroll"
                    style={{
                      height: '25vh',
                    }}>
                      <div className="h-100 w-100">
                         <div id="scrollTop"></div>
                          {
                            !isEmpty(tempList) ? 
                              tempList?.map((node,index)=>{
                                  return (
                                  <Item
                                  key={node.placeId}
                                  className="cursor-pointer"
                                  node={node}
                                  selectedRestaurant={selectedRestaurant}
                                  setSelectedRestaurant={setSelectedRestaurant}
                                  localList={localList}
                                  setLocalList={setLocalList}
                                  type={'Search'}/>)
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
                    </div>,
                    'favourite': <div>
                          <div className="row mx-2"
                          style={{
                            zIndex:30
                          }}>
                              <div className="col-2 font-bold text-[13px]">
                              <div className="col">距離</div>
                              <div className="col">{ sliderValue >=1 ?`${sliderValue}KM`:`${sliderValue *1000}M`}</div>
                            </div>
                            <div className="col-10">
                              <Slider
                               style={{
                                zIndex:10
                              }}
                              aria-label="Temperature"
                              onChange={(e)=>{
                                setSliderValue(e.target.value)
                              }}
                              value={sliderValue}
                              disabled={false}
                              marks={false}
                              max={1}
                              step={0.2}
                              min={0}
                              valueLabelDisplay="auto"
                              defaultValue={20}/>
                            </div>
                          </div>
                          <div className="overflow-scroll"
                           style={{
                            height: '20vh',
                          }}>
                              <div id="scrollTop"></div>
                                {
                                  !isEmpty(filterLocalList)?
                                  filterLocalList?.map((node,index)=>{
                                    return(
                                        <Item 
                                        key={index}
                                        node={node}
                                        selectedRestaurant={selectedRestaurant}
                                        setSelectedRestaurant= {setSelectedRestaurant}
                                        filterLocalList={filterLocalList}
                                        setLocalList={setLocalList}
                                        type={'fav'}
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
          }} >
            <img src={iconImage} className="mb-4"
            style={{
              width:"120px"
            }}/>
            <div>ㄟ！到底吃什麼？</div>
            </div>
        </div>
      }
  </>
  )
}



export default React.memo(MyComponent)
