import { Chain } from "@defillama/sdk/build/general";
import { FetchOptions, FetchResultVolume, SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";

type IContract = {
  [c: string | Chain]: string;
}

const contract: IContract = {
  [CHAIN.AURORA]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.ARBITRUM]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.OPTIMISM]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.BASE]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.ETHEREUM]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.AVAX]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.BSC]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.LINEA]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.MANTA]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.POLYGON]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.POLYGON_ZKEVM]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.FANTOM]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.MODE]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.SCROLL]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.ZKSYNC]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.METIS]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
  [CHAIN.XDAI]: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
}

const fetch: any = async (timestamp: number, _, { chain, getLogs, createBalances, }: FetchOptions): Promise<FetchResultVolume> => {
  const dailyVolume = createBalances();
  const data: any[] = await getLogs({
    target: contract[chain],
    eventAbi: 'event LiFiTransferStarted(bytes32 indexed transactionId, string bridge, string integrator, address referrer, address sendingAssetId, address receiver, uint256 minAmount, uint256 destinationChainId,bool hasSourceSwaps,bool hasDestinationCall )'
  });
  data.forEach((e: any) => {
    if (e.integrator === 'jumper.exchange' || e.integrator === 'jumper.exchange.gas') {
      dailyVolume.add(e.sendingAssetId, e.minAmount);
    }
  });

  return { dailyBridgeVolume: dailyVolume, timestamp, } as any;
};

const adapter: SimpleAdapter = {
  adapter: Object.keys(contract).reduce((acc, chain) => {
    return {
      ...acc,
      [chain]: { fetch, start: 1691625600, }
    }
  }, {})
};

export default adapter;
