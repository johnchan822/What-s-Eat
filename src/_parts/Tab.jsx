import { ClockHistory,Star, Dice3} from 'react-bootstrap-icons';


const Tab =({tab, setTab ,tabName ,handleSpinClick})=>{
  const tabStyles = {
    history: { background: '#c7edf9' },
    favourite: { background: '#faf2c7' },
    random: { background: '#d1d1d1' },
  };
    return (
        <div 
        className={`tab cursor-pointer px-2 py-2 rounded-2 mx-1 font-bold ${tab === tabName ? 'active btn-info' : 'btn-secondary'}`}
        style={{
          "border":  tab === tabName ? "1px black solid" : "1px solid #d1d1d1",
          "background": 'white',
          "boxShadow":  tab === tabName ? '4px 4px rgba(0,0,0,0.9)': 'none' ,
          // ...((tab === tabName) ? tabStyles[tabName] : {}),
        }}
        onClick={()=>{
          setTab(tabName)
          if(tabName === 'random'){
            handleSpinClick()
          }
         

        }}>
      <div className="p-1 rounded-2"
      style={tabStyles[tabName]}>

      { function(){
        switch(tabName){
        case 'history' : return (  <ClockHistory  size={20} />)
        case 'favourite' : return (  <Star  size={20} />)
        case 'random' : return (  <Dice3  size={20} />)
      }}()
      }
      </div>
      
        </div>
    )
}

export default Tab;