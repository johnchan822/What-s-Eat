
import { XLg } from 'react-bootstrap-icons';

const FavouriteItem =({node,selectedRestaurant ,setSelectedRestaurant ,filterLocalList,setLocalList})=>{
    return (
        <div className={"flex justify-between cursor-pointer flex-nowrap rounded-2 my-2 py-2  items-center"}
        style={{
            "border":  node?.name === selectedRestaurant?.name ? "1px black solid" : "1px solid #d1d1d1",
            "boxShadow": node?.name === selectedRestaurant?.name ? '6px 6px rgba(0,0,0,0.9)' :''
          }}
            onClick={(e)=>{
            e.stopPropagation()
            setSelectedRestaurant({...node})
            }}>
            <div>{node.name}</div>
            <div onClick={(e)=>{
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
        </div>
    )
}

export default FavouriteItem;