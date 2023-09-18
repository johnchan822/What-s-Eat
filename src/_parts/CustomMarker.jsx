import React, { useEffect, useRef } from 'react';
import { Marker } from '@react-google-maps/api';

const CustomMarker = ({ item, selectedRestaurant, getPhoto, onClick }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    const circle = new window.google.maps.Circle({
      strokeWeight: 0,
      fillColor: 'transparent',
      fillOpacity: 0.0,
      radius: 20, // 调整点击区域的大小，以像素为单位
    });

    circle.bindTo('center', markerRef.current, 'position');
    circle.setMap(window.google.map);

    const marker = new window.google.maps.Marker({
      position: { lat: item.geometry.location.lat(), lng: item.geometry.location.lng() },
      icon: { url: '/' }, // 设置您的图标 URL
      label: {
        className: `bg-white p-10 rounded border-1 border-gray-950 ${
          selectedRestaurant?.name === item?.name ? 'opacity-0' : ''
        }`,
        text: item.name,
        color: 'black',
        fontWeight: 'bold',
      },
      map: window.google.map,
    });

    marker.addListener('click', () => {
      getPhoto(item.place_id).then((imgUrl) => {
        onClick({
          location: { lat: item.geometry.location.lat(), lng: item.geometry.location.lng() },
          placeId: item.place_id,
          name: item.name,
          img: imgUrl,
        });
      });
    });

    return () => {
      marker.setMap(null);
      circle.setMap(null);
    };
  }, [item, selectedRestaurant, getPhoto, onClick]);

  return <></>; // 因为 Marker 已经在 useEffect 内部创建
};

export default CustomMarker;
