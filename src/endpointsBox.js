import { PanelsType } from "./conf.js";
import RQBaseList from "./baseList.js";

class RQEndpointsBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `Endpoints[${PanelsType.ENDPOINT}]`, 'ENDPOINTS', options);
    this.buttonLabel = 'add endpoint';
  }
  setActiveAPI(api) {
    this.list.setLabel(`API: ${api}`);
    const data = this.mainApp.getDBItem(this.DBKey);
    this.list.clearItems();
    this.dataList = [];
    if(data) {
      if(api in data) {
        this.dataList = [...data[api]];
        this.list.setItems(this.makeListItems(this.dataList));
      }
    }
    this.refreshCounter();
  }
  selectItem(index) {
    this.mainApp.setActiveEndpoint(this.dataList[index]);
  }
  deleteDone(index) {
    this.list.removeItem(index);
    this.dataList.splice(index, 1);
    const data = this.mainApp.getDBItem(this.DBKey);
    data[this.mainApp.activeAPI] = [...this.dataList];
    this.mainApp.setDBItem(this.DBKey, JSON.parse(JSON.stringify(data)));
    this.mainApp.render();
  }
  deleteItem(index) {
    this.question.ask(`Delete Endpoint:${this.dataList[index]}?`, (_, answer) => {
      if(answer) {
        this.deleteDone(index); 
      }
    });
  }
  setNewItem(val) {
    if(val) {
      const api = this.mainApp.activeAPI;
      const data = this.mainApp.getDBItem(this.DBKey);
      let newData = {};
      if(data) {
        if (api in data) {
          data[api].push(val);
        } else {
          data[api] = [val];
        }
        newData = data;
      } else {
        newData[api] = [val];
      }
      this.dataList.push(val);
      this.list.clearItems();
      this.list.setItems(this.makeListItems(this.dataList));
      this.mainApp.containers.apis.refreshList();
      this.mainApp.setDBItem(this.DBKey, newData);
      this.mainApp.render();
    }
  }
  redirectFocus() {
    if(!this.mainApp.activeAPI){
      this.mainApp.screen.focusPush(this.mainApp.containers.apis.button);
    }
    this.mainApp.render();
  }
  createBoxContent() {
    super.createBoxContent();
    this.button.on('focus', () => this.redirectFocus());
    this.list.on('focus', () => this.redirectFocus());
  }
}

export default RQEndpointsBox;
