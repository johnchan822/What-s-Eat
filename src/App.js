import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Slider from "@mui/material/Slider";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  MarkerF,
  DirectionsService,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import "./all.scss";
import { Wheel } from "react-custom-roulette";

import iconImage from "./img/icon.png";
import { SignTurnSlightLeft } from "react-bootstrap-icons";
import Tab from "./_parts/Tab";
import Item from "./_parts/Item";
import { isEmpty, getPhoto, countDistance, scrollIntoView } from "./methods";

function App() {
  const [currentPosition, setCurrentPosition] = useState({ lat: 0, lng: 0 });
  const [tempList, setTempList] = useState([]); // 暫時列表
  const [localList, setLocalList] = useState([]); // localList列表
  const [sliderValue, setSliderValue] = useState(1);
  const [isEnterView, setIsEnterView] = useState(false); //畫面預覽
  const [autocomplete, setAutocomplete] = useState(null);

  const [selectedRestaurant, setSelectedRestaurant] = useState({});
  const [directions, setDirections] = useState({});
  const [tab, setTab] = useState("historyTab");
  const [inputValue, setInputValue] = useState("");


  

  //輪盤動畫
  const [prizeNumber, setPrizeNumber] = useState(null); //
  const [isWheelShowText, setIsWheelShowText] = useState(false);
  const [isMustSpin, setIsMustSpin] = useState(false);
  const [nearbySearch, setNearbySearch] = useState([]);
  const mapElementRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
    language: "zh-TW",
  });

  const directionsServiceOptions = useMemo(() => {
    return {
      origin: currentPosition,
      destination: {
        lat: selectedRestaurant?.location?.lat,
        lng: selectedRestaurant?.location?.lng,
      },
      travelMode: "WALKING",
    };
  }, [currentPosition, selectedRestaurant]);

  const autocompleteOptions = {
    fields: ["address_components", "geometry", "name", "place_id"],
    types: ["restaurant", "food"],
    componentRestrictions: { country: "tw" },
    location: currentPosition,
    strictBounds: true,
    bounds: {
      north: currentPosition.lat + 0.008,
      south: currentPosition.lat - 0.008,
      east: currentPosition.lng + 0.008,
      west: currentPosition.lng - 0.008,
    },
  };

  //點選單一餐廳後會計算距離與更新，並將其點選餐廳列表填寫到tempList上面
  const tempListDistances = useCallback(() => {
    // directions要有值，(AB點距離都有值) selectedRestaurant.directions 為空值代表還沒被賦予距離
    if (
      !isEmpty(directions) &&
      isEmpty(selectedRestaurant?.directions) &&
      !isEmpty(selectedRestaurant)
    ) {
      const distanceNumber = directions.routes[0].legs[0].distance.text;
      const SelectedRestaurantDirections = {
        ...selectedRestaurant,
        directions: distanceNumber,
      };
      setSelectedRestaurant(SelectedRestaurantDirections);
      //寫入到tempList上面
      const isDuplicate = tempList.some(
        (item) => item.placeId === SelectedRestaurantDirections.placeId
      );
      if (!isDuplicate) {
        setTempList((prevTest) => {
          return [SelectedRestaurantDirections, ...prevTest];
        });
      }
    }
  }, [onPlaceChanged, setSelectedRestaurant, selectedRestaurant]);

  //距離篩選
  const filterLocalList = useMemo(() => {
    const newData = localList?.map((node) => {
      if (isEmpty(node.directions)) {
        return {};
      }
      const editDistance = Number(node.directions.split(" ")?.[0]);

      return {
        ...node,
        directionNumber: node.directions?.includes("公里")
          ? editDistance
          : editDistance / 1000,
      };
    });
    return newData?.filter((node) => {
      return node.directionNumber <= sliderValue;
    });
  }, [sliderValue, localList, currentPosition, setLocalList]);

  //輪盤資料
  const wheelData = useMemo(() => {
    return filterLocalList?.reduce((acc, node) => {
      let shortName = node.name;
      if (shortName.length > 5) {
        shortName = `${node.name.slice(0, 5) + "..."}`;
      }
      return [...acc, { option: shortName }];
    }, []);
  }, [filterLocalList, localList]);

  const localListNames = useMemo(() => {
    return localList.map((node) => node.name);
  }, [localList]);

  function getCurrentPosition() {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position?.coords;
      setCurrentPosition({ lat: latitude, lng: longitude });
    });
  }

  async function localListDistances() {
    let localList = JSON.parse(localStorage.getItem("myData")) || [];
    const promises = localList?.map(async (node) => {
      const directions = await countDistance(
        currentPosition?.lat,
        currentPosition?.lng,
        node.location?.lat,
        node.location?.lng
      );
      return {
        ...node,
        directions,
      };
    });
    const updatedLocalList = await Promise.all(promises);
    setLocalList(updatedLocalList);
    return updatedLocalList;
  }

  function onPlaceChanged() {
    const place = autocomplete?.getPlace();
    getPhoto(place?.place_id).then((imgUrl) => {
      const parseSelectedRestaurant = JSON.parse(
        JSON.stringify({
          location: place?.geometry?.location,
          placeId: place?.place_id,
          name: place?.name,
          img: imgUrl,
        })
      );
      setSelectedRestaurant(parseSelectedRestaurant);
    });
    setTab("historyTab");
    setInputValue("");
  }

  function handleSpinClick() {
    const newPrizeNumber = Math.floor(Math.random() * wheelData?.length);
    setPrizeNumber(newPrizeNumber);
    setTimeout(() => {
      setIsMustSpin(true);
    }, 100);
    setIsWheelShowText(false);
  }

  //先取得目前的座標
  useEffect(() => {
    getCurrentPosition();
  }, []);

  //將計算的距離回傳,預設畫面
  useEffect(() => {
    localListDistances();
    const timeoutId = setTimeout(() => {
      setIsEnterView(true);
    }, 1000);
    return () => {
      clearTimeout(timeoutId);
      setTab("historyTab");
    };
  }, [currentPosition]);

  //計算出tempListDistances 裡面的約多少公里的距離
  useEffect(() => {
    tempListDistances();
  }, [tempListDistances]);

  //使用，讓function被暫存起來，並且他又是一個callBack函數所以會帶著response值
  const directionsCallback = useCallback(
    (response) => {
      if (!isEmpty(response)) {
        setDirections(response);
      }
    },
    [setDirections]
  );

  return (
    isLoaded && (
      <>
        {isEnterView && !isEmpty(iconImage) && currentPosition.lat !== 0 ? (
          <div className={"overflow-hidden"}>
            <GoogleMap
              id="map"
              clickableIcons={false}
              ref={mapElementRef}
              className="relative"
              mapContainerStyle={{
                width: "100%",
                height: "75vh",
              }}
              center={currentPosition}
              zoom={16}
            >
              {/* 附近20間餐廳地點 */}
              <MarkerF position={currentPosition}></MarkerF>
              {!isEmpty(nearbySearch) &&
                nearbySearch.map((item, index) => {
                  const itemNameMore =
                    item.name.split("").length > 8
                      ? `${item.name.slice(0, 8) + "..."}`
                      : item.name;
                  return (
                    <Marker
                      key={index}
                      icon={{
                        url: "//",
                        scaledSize: new window.google.maps.Size(120, 50), // 寬度與高度
                      }}
                      position={{
                        lat: item.geometry.location.lat(),
                        lng: item.geometry.location.lng(),
                      }}
                      label={{
                        className: `rounded border-1  p-1  border-gray-950  cursor-pointer 
                            ${
                              localListNames.includes(item.name)
                                ? "bg-main"
                                : "bg-white"
                            }
                            ${
                              selectedRestaurant?.name === item?.name
                                ? "opacity-0"
                                : ""
                            }`,
                        backgroundColor: "red",
                        color: "black",
                        fontWeight: "bold",
                        text: itemNameMore,
                        fontSize: "14px",
                      }}
                      onClick={() => {
                        localListNames.includes(item.name)
                          ? setTab("favouriteTab")
                          : setTab("historyTab");
                        getPhoto(item.place_id).then((imgUrl) => {
                          setSelectedRestaurant({
                            location: {
                              lat: item.geometry.location.lat(),
                              lng: item.geometry.location.lng(),
                            },
                            placeId: item.place_id,
                            name: item.name,
                            img: imgUrl,
                          });
                        });
                        scrollIntoView(item.place_id);
                      }}
                    ></Marker>
                  );
                })}
              {!isEmpty(selectedRestaurant?.location) && (
                <>
                  {/* A-B點路線搜尋 */}
                  <DirectionsService
                    options={directionsServiceOptions}
                    callback={directionsCallback}
                  />

                  {/* B點渲染 */}
                  <DirectionsRenderer
                    options={{
                      directions: directions,
                    }}
                  />

                  {/* B點資訊 */}
                  <InfoWindow
                    position={selectedRestaurant?.location}
                    options={{
                      zIndex: 100,
                    }}
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant?.location?.lat},${selectedRestaurant?.location?.lng}&dir_action=walk`}
                      className="location text-[14px]"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <div className="text-center text-black">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--color-cyan)",
                            border: "1px solid black",
                          }}
                        >
                          <div className="p-1.5 text-[13px] font-bold flex">
                            <SignTurnSlightLeft size={16} className="mr-2" />{" "}
                            點選導航：約 {selectedRestaurant.directions}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div
                            style={{
                              backgroundImage: `url(${selectedRestaurant.img})`,
                              width: "220px",
                              height: "120px",
                              backgroundSize: "cover",
                              backgroundPosition: "center center",
                              borderLeft: "1px solid var(--color-black)",
                              borderRight: "1px solid var(--color-black)",
                            }}
                          ></div>
                          <div
                            className="p-1.5 text-[13px] font-bold"
                            style={{
                              backgroundColor: localList
                                .map((node) => node.name)
                                .includes(selectedRestaurant.name)
                                ? "var(--color-primary)"
                                : "",
                              border: "1px solid var(--color-black)",
                            }}
                          >
                            {selectedRestaurant?.name}
                          </div>
                        </div>
                      </div>
                    </a>
                  </InfoWindow>
                </>
              )}
              {/* 搜尋框 */}
              <Autocomplete
                onLoad={(autocomplete) => {
                  setAutocomplete(autocomplete);
                }}
                restrictions={{
                  country: "tw",
                }}
                options={autocompleteOptions}
                onPlaceChanged={onPlaceChanged}
              >
                <div
                  style={{
                    position: "absolute",
                    transform: "translate(-50%, -50%)",
                    top: "9%",
                    left: "50%",
                    width: "80vw",
                  }}
                >
                  <input
                    type="text"
                    className="h-10 w-100 searchInput p-3 mb-1 rounded-1"
                    placeholder="請搜尋附近的餐廳"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{
                      border: "1.5px var(--color-black) solid",
                      background: "white",
                      fontWeight: "bold",
                    }}
                  />
                  <div className="flex justify-between">
                    <div
                      className="bg-white px-3 py-1 rounded-1 text-[14px] cursor-pointer"
                      style={{
                        border: "1px black solid",
                        background: "white",
                        boxShadow: !isEmpty(nearbySearch)
                          ? "4px 4px rgba(0,0,0,0.9)"
                          : "",
                      }}
                      onClick={() => {
                        const service =
                          new window.google.maps.places.PlacesService(
                            document.createElement("div")
                          );
                        const request = {
                          location: {
                            lat: currentPosition.lat,
                            lng: currentPosition.lng,
                          },
                          radius: 950,
                          type: ["restaurant"],
                        };
                        service.nearbySearch(request, (results, status) => {
                          if (
                            status ===
                            window.google.maps.places.PlacesServiceStatus.OK
                          ) {
                            setNearbySearch(results);
                          }
                        });
                        setTab("historyTab");
                      }}
                    >
                      1KM 隨意搜尋好吃的
                    </div>

                    <div
                      className="p-1 rounded-1 text-[14px]"
                      style={{
                        border: "1px black solid",
                        background: "white",
                        zIndex: "100",
                      }}
                      onClick={() => {
                        setSelectedRestaurant({});
                        setDirections({});
                      }}
                    >
                      {" "}
                      清除{" "}
                    </div>
                  </div>
                </div>
              </Autocomplete>
            </GoogleMap>

            <div className="absolute w-100 fixed bottom-0">
              <div className="rounded-t-lg shadow-black">
                <div
                  className="bg-white pt-2"
                  style={{
                    borderTop: "1.2px black solid",
                  }}
                >
                  <div className="justify-between flex container-lg mb-3">
                    <div className="flex">
                      <Tab
                        tab={tab}
                        onSelected={setTab}
                        tabName={"historyTab"}
                      />
                      <Tab
                        tab={tab}
                        onSelected={setTab}
                        tabName={"favouriteTab"}
                      />
                    </div>
                    {!isEmpty(filterLocalList) && tab === "favouriteTab" && (
                      <div className="mr-2">
                        <Tab
                          tab={tab}
                          onSelected={setTab}
                          tabName={"randomTab"}
                          handleSpinClick={handleSpinClick}
                        />
                      </div>
                    )}
                  </div>

                  <div className="container-lg">
                    {
                      {
                        historyTab: (
                          <div
                            className="overflow-scroll"
                            style={{ height: "25vh" }}
                          >
                            <div className="h-100 w-100">
                              <div id="scrollTop"></div>
                              {!isEmpty(tempList) ? (
                                tempList?.map((node, index) => {
                                  return (
                                    <Item
                                      key={node.placeId}
                                      className="cursor-pointer"
                                      node={node}
                                      selectedRestaurant={selectedRestaurant}
                                      localList={localList}
                                      onSelected={setSelectedRestaurant}
                                      onSave={setLocalList}
                                      type={"Search"}
                                    />
                                  );
                                })
                              ) : (
                                <div
                                  className="font-bold"
                                  style={{
                                    textAlign: "center",
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    background: "white",
                                    color: "var(--color-black)",
                                  }}
                                >
                                  尚無搜尋紀錄
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                        favouriteTab: (
                          <div>
                            <div className="row mx-2 z-[30]">
                              <div className="col-2 font-bold text-[13px]">
                                <div className="col">距離</div>
                                <div className="col">
                                  {sliderValue >= 1
                                    ? `${sliderValue}KM`
                                    : `${sliderValue * 1000}M`}
                                </div>
                              </div>
                              <div className="col-10">
                                <Slider
                                  className="z-[10]"
                                  aria-label="Temperature"
                                  onChange={(e) => {
                                    setSliderValue(e.target.value);
                                  }}
                                  value={sliderValue}
                                  disabled={false}
                                  marks={false}
                                  max={1}
                                  step={0.2}
                                  min={0}
                                  valueLabelDisplay="auto"
                                  defaultValue={20}
                                />
                              </div>
                            </div>
                            <div
                              className="overflow-scroll"
                              style={{
                                height: "20vh",
                              }}
                            >
                              <div id="scrollTop"></div>
                              {!isEmpty(filterLocalList) ? (
                                filterLocalList?.map((node, index) => {
                                  return (
                                    <Item
                                      key={node.placeId}
                                      className="cursor-pointer"
                                      node={node}
                                      selectedRestaurant={selectedRestaurant}
                                      filterLocalList={filterLocalList}
                                      localList={localList}
                                      onSelected={setSelectedRestaurant}
                                      onSave={setLocalList}
                                      type={"Fav"}
                                    />
                                  );
                                })
                              ) : (
                                <div
                                  className="font-bold"
                                  style={{
                                    textAlign: "center",
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    background: "white",
                                    color: "var(--color-black)",
                                  }}
                                >
                                  尚無資料
                                </div>
                              )}
                            </div>
                          </div>
                        ),

                        randomTab: (
                          <div
                            className="fixed w-100 h-100 left-0 top-0 z-[99] flex justify-center items-center"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.9)",
                            }}
                          >
                            <div
                              className="relative"
                              style={{
                                marginTop: "auto",
                                marginBottom: "auto",
                              }}
                            >
                              {
                                <>
                                  <Wheel
                                    spinDuration={0.1}
                                    mustStartSpinning={isMustSpin}
                                    prizeNumber={prizeNumber}
                                    backgroundColors={
                                      wheelData?.length % 2 === 0
                                        ? ["#c7edf9", "#faf2c7"]
                                        : ["#c7edf9", "#e8dbf8", "#faf2c7"]
                                    }
                                    textColors={["black"]}
                                    innerRadius={4}
                                    innerBorderColor="black"
                                    innerBorderWidth={10}
                                    radiusLineWidth={0}
                                    outerBorderColor="white"
                                    outerBorderWidth={10}
                                    fontSize={18}
                                    data={wheelData}
                                    onStopSpinning={(value) => {
                                      localList.forEach((node) => {
                                        if (
                                          node.name.includes(
                                            wheelData[prizeNumber].option
                                              .split("...")
                                              .join("")
                                          )
                                        ) {
                                          setSelectedRestaurant(node);
                                          setIsWheelShowText(true);
                                          setTimeout(() => {
                                            setIsMustSpin(false);
                                            setTab("favouriteTab");
                                          }, 1000);
                                        }
                                      });
                                    }}
                                  />
                                  <button
                                    className="w-8 h-8  bg-white z-10 absolute font-bold rounded-full text-[11px]"
                                    style={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      boxShadow: "3px 3px rgba(0,0,0,0.8)",
                                    }}
                                    onClick={handleSpinClick}
                                  ></button>
                                </>
                              }
                            </div>
                            {isWheelShowText && (
                              <div
                                className="w-100 font-bold"
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  background: "var(--color-black)",
                                  borderTop: "2px white solid",
                                  borderBottom: "2px white solid",
                                  zIndex: 30,
                                  color: "white",
                                }}
                              >
                                <div className="text-center p-8">
                                  <div className="text-[16px] mb-4">
                                    你選到的餐廳是
                                  </div>
                                  <div className="text-[20px]">
                                    "{selectedRestaurant.name}"
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                      }[tab]
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-100 vh-100 font-bold relative">
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white",
              }}
            >
              <img
                src={iconImage}
                className="mb-4"
                style={{ width: "120px" }}
              />
              <div>ㄟ！到底吃什麼？</div>
            </div>
          </div>
        )}
      </>
    )
  );
}

export default React.memo(App);
