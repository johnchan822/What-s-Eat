import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    Autocomplete,
    MarkerF,
    DirectionsService,
    DirectionsRenderer,
    InfoWindow,
} from '@react-google-maps/api';
import './all.scss';
import { Wheel } from 'react-custom-roulette';

import iconImage from './img/icon.png';
import { SignTurnSlightLeft } from 'react-bootstrap-icons';
import Tab from './_parts/Tab';
import Item from './_parts/Item';
import { isEmpty, getPhoto, countDistance, scrollIntoView } from './methods';

function App() {
    const mapElementRef = useRef(null);
    const [state, setState] = useState({
        currentPosition: {
            lat: 0,
            lng: 0,
        },
        autocomplete: null,
        tab: 'historyTab',
        sliderValue: 1,
        selectedRestaurant: {},
        tempList: [],
        localList: [],
        directions: {},
        directionsText: '',
        inputValue: '',
        nearbySearch: [],
        isWheelShowText: false,
        isMustSpin: false,
        isEnterView: false, //畫面預覽
        prizeNumber: null,
    });

    function updateState(newState) {
        setState(prevState => {
            return {
                ...prevState,
                ...newState,
            };
        });
    }

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
        language: 'zh-TW',
    });
    //A-B距離參數設定
    const directionsServiceOptions = useMemo(() => {
        return {
            origin: state.currentPosition,
            destination: {
                lat: state.selectedRestaurant?.location?.lat,
                lng: state.selectedRestaurant?.location?.lng,
            },
            travelMode: 'WALKING',
        };
    }, [state.currentPosition, state.selectedRestaurant]);
    //下拉搜尋參數設定
    const autocompleteOptions = {
        fields: ['address_components', 'geometry', 'name', 'place_id'],
        types: ['restaurant', 'food'],
        componentRestrictions: { country: 'tw' },
        location: state.currentPosition,
        strictBounds: true,
        bounds: {
            north: state.currentPosition.lat + 0.008,
            south: state.currentPosition.lat - 0.008,
            east: state.currentPosition.lng + 0.008,
            west: state.currentPosition.lng - 0.008,
        },
    };

    //FavTab距離篩選
    const filterLocalList = useMemo(() => {
        return state?.localList
            ?.map(node => {
                if (isEmpty(node.directions)) {
                    return {};
                }
                const editDistance = Number(node.directions.split(' ')?.[0]);
                return {
                    ...node,
                    directionNumber: node.directions?.includes('公里') ? editDistance : editDistance / 1000,
                };
            })
            .filter(node => {
                return node.directionNumber <= state.sliderValue;
            });
    }, [state.sliderValue, state.localList, state.currentPosition]);

    //RandomTab輪盤資料
    const wheelData = useMemo(() => {
        return filterLocalList?.reduce((acc, node) => {
            let shortName = node.name;
            if (shortName.length > 5) {
                shortName = `${node.name.slice(0, 5) + '...'}`;
            }
            return [...acc, { option: shortName }];
        }, []);
    }, [filterLocalList, state.localList]);

    //RandomTab輪盤名稱
    const localListNames = useMemo(() => {
        return state.localList.map(node => node.name);
    }, [state.localList]);

    function getCurrentPosition() {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position?.coords;
            updateState({ currentPosition: { lat: latitude, lng: longitude }, isEnterView: true });
        });
    }
    //getLocalStorageList距離計算並將結果再回傳到list，配合FavTab距離篩選，不能採用directionsCallback，directionsCallback是點選後才能計算
    async function getLocalStorageList() {
        let localList = JSON.parse(localStorage.getItem('myData')) || [];
        let updateLocalList = await Promise.all(
            localList?.map(async node => {
                return {
                    ...node,
                    directions: await countDistance(
                        state.currentPosition?.lat,
                        state.currentPosition?.lng,
                        node.location?.lat,
                        node.location?.lng,
                    ),
                };
            }),
        );
        updateState({
            localList: updateLocalList,
        });
        return localList;
    }

    function onPlaceChanged() {
        const place = state?.autocomplete?.getPlace();
        if (!isEmpty(place?.place_id)) {
            getPhoto(place?.place_id).then(imgUrl => {
                const parseSelectedRestaurant = JSON.parse(
                    JSON.stringify({
                        location: place?.geometry?.location,
                        placeId: place?.place_id,
                        name: place?.name,
                        img: imgUrl,
                    }),
                );
                updateState({
                    selectedRestaurant: parseSelectedRestaurant,
                    tab: 'historyTab',
                    inputValue: '',
                });
            });
        }
    }
    function handleSpinClick() {
        updateState({
            prizeNumber: Math.floor(Math.random() * wheelData?.length),
        });
        setTimeout(() => {
            updateState({
                isWheelShowText: false,
                isMustSpin: true,
            });
        }, 100);
    }

    //一開始的畫面，會先取得目前位置
    useEffect(() => {
        getCurrentPosition();
    }, []);

    //有了目前位置後才能取得localList資料，因為要計算距離
    useEffect(() => {
        getLocalStorageList();
    }, [state.currentPosition]);

    //插件提供的API，可以直接計算出距離
    const directionsCallback = useCallback(response => {
        if (!isEmpty(response)) {
            updateState({
                directions: response,
                directionsText: response.routes[0].legs[0].distance.text,
            });
        }
    }, []);

    //如果有selectedRestaurant那tempList暫存的列表就會更新
    useEffect(() => {
        if (!isEmpty(state.selectedRestaurant)) {
            const isDuplicate = state.tempList.some(item => item.placeId === state.selectedRestaurant.placeId);
            if (!isDuplicate) {
                updateState({
                    tempList: [...state.tempList, state.selectedRestaurant],
                });
            }
        }
    }, [onPlaceChanged, state.selectedRestaurant]);

    return (
        isLoaded && (
            <>
                {state.isEnterView && !isEmpty(iconImage) && state.currentPosition.lat !== 0 ? (
                    <div className={'overflow-hidden'}>
                        <GoogleMap
                            id='map'
                            clickableIcons={false}
                            ref={mapElementRef}
                            className='relative'
                            mapContainerStyle={{
                                width: '100%',
                                height: '75vh',
                            }}
                            center={state.currentPosition}
                            zoom={16}
                        >
                            {/* 附近20間餐廳地點 */}
                            <MarkerF position={state.currentPosition}></MarkerF>
                            {!isEmpty(state.nearbySearch) &&
                                state.nearbySearch.map((item, index) => {
                                    const itemNameMore =
                                        item.name.split('').length > 8 ? `${item.name.slice(0, 8) + '...'}` : item.name;
                                    return (
                                        <Marker
                                            key={index}
                                            icon={{
                                                url: '//',
                                                scaledSize: new window.google.maps.Size(120, 50), // 寬度與高度
                                            }}
                                            position={{
                                                lat: item.geometry.location.lat(),
                                                lng: item.geometry.location.lng(),
                                            }}
                                            label={{
                                                className: `rounded border-1  p-1  border-gray-950  cursor-pointer 
                                                ${localListNames.includes(item.name) ? 'bg-main' : 'bg-white'}
                                                ${state.selectedRestaurant?.name === item?.name ? 'opacity-0' : ''}`,
                                                backgroundColor: 'red',
                                                color: 'black',
                                                fontWeight: 'bold',
                                                text: itemNameMore,
                                                fontSize: '14px',
                                            }}
                                            onClick={() => {
                                                getPhoto(item.place_id).then(imgUrl => {
                                                    updateState({
                                                        selectedRestaurant: {
                                                            location: {
                                                                lat: item.geometry.location.lat(),
                                                                lng: item.geometry.location.lng(),
                                                            },
                                                            placeId: item.place_id,
                                                            name: item.name,
                                                            img: imgUrl,
                                                        },
                                                    });
                                                });
                                                localListNames.includes(item.name)
                                                    ? updateState({
                                                          tab: 'favoriteTab',
                                                      })
                                                    : updateState({
                                                          tab: 'historyTab',
                                                      });
                                                scrollIntoView(item?.place_id);
                                            }}
                                        ></Marker>
                                    );
                                })}
                            {!isEmpty(state.selectedRestaurant?.location) && (
                                <>
                                    {/* A-B點路線搜尋 */}
                                    <DirectionsService
                                        options={directionsServiceOptions}
                                        callback={directionsCallback}
                                    />

                                    {/* B點渲染 */}
                                    <DirectionsRenderer
                                        options={{
                                            directions: state.directions,
                                        }}
                                    />

                                    {/* B點資訊 */}
                                    <InfoWindow
                                        position={state.selectedRestaurant?.location}
                                        options={{
                                            zIndex: 100,
                                        }}
                                    >
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${state.selectedRestaurant?.location?.lat},${state.selectedRestaurant?.location?.lng}&dir_action=walk`}
                                            className='location text-[14px]'
                                            style={{
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <div className='text-center text-black'>
                                                <div
                                                    className='flex items-center justify-center'
                                                    style={{
                                                        backgroundColor: 'var(--color-cyan)',
                                                        border: '1px solid black',
                                                    }}
                                                >
                                                    <div className='p-1.5 text-[13px] font-bold flex'>
                                                        <SignTurnSlightLeft size={16} className='mr-2' /> 點選導航：約
                                                        {state.directionsText}
                                                    </div>
                                                </div>
                                                <div className='flex flex-col'>
                                                    <div
                                                        style={{
                                                            backgroundImage: `url(${state.selectedRestaurant.img})`,
                                                            width: '220px',
                                                            height: '120px',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center center',
                                                            borderLeft: '1px solid var(--color-black)',
                                                            borderRight: '1px solid var(--color-black)',
                                                        }}
                                                    ></div>
                                                    <div
                                                        className='p-1.5 text-[13px] font-bold'
                                                        style={{
                                                            backgroundColor: state.localList
                                                                .map(node => node.name)
                                                                .includes(state.selectedRestaurant.name)
                                                                ? 'var(--color-primary)'
                                                                : '',
                                                            border: '1px solid var(--color-black)',
                                                        }}
                                                    >
                                                        {state.selectedRestaurant?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </InfoWindow>
                                </>
                            )}
                            {/* 搜尋框 */}
                            <Autocomplete
                                onLoad={autocomplete => {
                                    updateState({
                                        autocomplete: autocomplete,
                                    });
                                }}
                                restrictions={{
                                    country: 'tw',
                                }}
                                options={autocompleteOptions}
                                onPlaceChanged={onPlaceChanged}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        transform: 'translate(-50%, -50%)',
                                        top: '9%',
                                        left: '50%',
                                        width: '80vw',
                                    }}
                                >
                                    <input
                                        type='text'
                                        className='h-10 w-100 searchInput p-3 mb-1 rounded-1'
                                        placeholder='請搜尋附近的餐廳'
                                        value={state.inputValue}
                                        onChange={e =>
                                            updateState({
                                                inputValue: e.target.value,
                                            })
                                        }
                                        style={{
                                            border: '1.5px var(--color-black) solid',
                                            background: 'white',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                    <div className='flex justify-between'>
                                        <div
                                            className='bg-white px-3 py-1 rounded-1 text-[14px] cursor-pointer'
                                            style={{
                                                border: '1px black solid',
                                                background: 'white',
                                                boxShadow: !isEmpty(state.nearbySearch)
                                                    ? '4px 4px rgba(0,0,0,0.9)'
                                                    : '',
                                            }}
                                            onClick={() => {
                                                const service = new window.google.maps.places.PlacesService(
                                                    document.createElement('div'),
                                                );
                                                const request = {
                                                    location: {
                                                        lat: state.currentPosition.lat,
                                                        lng: state.currentPosition.lng,
                                                    },
                                                    radius: 950,
                                                    type: ['restaurant'],
                                                };
                                                service.nearbySearch(request, (results, status) => {
                                                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                                                        updateState({
                                                            nearbySearch: results,
                                                            tab: 'historyTab',
                                                        });
                                                    }
                                                });
                                            }}
                                        >
                                            1KM 隨意搜尋好吃的
                                        </div>

                                        <div
                                            className='p-1 rounded-1 text-[14px]'
                                            style={{
                                                border: '1px black solid',
                                                background: 'white',
                                                zIndex: '100',
                                            }}
                                            onClick={() => {
                                                updateState({
                                                    selectedRestaurant: {},
                                                    directions: {},
                                                });
                                            }}
                                        >
                                            清除
                                        </div>
                                    </div>
                                </div>
                            </Autocomplete>
                        </GoogleMap>

                        <div className='absolute w-100 fixed bottom-0'>
                            <div className='rounded-t-lg shadow-black'>
                                <div
                                    className='bg-white pt-2'
                                    style={{
                                        borderTop: '1.2px black solid',
                                    }}
                                >
                                    <div className='justify-between flex container-lg mb-3'>
                                        <div className='flex'>
                                            <Tab
                                                tab={state.tab}
                                                onSelected={() => {
                                                    updateState({
                                                        tab: 'historyTab',
                                                    });
                                                }}
                                                tabName={'historyTab'}
                                            />
                                            <Tab
                                                tab={state.tab}
                                                onSelected={() => {
                                                    updateState({
                                                        tab: 'favoriteTab',
                                                    });
                                                }}
                                                tabName={'favoriteTab'}
                                            />
                                        </div>
                                        {!isEmpty(filterLocalList) && state.tab === 'favoriteTab' && (
                                            <div className='mr-2'>
                                                <Tab
                                                    tab={state.tab}
                                                    onSelected={() => {
                                                        updateState({
                                                            tab: 'randomTab',
                                                        });
                                                    }}
                                                    tabName={'randomTab'}
                                                    handleSpinClick={handleSpinClick}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className='container-lg'>
                                        {
                                            {
                                                historyTab: (
                                                    <div
                                                        className='overflow-scroll'
                                                        style={{
                                                            height: '25vh',
                                                        }}
                                                    >
                                                        <div className='h-100 w-100'>
                                                            <div id='scrollTop'></div>
                                                            {!isEmpty(state.tempList) ? (
                                                                state?.tempList?.map((node, index) => {
                                                                    return (
                                                                        <Item
                                                                            key={node.placeId}
                                                                            className='cursor-pointer'
                                                                            node={node}
                                                                            selectedRestaurant={
                                                                                state.selectedRestaurant
                                                                            }
                                                                            localList={state.localList}
                                                                            onSelected={() => {
                                                                                updateState({
                                                                                    selectedRestaurant: node,
                                                                                });
                                                                            }}
                                                                            onSave={node => {
                                                                                updateState({
                                                                                    localList: [
                                                                                        node,
                                                                                        ...state.localList,
                                                                                    ],
                                                                                });
                                                                                localStorage.setItem(
                                                                                    'myData',
                                                                                    JSON.stringify([
                                                                                        node,
                                                                                        ...state.localList,
                                                                                    ]),
                                                                                );
                                                                                getLocalStorageList();
                                                                            }}
                                                                            type={'Search'}
                                                                        />
                                                                    );
                                                                })
                                                            ) : (
                                                                <div
                                                                    className='font-bold'
                                                                    style={{
                                                                        textAlign: 'center',
                                                                        position: 'absolute',
                                                                        top: '50%',
                                                                        left: '50%',
                                                                        transform: 'translate(-50%, -50%)',
                                                                        background: 'white',
                                                                        color: 'var(--color-black)',
                                                                    }}
                                                                >
                                                                    尚無搜尋紀錄
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                                favoriteTab: (
                                                    <div>
                                                        <div className='row mx-2 z-[30]'>
                                                            <div className='col-2 font-bold text-[13px]'>
                                                                <div className='col'>距離</div>
                                                                <div className='col'>
                                                                    {state.sliderValue >= 1
                                                                        ? `${state.sliderValue}KM`
                                                                        : `${state.sliderValue * 1000}M`}
                                                                </div>
                                                            </div>
                                                            <div className='col-10'>
                                                                <Slider
                                                                    className='z-[10]'
                                                                    aria-label='Temperature'
                                                                    onChange={e => {
                                                                        updateState({
                                                                            sliderValue: e.target.value,
                                                                        });
                                                                    }}
                                                                    value={state.sliderValue}
                                                                    disabled={false}
                                                                    marks={false}
                                                                    max={1}
                                                                    step={0.2}
                                                                    min={0}
                                                                    valueLabelDisplay='auto'
                                                                    defaultValue={20}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className='overflow-scroll'
                                                            style={{
                                                                height: '20vh',
                                                            }}
                                                        >
                                                            <div id='scrollTop'></div>
                                                            {!isEmpty(filterLocalList) ? (
                                                                filterLocalList?.map((node, index) => {
                                                                    return (
                                                                        <Item
                                                                            key={node.placeId}
                                                                            className='cursor-pointer'
                                                                            node={node}
                                                                            selectedRestaurant={
                                                                                state.selectedRestaurant
                                                                            }
                                                                            onSelected={() => {
                                                                                updateState({
                                                                                    selectedRestaurant: node,
                                                                                });
                                                                            }}
                                                                            onDeleted={node => {
                                                                                let list = filterLocalList.filter(
                                                                                    filterNode => {
                                                                                        return (
                                                                                            filterNode.name !==
                                                                                            node.name
                                                                                        );
                                                                                    },
                                                                                );

                                                                                updateState({
                                                                                    localList: list,
                                                                                });
                                                                                localStorage.setItem(
                                                                                    'myData',
                                                                                    JSON.stringify(list),
                                                                                );
                                                                            }}
                                                                            type={'Fav'}
                                                                        />
                                                                    );
                                                                })
                                                            ) : (
                                                                <div
                                                                    className='font-bold'
                                                                    style={{
                                                                        textAlign: 'center',
                                                                        position: 'absolute',
                                                                        top: '50%',
                                                                        left: '50%',
                                                                        transform: 'translate(-50%, -50%)',
                                                                        background: 'white',
                                                                        color: 'var(--color-black)',
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
                                                        className='fixed w-100 h-100 left-0 top-0 z-[99] flex justify-center items-center'
                                                        style={{
                                                            backgroundColor: 'rgba(0,0,0,0.9)',
                                                        }}
                                                    >
                                                        <div
                                                            className='relative'
                                                            style={{
                                                                marginTop: 'auto',
                                                                marginBottom: 'auto',
                                                            }}
                                                        >
                                                            {
                                                                <>
                                                                    <Wheel
                                                                        spinDuration={0.1}
                                                                        mustStartSpinning={state.isMustSpin}
                                                                        prizeNumber={state.prizeNumber}
                                                                        backgroundColors={
                                                                            wheelData?.length % 2 === 0
                                                                                ? ['#c7edf9', '#faf2c7']
                                                                                : ['#c7edf9', '#e8dbf8', '#faf2c7']
                                                                        }
                                                                        textColors={['black']}
                                                                        innerRadius={4}
                                                                        innerBorderColor='black'
                                                                        innerBorderWidth={10}
                                                                        radiusLineWidth={0}
                                                                        outerBorderColor='white'
                                                                        outerBorderWidth={10}
                                                                        fontSize={18}
                                                                        data={wheelData}
                                                                        onStopSpinning={value => {
                                                                            state.localList.forEach(node => {
                                                                                if (
                                                                                    node.name.includes(
                                                                                        wheelData[
                                                                                            state.prizeNumber
                                                                                        ].option
                                                                                            .split('...')
                                                                                            .join(''),
                                                                                    )
                                                                                ) {
                                                                                    updateState({
                                                                                        selectedRestaurant: node,
                                                                                        isWheelShowText: true,
                                                                                    });
                                                                                    setTimeout(() => {
                                                                                        updateState({
                                                                                            tab: 'favoriteTab',
                                                                                            isMustSpin: false,
                                                                                        });
                                                                                    }, 1000);
                                                                                }
                                                                            });
                                                                        }}
                                                                    />
                                                                    <button
                                                                        className='w-8 h-8  bg-white z-10 absolute font-bold rounded-full text-[11px]'
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '50%',
                                                                            left: '50%',
                                                                            transform: 'translate(-50%, -50%)',
                                                                            boxShadow: '3px 3px rgba(0,0,0,0.8)',
                                                                        }}
                                                                        onClick={handleSpinClick}
                                                                    ></button>
                                                                </>
                                                            }
                                                        </div>
                                                        {state.isWheelShowText && (
                                                            <div
                                                                className='w-100 font-bold'
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '50%',
                                                                    left: '50%',
                                                                    transform: 'translate(-50%, -50%)',
                                                                    background: 'var(--color-black)',
                                                                    borderTop: '2px white solid',
                                                                    borderBottom: '2px white solid',
                                                                    zIndex: 30,
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                <div className='text-center p-8'>
                                                                    <div className='text-[16px] mb-4'>
                                                                        你選到的餐廳是
                                                                    </div>
                                                                    <div className='text-[20px]'>
                                                                        "{state.selectedRestaurant.name}"
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            }[state.tab]
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='w-100 vh-100 font-bold relative'>
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                            }}
                        >
                            <img src={iconImage} className='mb-4' style={{ width: '120px' }} />
                            <div>ㄟ！到底吃什麼？</div>
                        </div>
                    </div>
                )}
            </>
        )
    );
}

export default React.memo(App);
