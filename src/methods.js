
export  const  isEmpty = function(value, isEval = false){
    if (isEval){
        try {
            return eval(value)
        } catch (err){
            return undefined
        }
    }
    return value === undefined || value === null || (typeof value === 'object' && Object.keys(value).length === 0) || (typeof value === 'string' && value.trim().length === 0)
  };

export const  removeDuplicates =(arr)=> {
    const uniqueObjects = arr.reduce((uniqueArr, obj) => {
      const objString = JSON.stringify(obj);
      if (!uniqueArr.some(item => JSON.stringify(item) === objString)) {
        uniqueArr.push(obj);
      }
      return uniqueArr;
    }, []);
  
    return uniqueObjects;
  }

 export const getPhoto = (placeId) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      placeId: placeId,
      fields: ['photos'],
    };
    return new Promise((resolve, reject) => {
      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          if (place.photos && place.photos?.length > 0) {
            const photo = place.photos[0];
            resolve(photo.getUrl());
          } else {
            reject(new Error('未找到相片'));
          }
        } else {
          reject(new Error(`發生錯誤：${status}`));
        }
      });
    });
  };

export const  getDistance = (distance,currentPosition) =>{
  // 兩公里的範圍，單位：公里
  const radius = 6371; // 地球的半徑，單位：公里
  const latRadian = (Math.PI * currentPosition.lat) / 180; // 緯度的弧度值

  const latDelta = (distance / radius) * (180 / Math.PI); // 計算緯度的差異
  const lngDelta = (distance / radius) * (180 / Math.PI) / Math.cos(latRadian); // 計算經度的差異
  
  const delta = {
    lat:latDelta,
    lng:lngDelta
  }
    return delta
  };