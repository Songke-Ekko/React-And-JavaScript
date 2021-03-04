import { getPlanMaterials } from '../../../services/shelfGood'

getPlanMaterials(affair, serviceId, begin).then(res => {
    if (res.code == 0) {
      const materials = res.data.map(v => {
        if (v.resourceType == MATERIAL_TYPE.PACKAGE) {
          v.isPackage = true
        }
        return v
      })
      this.setState({
        materialData: materials,
        currentMaterials: searchKey ? materials.filter(v => v.name.includes(searchKey)) : materials.slice(0, PAGE_SIZE),
        materialMore: searchKey ? false : materials.length > PAGE_SIZE,
        currentPage: searchKey ? 0 : materials.length == 0 ? 0 : this.state.currentPage + 1
      }, () => {
        this.getTimeDetail(this.state.currentMaterials.map(v => v.uniqueId), this.state.begin, this.state.end)
      })
    }
  })

getPlanMaterialsTimeDetail(affair, serviceId, uniqueIds, begin, end)