
import { Star } from 'react-bootstrap-icons';
import  { removeDuplicates, isEmpty}  from "../methods";

const SearchItem =({node,selectedRestaurant ,setSelectedRestaurant ,localList, setLocalList})=>{
  const existingItem = localList?.find(item => item?.name === node?.name);
    return (
              <div className={"text-[14px] flex cursor-pointer my-2 flex-nowrap items-center justify-between rounded-2 py-2"}
              style={{
                "border":  node?.name === selectedRestaurant?.name ? "1px black solid" : "1px solid #d1d1d1",
                "boxShadow": node?.name === selectedRestaurant?.name ? '6px 6px rgba(0,0,0,0.9)' :''
              }}
              onClick={()=>{
                setSelectedRestaurant({...node})
              }}>
                {node?.name}
                  <div className={`btn-sm btn-style`}
                    onClick={(e)=>{
                        e.stopPropagation()
                        //如果清單裡面有資料
                        if(existingItem){
                            window.alert('已經加入到清單裡面!')
                        }else{
                            setLocalList(prevData =>{
                                  // 第一筆資料
                                if(isEmpty(prevData)){
                                    localStorage.setItem('myData',  JSON.stringify([node]));
                                    return node
                                }
                                else{
                                    localStorage.setItem('myData',  JSON.stringify([node,...prevData]));
                                    return removeDuplicates([node,...prevData])
                                }
                            });
                            window.alert(`新增 ${node.name}`)
                        }
                    }}> 
                    <div className={`p-1 rounded-2 ${existingItem ?'' :'border'}`} style={{'background': existingItem ?'#faf2c7':'#fbfbfb'}} >
                        <Star size={18} />
                    </div>
                  </div>
              </div>

    )
}

export default SearchItem;