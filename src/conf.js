export const COLOR_TEXT = '#4af626';
export const COLOR_BLACK = '#000';
export const COLOR_GRAY1 = '#333';
export const COLOR_GRAY2 = '#666';
export const baseContainerOpt = {
  top: 0,
  left: 0,
  width: '40%',
  height: '50%',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: COLOR_GRAY1 },
  }
};
export const defaultListStyle = { 
  item: { fg: 'white', bg: 'black' }, 
  selected: { fg: '#999', bg: COLOR_GRAY2 }, 
  border: { fg: COLOR_GRAY2 },
  focus: { border: { fg: COLOR_TEXT }, selected: { bg: COLOR_TEXT, fg: COLOR_BLACK } }
};
export const defaultListbarStyle = {
  bg: COLOR_BLACK,
  item: { bg: COLOR_GRAY1 },
  selected: { bg: COLOR_GRAY2, fg: '#999' },
  focus: { bg: COLOR_BLACK, item: { bg: COLOR_BLACK }, selected: { bg: COLOR_TEXT, fg: COLOR_BLACK } },
};
export const PanelsType = {
  API: 1,
  ENDPOINT: 2,
  SERVER: 3,
  BODY: 4,
};
export const RequestTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
export const defaultHeaders = {
  Accept: '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
};

