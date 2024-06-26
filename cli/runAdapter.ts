import * as fs from "fs";
import * as path from "path";
import { Adapter, AdapterType, ChainBlocks } from "../adapters/types";
import { getUniqStartOfTodayTimestamp } from "../helpers/getUniSubgraphVolume";
import runAdapter from "../adapters/utils/runAdapter";
import { canGetBlock, getBlock } from "../helpers/getBlock";
import getChainsFromDexAdapter from "../adapters/utils/getChainsFromDexAdapter";
import { execSync } from "child_process";
import CouchDBClient from "../utils/couchDb";

function checkIfFileExistsInMasterBranch(filePath: any) {
  const res = execSync(`git ls-tree --name-only -r master`);

  const resString = res.toString();
  if (!resString.includes(filePath)) {
    console.log("\n\n\nERROR: Use Adapter v2 format for new adapters\n\n\n");
    process.exit(1);
  }
}

// tmp
// const handleError = (e: Error) => console.error(e);
const couchClient = new CouchDBClient();

// Add handler to rejections/exceptions
// process.on("unhandledRejection", handleError);
// process.on("uncaughtException", handleError);

// Check if all arguments are present
// checkArguments(process.argv)

function getTimestamp30MinutesAgo() {
  return Math.trunc(Date.now() / 1000) - 60 * 30;
}

async function getAdapterData(
  adapterName: string,
  type: string,
  timestamp: any = null
) {
  const adapterType: AdapterType = type as AdapterType;
  const file = `${adapterType}/${adapterName}`;

  const passedFile = path.resolve(process.cwd(), `./${file}`);
  const cleanDayTimestamp = timestamp
    ? Number(timestamp)
    : getUniqStartOfTodayTimestamp(new Date());
  let endCleanDayTimestamp = cleanDayTimestamp;
  // console.info(`🦙 Running ${adapterName.toUpperCase()} adapter 🦙`)
  // console.info(`_______________________________________`)
  // Import module to test
  let module: Adapter = (await import(passedFile)).default;
  const adapterVersion = module.version;
  let endTimestamp = endCleanDayTimestamp;
  if (adapterVersion === 2) {
    endTimestamp = timestamp ? Number(timestamp) : getTimestamp30MinutesAgo(); // 1 day;
  } else {
    checkIfFileExistsInMasterBranch(file);
  }

  // const runAt = adapterVersion === 2 ? endTimestamp : timestamp ? Number(timestamp) : endTimestamp - 1;
  // console.info(`${upperCaseFirst(adapterType)} for ${formatTimestampAsDate(String(getUniqStartOfTodayTimestamp(new Date((runAt * 1000)))))}`)
  // console.info(`_______________________________________\n`)

  // Get closest block to clean day. Only for EVM compatible ones.
  const allChains = getChainsFromDexAdapter(module).filter(canGetBlock);

  const chainBlocks: ChainBlocks = {};
  await Promise.all(
    allChains.map(async (chain) => {
      try {
        const latestBlock = await getBlock(
          endTimestamp,
          chain,
          chainBlocks
        ).catch(() => null);
        // ).catch((e: any) =>
        // console.error(`${e.message}; ${endTimestamp}, ${chain}`)
        // );
        if (latestBlock) chainBlocks[chain] = latestBlock;
      } catch (e) {
        // console.log(e);
      }
    })
  );
  const moduleSlugs = await couchClient.retrieve("cache/module-slugs");
  var dbName = type !== "fees" ? "dexs" : "fees";
  var docName = type === "fees" ? adapterName.replace(".ts", "").toLowerCase() : moduleSlugs[adapterName];
  // console.log(dbName, docName)

  if ("adapter" in module) {
    const adapter = module.adapter;
    // Get adapter
    const volumes = await runAdapter(
      adapter,
      endTimestamp,
      chainBlocks,
      undefined,
      undefined,
      {
        adapterVersion,
      }
    );
    volumes.forEach((element) => {
      var methodology = adapter?.[element.chain].meta?.methodology;
      if (!methodology) methodology = "NO METHODOLOGY SPECIFIED";
      element.methodology = methodology;
    });
    // printVolumes(volumes, adapter)
    // console.info("\n")
    // console.log(`defi-${dbName}/${docName}`);
    await couchClient.insert(`defi-${dbName}/${docName}`, volumes);
  } else if ("breakdown" in module) {
    const breakdownAdapter = module.breakdown;
    const allVolumes = await Promise.all(
      Object.entries(breakdownAdapter).map(([version, adapter]) =>
        runAdapter(adapter, endTimestamp, chainBlocks, undefined, undefined, {
          adapterVersion,
        }).then((res) => ({ version, res }))
      )
    );

    // allVolumes.forEach(({ version, res }) => {
    //   // console.info("Version ->", version.toUpperCase())
    //   // console.info("---------")
    //   // printVolumes(res, breakdownAdapter[version])
    //   res.forEach((element) => {
    //     var methodology =
    //       breakdownAdapter[version]?.[element.chain].meta?.methodology;
    //     if (!methodology) methodology = "NO METHODOLOGY SPECIFIED";
    //     element.methodology = methodology;
    //   });
    //   console.log(version);
    //   await couchClient.insert(`defi-${dbName}/${docName}-${version}`, allVolumes);
    // });
    for (const { version, res } of allVolumes) {
      // console.info("Version ->", version.toUpperCase())
      // console.info("---------")
      // printVolumes(res, breakdownAdapter[version])
      res.forEach((element) => {
        var methodology =
          breakdownAdapter[version]?.[element.chain].meta?.methodology;
        if (!methodology) methodology = "NO METHODOLOGY SPECIFIED";
        element.methodology = methodology;
      });
      // console.log(`defi-${dbName}/${docName}-${version}`)
      await couchClient.insert(`defi-${dbName}/${docName}-${version}`, res);
    }
  } else throw new Error("No compatible adapter found");

  // process.exit(0);
}

export async function getAllAdapters(type: string) {
  const directoryPath = `/home/ubuntu/dimension-adapters/${type}/`;

  const pathFiles = fs.readdirSync(directoryPath);
  const files = pathFiles.filter(
    (file) =>
      fs.statSync(path.join(directoryPath, file)).isDirectory() ||
      fs.statSync(path.join(directoryPath, file)).isFile()
  );
  console.log("\n", type, files.length, "\n");
  for (let i = 0; i < files.length; i++) {
    if (files[i] == "Omnidrome") continue;
    try {
      // console.log(i, files[i]);
      await getAdapterData(files[i], type);
    } catch (e) {
      // console.log(e);
      continue;
    }
  }
}
