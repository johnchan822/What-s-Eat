import { Star, XLg } from 'react-bootstrap-icons';
import { removeDuplicates, isEmpty } from '../methods';
import { memo } from 'react';

const Item = memo(({ node, selectedRestaurant, localList, onSave, onDeleted, onSelected, type }) => {
    const existedItem = localList?.find(item => item?.name === node?.name);
    return (
        <div
            id={node.placeId}
            className={
                'text-[14px] flex cursor-pointer m-2 mb-3 flex-nowrap items-center justify-between rounded-2 p-2'
            }
            style={{
                border: node?.name === selectedRestaurant?.name ? '1px black solid' : '1px solid var(--color-grey)',
                boxShadow: node?.name === selectedRestaurant?.name ? '6px 6px rgba(0,0,0,0.9)' : '',
            }}
            onClick={() => {
                onSelected({ ...node });
            }}
        >
            {node?.name}
            {type === 'Search' ? (
                <div
                    className='btn-sm btn-style'
                    onClick={e => {
                        e.stopPropagation();
                        //如果清單裡面有資料
                        if (existedItem) {
                            // window.alert("已經加入到清單裡面!")
                        } else {
                            onSave(node);
                            // window.alert(`新增 ${node.name}`)
                        }
                    }}
                >
                    <div
                        className={`p-1 rounded-2 ${existedItem ? '' : 'border'}`}
                        style={{
                            background: existedItem ? 'var(--color-primary)' : 'var(--color-white)',
                        }}
                    >
                        <Star size={18} />
                    </div>
                </div>
            ) : (
                <div
                    className='btn-sm btn-style'
                    onClick={e => {
                        // window.alert(`已刪除 ${node?.name}`)
                        e.stopPropagation();
                        onDeleted(node);
                    }}
                >
                    <div
                        className='p-1 border rounded-2'
                        style={{
                            background: 'var(--color-success)',
                        }}
                    >
                        <XLg color='info' size={18} />
                    </div>
                </div>
            )}
        </div>
    );
});

export default Item;
