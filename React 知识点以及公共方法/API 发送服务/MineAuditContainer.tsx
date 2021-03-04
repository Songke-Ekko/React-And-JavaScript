import React, { useEffect, useState } from 'react';
import moment, { Moment } from 'moment'

import InfiniteTable from '../../components/table/InfiniteTable'
import  { ColumnProps } from 'antd/lib/table'
import Highlighter from 'react-highlight-words';
import TableSearchFilter from '../../components/table/filter/TableSearchFilter'
import TableSelectFilter from '../../components/table/filter/TableSelectFilter'
import ResourceLink from '../../components/link/ResourceLink'
import API from '@superid/API'
import StateItem from '../../components/state/StateItem'
import RoleItem from '@superid/components/RoleItem'
import TableDateRangeFilter from '../../components/table/filter/TableDateRangeFilter'
import { AuditMemberTypeMap } from '../../enums/audit/AuditMemberType'
import { AuditHandleStateMap } from '../../enums/audit/AuditHandleState'
import styles from './MineContainer.scss';
import { AuditSourceTypeMap } from '../../enums/audit/AuditSourceType'
import { SortOptions } from '../../components/table/filter/TableFilterBase'
import { fromJS } from 'immutable'
import { connect } from 'react-redux'
import NoticeModal from '../notice/NoticeModal'
export interface MineAuditContainerProps {
  affair: any,
  roleIds: any,
  user: any,
}
const IdentityOptions = Object.entries(AuditMemberTypeMap).map(([key, v]) => ({ ...v, key }) )
const StateOptions = Object.entries(AuditHandleStateMap)
  .map(([key, v]) => ({ ...v, key }))
const ItemHeight = 50

const MineAuditContainer: React.FC<MineAuditContainerProps> = ({
  affair,
  roleIds,
  user,
}) => {
  const [hasMore, setHasMore] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  const [data, setData] = useState([]);
  const [sorter, setSorter] = useState({
    key: null,
    value: null,
  } as SortOptions<'sendTime'>);
  const [filters, setFilters] = useState({
    title: '',
    identity: IdentityOptions,
    state: StateOptions,
    sendTime: [] as Array<Moment>
  });

  const [activeAuditMessage, setActiveAuditMessage] = useState(null);

  const onChangeSorter = (key) => (value) => {
    setSorter({
      key: value ? key : null,
      value
    })
  }

  const onChangeFilter = (type) => (value) => {
    setFilters(filters => ({...filters, [type]: value }))
  }

  const handleFetchMore = async (initial = false) => {
    const sizeToFetch = Math.floor(window.innerHeight / ItemHeight) + 5
    const json = await API.query({
      url: '/audit/todo-message/my',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      userId: user.get('id'),
      option: {
        method: 'POST',
        body: JSON.stringify({
          beOperatedRoleIds: roleIds && roleIds.length > 0 ? roleIds : null,
          page: initial ? 0 : pageNum,
          size: sizeToFetch,
          identities: filters.identity.length > 0 ? filters.identity.map(v => v.key * 1) : null,
          title: filters.title ? filters.title : undefined,
          states: filters.state.length === StateOptions.length ? [] : filters.state.map(v => v.key * 1),
          intervals: filters.sendTime.map(v => v.valueOf()),
          ...(sorter.key === 'sendTime' ? { createTimeASC: sorter.value === 'asc' } : {})
        })
      },
      searchParams: {
        mobile: false,
      }
    })
    if (json.code != 0) { return }
    const nextData = json.data.roleRelationTodoMessageVOS;
    setData(prevData => ((initial ? [] : prevData).filter(v => !nextData.some(u => v.operationId === u.operationId && v.receiverRoleId === u.receiverRoleId)).concat(nextData || [])));
    setHasMore(sizeToFetch === nextData.length);
    setPageNum(pageNum => pageNum + 1);
  }

  const columns: ColumnProps<any>[] = [
    {
      title: (
        <TableSearchFilter
          label="审批内容"
          value={filters.title}
          onChange={onChangeFilter('title')}
        />
      ),
      dataIndex: 'title',
      width: '35%',
      render: (_, item) => {
        const text = `${RoleItem.getRoleText(item.applicant, affair.get('id'), affair.get('allianceId')).replace(/<em>/g, '').replace(/<\/em>/g, '')} ${item.content.replace(/<em>/g, '').replace(/<\/em>/g, '') || ''}`
        return <Highlighter
          searchWords={[filters.title]}
          autoEscape
          textToHighlight={text}
          className={styles.highlightWrapper}
        />
      }
    },
    {
      title: (
        <TableSelectFilter
          label="参与身份"
          options={IdentityOptions}
          value={filters.identity}
          onChange={onChangeFilter('identity')}
          renderItem={item => item.label}
        />
      ),
      dataIndex: 'identity',
      width: '13%',
      render: value => <div><div>{AuditMemberTypeMap[value] && AuditMemberTypeMap[value].label}</div></div>
    },
    {
      title: (
        <TableSelectFilter
          label="状态"
          options={StateOptions}
          value={filters.state}
          onChange={onChangeFilter('state')}
          renderItem={item => item.label}
        />
      ),
      dataIndex: 'handleState',
      width: '13%',
      render: (state) => state != null ? (
        <StateItem value={state} config={AuditHandleStateMap} />
      ) : null,
    },
    {
      title: '来自',
      dataIndex: 'source',
      width: '24%',
      render: (source) => source ? (
        <ResourceLink 
          type={AuditSourceTypeMap[source.type] && AuditSourceTypeMap[source.type].taskSourceType}
          label={source.name} 
          affair={affair} 
          target={{ affairId: source.affairId, sourceId: source.id }}
        />
      ) : null
    },
    {
      title: (
        <TableDateRangeFilter
          label="发起时间"
          value={filters.sendTime}
          onChange={onChangeFilter('sendTime')}
          sorter={{
            value: sorter.key === 'sendTime' ? sorter.value : null,
            onChange: onChangeSorter('sendTime')
          }}
        />
      ),
      dataIndex: 'sendTime',
      width: '20%',
      render: value => <div><div>{moment(value).format('YYYY.MM.DD HH:mm')}</div></div>,
    }
  ]

  useEffect(() => {
    handleFetchMore(true);
    setPageNum(0);
    setHasMore(false);
  }, [filters, roleIds, sorter])

  const renderModal = () => {
    if (!activeAuditMessage) { return null }
    console.log(activeAuditMessage);

    const optional = activeAuditMessage.optional
    const taskId = optional.indexOf ? (optional.indexOf('task') !== -1 ? JSON.parse(optional).task : 0) : 0
    return (
      <NoticeModal
        message={fromJS(activeAuditMessage).set('isAuditMessage', true)}
        affair={affair}
        code={activeAuditMessage.operationType}
        onHide={() => setActiveAuditMessage(null)}
        taskDetailModalProps={{
          affair,
          taskId: taskId,
          onCancel: () => setActiveAuditMessage(null),
        }}
      />
    )
  }

  return(
    <div style={{ padding: '30px 30px 0 30px', width: '100%', height: '100%', }}>
      <InfiniteTable
        data={data}
        hasMore={hasMore}
        fetchMore={handleFetchMore}
        tableProps={{
          columns: columns,
          bordered: true,
          rowKey: (item) => `${item.operationId}${item.receiverRoleId}${item.sendTime}`,
          onRowClick: (record) => {
            setActiveAuditMessage(record);
          }
        }}
      />
      {renderModal()}
    </div>
  )
}

function mapStateToProps(state){
  return {
    user: state.get('user')
  }
}

export default connect(mapStateToProps, () => {})(MineAuditContainer);
