import { ClockHistory, Star, Dice3 } from 'react-bootstrap-icons';

const Tab = ({ tab, onSelected, tabName, handleSpinClick }) => {
    const tabStyles = {
        historyTab: { background: 'var(--color-secondary)' },
        favoriteTab: { background: 'var(--color-primary)' },
        randomTab: { background: 'var(--color-grey)' },
    };
    return (
        <div
            className={`col-auto tab mx-2 cursor-pointer p-2 rounded-2  font-bold ${
                tab === tabName ? 'active btn-info' : 'btn-secondary'
            }`}
            style={{
                border: tab === tabName ? '1px black solid' : '1px solid var(--color-grey)',
                background: 'white',
                boxShadow: tab === tabName ? '4px 4px rgba(0,0,0,0.9)' : 'none',
                // ...((tab === tabName) ? tabStyles[tabName] : {}),
            }}
            onClick={() => {
                onSelected(tabName);
                if (tabName === 'randomTab') {
                    handleSpinClick();
                }
            }}
        >
            <div className='p-1 rounded-2' style={tabStyles[tabName]}>
                {(function () {
                    switch (tabName) {
                        case 'historyTab':
                            return <ClockHistory size={20} />;
                        case 'favoriteTab':
                            return <Star size={20} />;
                        case 'randomTab':
                            return <Dice3 size={20} />;
                    }
                })()}
            </div>
        </div>
    );
};

export default Tab;
