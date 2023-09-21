
import { Star,XLg } from 'react-bootstrap-icons';
import  { removeDuplicates, isEmpty}  from "../methods";

const Item =({node,selectedRestaurant ,setSelectedRestaurant ,localList,filterLocalList, setLocalList, type})=>{

  const existingItem = localList?.find(item => item?.name === node?.name)
    return (
              <div 
              id={node.placeId}
              className={"text-[14px] flex cursor-pointer m-2 mb-3 flex-nowrap items-center justify-between rounded-2 p-2"}
              style={{
                "border":  node?.name === selectedRestaurant?.name ? "1px black solid" : "1px solid #d1d1d1",
                "boxShadow": node?.name === selectedRestaurant?.name ? '6px 6px rgba(0,0,0,0.9)' :''
              }}
              onClick={()=>{
                setSelectedRestaurant({...node})
              }}>
                {node?.name}

              {  
                type === 'Search' ?
                  <div 
                    className={`btn-sm btn-style`}> 
                    <div className={`p-1 rounded-2 ${existingItem ?'' :'border'}`} style={{'background': existingItem ?'#faf2c7':'#fbfbfb'}} >
                        <Star size={18} />
                    </div>
                  </div>
                  : <div 
                    className={`btn-sm btn-style`}
                    onClick={(e)=>{
                    window.alert(`已刪除${node?.name}`)
                    e.stopPropagation()
                   setLocalList(filterLocalList.filter((filterNode)=>{
                       return filterNode.name !== node.name
                   }))
                   if(node.name === selectedRestaurant){
                           setSelectedRestaurant({})
                   }
                  }}>
                       <div className="p-1 border rounded-2" style={{'background': '#f8dbdb'}} >
                           <XLg color="info" size={18} />
                       </div>
               </div>
              }
              </div>

    )
}

export default Item;