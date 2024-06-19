import { httpGet } from '../../utils/fetchURL';

const fetchLogs = async (timestamp: any) => {
  const res = await httpGet(`https://injex-api-cb4a9db30875.herokuapp.com/api/volume-stats/usd?timestamp=${timestamp.startOfDay}`);
  return {
    dailyVolume: res.dailyVolume,
    totalVolume: res.totalVolume,
    timestamp: timestamp.startOfDay,
  };
};

const adapter: any = {
  version: 2,
  adapter: {
    injective: {
      fetch: fetchLogs,
      start: 1716411599,
    },
  },
};

export default adapter;
