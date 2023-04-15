import { PanelsType } from "./conf.js";
import RQBaseList from "./baseList.js";

class RQApiBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `APIs[${PanelsType.API}]`, 'API', options);
    this.buttonLabel = 'add API';
  }
  selectItem(index) {
    this.mainApp.setActiveAPI(this.dataList[index]);
  }
  deleteDone(index) {
    const api = this.dataList[index];
    const endpointDBKey = this.mainApp.containers.endpoints.DBKey
    const endpoints = this.mainApp.getDBItem(endpointDBKey);
    if (endpoints) {
      const newEndpoints = JSON.parse(JSON.stringify(endpoints));
      if(api in newEndpoints) {
        delete newEndpoints[api];
        this.mainApp.setDBItem(endpointDBKey, newEndpoints);
      }
    }
    super.deleteDone(index);
  }
  refreshList() {
    this.list.setItems(this.makeListItems(this.dataList));
  }
  makeListItems(data) {
    const endpointsData = this.mainApp.getDBItem(this.mainApp.containers.endpoints.DBKey) || {};
    const newData = [];
    data.map((item, index)=> {
      const eNum = item in endpointsData ? endpointsData[item].length : 0;
      newData.push(` ${index + 1}: (${eNum})${item}`);
    });
    return newData;
  }
  deleteItem(index) {
    this.question.ask(`Delete API:${this.dataList[index]} with all endpoints?`, (_, answer) => {
      if(answer) {
        this.deleteDone(index); 
      }
    });
  }
}

export default RQApiBox;
