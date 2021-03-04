export async function getPlanMaterials(affair, serviceId, beginTime) {
    return request(`${config.serverUrl}/material/shelf/plan/unique`, {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        searchParams: {
        serviceId,
        beginTime
        }
    })
}

//计划视图，获取菜品时间点信息
export async function getPlanMaterialsTimeDetail(affair, serviceId, uniqueIds, begin, end) {
    return request(`${config.serverUrl}/material/shelf/plan/dots`, {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      allianceId: affair.get('allianceId'),
      body: {
        serviceId,
        uniqueIds,
        begin,
        end
      }
    })
  }
