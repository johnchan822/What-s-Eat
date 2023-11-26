
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

export function removeDuplicates (arr) {
    const uniqueObjects = arr.reduce((uniqueArr, obj) => {
      const objString = JSON.stringify(obj);
      if (!uniqueArr.some(item => JSON.stringify(item) === objString)) {
        uniqueArr.push(obj);
      }
      return uniqueArr;
    }, []);
  
    return uniqueObjects;
  }

 export  async function getPhoto(placeId)  {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    if(isEmpty(service)){
    return 
    }
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
            reject('未找到相片');
          }
        }
      });
    });
  };

export async function countDistance (lat1, lng1, lat2, lng2)  {
  if (window.google && window.google.maps && window.google.maps.LatLng) {
    const location1 = new window.google.maps.LatLng(lat1, lng1);
    const location2 = new window.google.maps.LatLng(lat2, lng2);

    const directionsService = new window.google.maps.DirectionsService();

    const request = {
      origin: location1,
      destination: location2,
      travelMode: 'WALKING',
    };
    try {
      const response = await directionsService.route(request);
      if (response.status === 'OK') {
        const route = response.routes[0];
        return route.legs[0].distance.text;
      } else {
        throw new Error('没有路線' + response.status);
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  return null; 
};

export function scrollIntoView (scrollToId){
  const element = document.getElementById(scrollToId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }else{
    const element = document.getElementById('scrollTop');
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


